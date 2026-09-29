import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { otpCodeSchema } from "@padosipro/validation";
import { useResendOtp, useVerifyOtp } from "../../hooks/useAuthActions";
import {
  Button,
  Field,
  FormKeyboard,
  LinkButton,
  Screen,
  Subtitle,
  Title,
} from "../../components/ui";
import { space } from "../../theme";

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  return `${user[0]}•••@${domain}`;
}

function paramString(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

export default function VerifyScreen() {
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = paramString(params.email);
  const { verify, loading, error: verifyError } = useVerifyOtp();
  const { resend, error: resendError } = useResendOtp();
  const [code, setCode] = useState("");
  const [info, setInfo] = useState(
    email
      ? `We've sent a code to ${maskEmail(email)}. It expires in 10 minutes.`
      : "Enter the 6-digit code. It expires in 10 minutes.",
  );
  const [cooldown, setCooldown] = useState(30);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const canVerify = useMemo(() => otpCodeSchema.safeParse(code).success, [code]);
  const error = verifyError ?? resendError;

  async function onVerify() {
    const result = await verify(email, code);
    if (!result.ok) return;
    setInfo(result.data.message);
    router.replace("/(auth)/login");
  }

  async function onResend() {
    if (cooldown > 0 || !email) return;
    const result = await resend(email);
    if (!result.ok) return;
    setInfo(`A new code was sent to ${maskEmail(email)}. It expires in 10 minutes.`);
    setCooldown(30);
  }

  return (
    <Screen>
      <FormKeyboard
        footer={
          <Button
            label="Verify"
            onPress={onVerify}
            loading={loading}
            disabled={!canVerify}
          />
        }
      >
        <LinkButton label="← Back" onPress={() => router.back()} />
        <View style={{ height: space.md }} />
        <Title>Enter OTP</Title>
        <Subtitle>{info}</Subtitle>

        <Field
          label="6-digit code"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
          placeholder="------"
          error={error ?? undefined}
        />

        <LinkButton
          label={cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          onPress={onResend}
          disabled={cooldown > 0}
        />
      </FormKeyboard>
    </Screen>
  );
}
