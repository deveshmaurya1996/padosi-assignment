import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { otpCodeSchema } from "@padosipro/validation";
import { useResendOtp, useVerifyOtp } from "../../hooks/useAuthActions";
import {
  BrandMark,
  Button,
  Field,
  LinkButton,
  Screen,
  Subtitle,
  Title,
} from "../../components/ui";
import { colors, fonts, space } from "../../theme";

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  return `${user[0]}•••@${domain}`;
}

export default function VerifyScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = String(params.email ?? "");
  const { verify, loading, error: verifyError } = useVerifyOtp();
  const { resend, error: resendError } = useResendOtp();
  const [code, setCode] = useState("");
  const [info, setInfo] = useState(
    email
      ? `We've sent a code to ${maskEmail(email)}. It expires in 10 minutes.`
      : "Enter the 6-digit code from your email. It expires in 10 minutes.",
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: space.xl }}
        >
          <LinkButton label="← Back" onPress={() => router.back()} />
          <View style={{ height: space.md }} />
          <BrandMark />
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

          <View style={{ flex: 1 }} />
          <Button
            label="Verify"
            onPress={onVerify}
            loading={loading}
            disabled={!canVerify}
          />
          <Text style={styles.hint}>
            Tip: open Mailpit at http://localhost:8025 to read the email, or check the API console.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: {
    marginTop: space.md,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    textAlign: "center",
  },
});
