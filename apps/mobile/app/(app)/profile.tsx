import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import { useAuth } from "../../lib/auth";
import { useSaveProfile } from "../../hooks/useProfile";
import {
  BrandMark,
  Button,
  Field,
  LoadingBlock,
  Screen,
  Subtitle,
  Title,
} from "../../components/ui";
import { colors, fonts, space } from "../../theme";

export default function ProfileScreen() {
  const { me, bootstrapping } = useAuth();
  const { save, loading, error, fields } = useSaveProfile();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [businessName, setBusinessName] = useState("");

  if (bootstrapping) {
    return (
      <Screen>
        <LoadingBlock label="Loading…" />
      </Screen>
    );
  }

  if (me?.profileCompleted && me?.tasksSelected) {
    return <Redirect href="/(app)/home" />;
  }
  if (me?.profileCompleted && !me?.tasksSelected) {
    return <Redirect href="/(app)/tasks" />;
  }

  async function onSubmit() {
    const result = await save({ name, mobile, address, businessName });
    if (!result.ok) return;
    router.replace("/(app)/tasks");
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
          <Title>Tell us about you</Title>
          <Subtitle>
            A few details so your Lifestyle Manager knows who they are helping.
          </Subtitle>

          <Field
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            error={fields.name}
          />
          <Field
            label="Mobile number"
            keyboardType="phone-pad"
            value={mobile}
            onChangeText={setMobile}
            placeholder="+91 98765 43210"
            error={fields.mobile}
          />
          <Field
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Road, area or landmark"
            multiline
            error={fields.address}
          />
          <Field
            label="Business name (optional)"
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Only if you have one"
            error={fields.businessName}
          />

          {error ? <Text style={styles.formError}>{error}</Text> : null}

          <View style={{ flex: 1 }} />
          <Button label="Continue" onPress={onSubmit} loading={loading} />
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
});
