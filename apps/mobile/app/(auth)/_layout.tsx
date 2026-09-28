import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../lib/auth";
import { authedHref } from "../../lib/routing";
import { LoadingBlock, Screen } from "../../components/ui";
import { colors } from "../../theme";

export default function AuthLayout() {
  const { bootstrapping, token, me } = useAuth();

  if (bootstrapping) {
    return (
      <Screen>
        <LoadingBlock label="Loading…" />
      </Screen>
    );
  }

  if (token && me) {
    return <Redirect href={authedHref(me)} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    />
  );
}
