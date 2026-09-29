
export async function sendOtpEmail(to: string, code: string): Promise<void> {
  console.log(`[otp] email=${to} code=${code}`);
}
