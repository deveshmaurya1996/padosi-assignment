import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSaveTaskSelection } from "../../hooks/useTasks";
import { Button, Screen, StateBlock, Subtitle, Title } from "../../components/ui";
import { colors, fonts, radius, space } from "../../theme";

type SummaryItem = { id: string; name: string; category: string };

export default function ConfirmScreen() {
  const params = useLocalSearchParams<{ taskIds?: string; summary?: string }>();
  const { save, loading, error } = useSaveTaskSelection();

  const items = useMemo(() => {
    try {
      return JSON.parse(String(params.summary ?? "[]")) as SummaryItem[];
    } catch {
      return [];
    }
  }, [params.summary]);

  const taskIds = useMemo(() => {
    try {
      return JSON.parse(String(params.taskIds ?? "[]")) as string[];
    } catch {
      return [];
    }
  }, [params.taskIds]);

  async function onConfirm() {
    const result = await save(taskIds);
    if (!result.ok) return;
    if (router.canDismiss()) router.dismissAll();
    router.replace("/(app)/home");
  }

  if (error) {
    return (
      <Screen>
        <StateBlock
          title="Could not save selection"
          body={error}
          actionLabel="Retry"
          onAction={onConfirm}
        />
        <Button
          label="Edit selection"
          variant="outline"
          onPress={() =>
            router.replace({
              pathname: "/(app)/tasks",
              params: { selected: JSON.stringify(taskIds) },
            })
          }
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Confirm selection</Title>
      <Subtitle>We will start with these. You can change them later.</Subtitle>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: space.xl }}>
        {items.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.cat}>{item.category}</Text>
            <Text style={styles.name}>{item.name}</Text>
          </View>
        ))}
        {items.length === 0 ? (
          <Text style={styles.empty}>No tasks selected.</Text>
        ) : null}
      </ScrollView>

      
      <View style={styles.footer}>
        <Button
          label="Confirm & continue"
          onPress={onConfirm}
          loading={loading}
          disabled={taskIds.length === 0}
        />
        <Button
          label="Edit selection"
          variant="outline"
          onPress={() =>
            router.replace({
              pathname: "/(app)/tasks",
              params: { selected: JSON.stringify(taskIds) },
            })
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.sm,
  },
  cat: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: fonts.semibold,
    marginBottom: 4,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: fonts.medium,
  },
  empty: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  footer: {
    paddingTop: space.sm,
    gap: space.sm,
  },
});
