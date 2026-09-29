import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useLogin } from "../../hooks/useAuthActions";
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

export default function LoginScreen() {
  const { login, loading, error, fields } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit() {
    const result = await login(email, password);
    if (!result.ok) {
      if ("needsVerify" in result && result.needsVerify) {
        router.push({
          pathname: "/(auth)/verify",
          params: { email: result.email },
        });
      }
      return;
    }
    if (!result.auth.profileCompleted) router.replace("/(app)/profile");
    else if (!result.auth.tasksSelected) router.replace("/(app)/tasks");
    else router.replace("/(app)/home");
  }

  return (
    <Screen>
      <FormKeyboard
        footer={<Button label="Log in" onPress={onSubmit} loading={loading} />}
        footerExtra={
          <View style={styles.footerLinks}>
            <Text style={styles.footerText}>New here? </Text>
            <LinkButton
              label="Create account"
              onPress={() => router.push("/(auth)/register")}
            />
          </View>
        }
      >
        <BrandMark />
        <Title>Welcome</Title>
        <Subtitle>Log in with your verified email to continue.</Subtitle>

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
          placeholder="Your password"
          error={fields.password}
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
