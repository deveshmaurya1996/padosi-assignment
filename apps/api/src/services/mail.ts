import nodemailer from "nodemailer";
import { env } from "../config";
import { AppError } from "../errors";

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth: env.smtp.user
    ? { user: env.smtp.user, pass: env.smtp.pass }
    : undefined,
  // Render often blocks/slow-paths raw SMTP; fail fast instead of hanging ~2min
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
});

function useResendHttp(): boolean {
  return Boolean(
    env.smtp.pass &&
      (env.smtp.host.includes("resend.com") || env.smtp.user === "resend"),
  );
}

function emailSendErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (
    /only send testing emails to your own email/i.test(raw) ||
    /Invalid `to` field/i.test(raw) ||
    /validation_error/i.test(raw)
  ) {
    return "OTP email could not be sent to this address. Check EMAIL_FROM and SMTP_PASS (Resend API key) on the server.";
  }
  if (/domain is not verified/i.test(raw)) {
    return "EMAIL_FROM domain is not verified in Resend. Update EMAIL_FROM to a verified sender.";
  }
  if (/Missing credentials|Invalid login|535|authentication|unauthorized|401|403/i.test(raw)) {
    return "Email is not configured on the server (check SMTP_PASS / Resend API key).";
  }
  return "Could not send the verification email. Try again in a moment.";
}

async function sendViaResendHttp(to: string, code: string): Promise<void> {
  const from = env.smtp.from;
  console.log(`[otp] Resend HTTP from=${from} to=${to}`);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.smtp.pass}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Your PadosiPro verification code",
      text: `Your verification code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
      html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p><p>If you did not request this, ignore this email.</p>`,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Resend HTTP ${res.status}: ${body}`);
  }
  console.log(`[otp] mailed via Resend HTTP to=${to} body=${body}`);
}

async function sendViaSmtp(to: string, code: string): Promise<void> {
  const info = await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: "Your PadosiPro verification code",
    text: `Your verification code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
    html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p><p>If you did not request this, ignore this email.</p>`,
  });
  console.log(`[otp] mailed via SMTP to=${to} messageId=${info.messageId}`);
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  if (env.smtp.user && !env.smtp.pass) {
    throw new AppError(
      503,
      "EMAIL_NOT_CONFIGURED",
      "Email is not configured on the server (SMTP_PASS missing).",
    );
  }

  console.log(`[otp] send start to=${to} via=${useResendHttp() ? "resend-http" : "smtp"}`);

  try {
    if (useResendHttp()) {
      await sendViaResendHttp(to, code);
    } else {
      await sendViaSmtp(to, code);
    }
  } catch (err) {
    console.error("[otp] email send failed:", err instanceof Error ? err.message : err);
    throw new AppError(503, "EMAIL_SEND_FAILED", emailSendErrorMessage(err));
  }
}
