import { Redirect } from "expo-router";
import { useAuth } from "../lib/auth";
import { authedHref } from "../lib/routing";
import { LoadingBlock, Screen } from "../components/ui";

export default function Index() {
  const { bootstrapping, token, me } = useAuth();

  if (bootstrapping) {
    return (
      <Screen>
        <LoadingBlock label="Starting PadosiPro…" />
      </Screen>
    );
  }

  if (!token || !me) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={authedHref(me)} />;
}
