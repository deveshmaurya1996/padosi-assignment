import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useRegister } from "../../hooks/useAuthActions";
import {
  BrandMark,
  Button,
  Field,
  FormKeyboard,
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
      params: { email: result.email, otp: result.otp },
    });
  }

  return (
    <Screen>
      <FormKeyboard
        footer={
          <Button label="Register" onPress={onSubmit} loading={loading} />
        }
        footerExtra={
          <View style={styles.footerLinks}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <LinkButton
              label="Log in"
              onPress={() => router.replace("/(auth)/login")}
            />
          </View>
        }
      >
        <BrandMark />
        <Title>Create account</Title>
        <Subtitle>
          Register with your email. A 6-digit code will appear on the next screen.
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
      </FormKeyboard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  formError: {
    color: colors.error,
    marginBottom: space.md,
    fontFamily: fonts.regular,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
});
