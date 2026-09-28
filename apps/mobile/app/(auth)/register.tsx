import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useRegister } from "../../hooks/useAuthActions";
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

export default function RegisterScreen() {
  const { register, loading, error, fields } = useRegister();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function onSubmit() {
    const result = await register(email, password, confirmPassword);
    if (!result.ok) return;
    router.push({
      pathname: "/(auth)/verify",
      params: { email: result.email },
    });
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
          <BrandMark />
          <Title>Create account</Title>
          <Subtitle>
            Register with your email. We will send a 6-digit code to verify it.
          </Subtitle>

          <Field
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            error={fields.email}
          />
          <Field
            label="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            error={fields.password}
          />
          <Field
            label="Confirm password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repeat password"
            error={fields.confirmPassword}
          />

          {error ? <Text style={styles.formError}>{error}</Text> : null}

          <View style={{ flex: 1 }} />
          <Button label="Register" onPress={onSubmit} loading={loading} />
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <LinkButton label="Log in" onPress={() => router.replace("/(auth)/login")} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  formError: {
    color: colors.error,
    marginBottom: space.md,
    fontFamily: fonts.regular,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: space.md,
  },
  footerText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
});
