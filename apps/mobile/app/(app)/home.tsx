import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../lib/auth";
import { useTaskSelection } from "../../hooks/useTasks";
import {
  BrandMark,
  Button,
  LoadingBlock,
  Screen,
  StateBlock,
  Subtitle,
  Title,
} from "../../components/ui";
import { colors, fonts, radius, space } from "../../theme";

export default function HomeScreen() {
  const { me } = useAuth();
  const { tasks, loading, refreshing, error, reload, refresh } = useTaskSelection();

  if (loading) {
    return (
      <Screen>
        <LoadingBlock label="Loading your home…" />
      </Screen>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <Screen>
        <StateBlock
          title="Something went wrong"
          body={error}
          actionLabel="Retry"
          onAction={reload}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.topRow}>
        <BrandMark />
        <Pressable
          onPress={() => router.push("/(app)/account")}
          accessibilityRole="button"
          accessibilityLabel="Account"
          hitSlop={8}
          style={({ pressed }) => [styles.accountBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="person-circle-outline" size={32} color={colors.primary} />
        </Pressable>
      </View>
      <Title>Home</Title>
      <Subtitle>
        {me?.profile?.name
          ? `Hi ${me.profile.name.split(" ")[0]} — here is what your Lifestyle Manager will handle.`
          : "Here is what your Lifestyle Manager will handle."}
      </Subtitle>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {tasks.length === 0 ? (
          <StateBlock
            title="No tasks yet"
            body="Pick a few tasks so we know where to start."
            actionLabel="Select tasks"
            onAction={() => router.push("/(app)/tasks")}
          />
        ) : (
          tasks.map((task) => (
            <View key={task.id} style={styles.card}>
              <Text style={styles.cat}>{task.category}</Text>
              <Text style={styles.name}>{task.name}</Text>
              <Text style={styles.desc}>{task.description}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        {tasks.length > 0 ? (
          <Button
            label="Edit tasks"
            onPress={() => router.push("/(app)/tasks")}
            variant="outline"
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: space.sm,
  },
  accountBtn: {
    marginTop: 2,
    padding: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.sm,
  },
  cat: {
    color: colors.gold,
    fontSize: 12,
    fontFamily: fonts.semibold,
    marginBottom: 4,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 17,
    fontFamily: fonts.semibold,
    marginBottom: 4,
  },
  desc: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.regular,
  },
  footer: {
    paddingTop: space.sm,
    gap: space.sm,
  },
});
