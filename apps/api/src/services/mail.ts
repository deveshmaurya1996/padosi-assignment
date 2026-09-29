import nodemailer from "nodemailer";
import { env } from "../config";

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth: env.smtp.user
    ? { user: env.smtp.user, pass: env.smtp.pass }
    : undefined,
});

export async function sendOtpEmail(to: string, code: string): Promise<void> {
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
    console.warn(
      `[otp] email send failed (code still valid):`,
      err instanceof Error ? err.message : err,
    );
  }
}
