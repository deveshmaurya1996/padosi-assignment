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
});

function emailSendErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (
    /only send testing emails to your own email/i.test(raw) ||
    /Invalid `to` field/i.test(raw)
  ) {
    return "OTP email could not be sent to this address. Use the email on your Resend account, or verify a domain in Resend.";
  }
  if (/Missing credentials|Invalid login|535|authentication/i.test(raw)) {
    return "Email is not configured on the server (check SMTP_PASS).";
  }
  return "Could not send the verification email. Try again in a moment.";
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  if (env.smtp.user && !env.smtp.pass) {
    throw new AppError(
      503,
      "EMAIL_NOT_CONFIGURED",
      "Email is not configured on the server (SMTP_PASS missing).",
    );
  }

  try {
    const info = await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject: "Your PadosiPro verification code",
      text: `Your verification code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
      html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p><p>If you did not request this, ignore this email.</p>`,
    });
    console.log(`[otp] mailed to=${to} messageId=${info.messageId}`);
  } catch (err) {
    console.error("[otp] email send failed:", err instanceof Error ? err.message : err);
    throw new AppError(503, "EMAIL_SEND_FAILED", emailSendErrorMessage(err));
  }
}
