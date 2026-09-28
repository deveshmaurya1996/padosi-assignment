import { Redirect, Stack, useSegments } from "expo-router";
import { useAuth } from "../../lib/auth";
import { LoadingBlock, Screen } from "../../components/ui";
import { colors } from "../../theme";

export default function AppLayout() {
  const { bootstrapping, token, me } = useAuth();
  const segments = useSegments();
  const screen = segments[1];

  if (bootstrapping || (token && !me)) {
    return (
      <Screen>
        <LoadingBlock label="Loading…" />
      </Screen>
    );
  }

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  if (me && !me.profileCompleted && screen !== "profile") {
    return <Redirect href="/(app)/profile" />;
  }

  if (
    me &&
    me.profileCompleted &&
    !me.tasksSelected &&
    screen !== "tasks" &&
    screen !== "confirm"
  ) {
    return <Redirect href="/(app)/tasks" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="home" />
      <Stack.Screen name="account" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="tasks" />
      <Stack.Screen name="confirm" />
    </Stack>
  );
}
