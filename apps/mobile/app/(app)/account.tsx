import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../lib/auth";
import {
  Button,
  LinkButton,
  Screen,
  Subtitle,
  Title,
} from "../../components/ui";
import { colors, fonts, radius, space } from "../../theme";

export default function AccountScreen() {
  const { me, signOut } = useAuth();

  async function onLogout() {
    await signOut();
    router.replace("/(auth)/login");
  }

  return (
    <Screen>
      <LinkButton label="← Home" onPress={() => router.back()} />
      <View style={{ height: space.md }} />
      <Title>Account</Title>
      <Subtitle>Your details and session.</Subtitle>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{me?.profile?.name ?? "—"}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{me?.user.email ?? "—"}</Text>
        </View>
        {me?.profile?.mobile ? (
          <View style={styles.card}>
            <Text style={styles.label}>Mobile</Text>
            <Text style={styles.value}>{me.profile.mobile}</Text>
          </View>
        ) : null}
        {me?.profile?.address ? (
          <View style={styles.card}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.value}>{me.profile.address}</Text>
          </View>
        ) : null}
        {me?.profile?.businessName ? (
          <View style={styles.card}>
            <Text style={styles.label}>Business</Text>
            <Text style={styles.value}>{me.profile.businessName}</Text>
          </View>
        ) : null}
      </ScrollView>

      <Button label="Log out" variant="outline" onPress={onLogout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.semibold,
    marginBottom: 4,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: fonts.medium,
  },
});
