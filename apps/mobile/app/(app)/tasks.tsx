import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../lib/auth";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useTasksCatalog } from "../../hooks/useTasks";
import {
  Button,
  LinkButton,
  LoadingBlock,
  Screen,
  StateBlock,
  Subtitle,
  Title,
} from "../../components/ui";
import { colors, fonts, radius, space } from "../../theme";

export default function TasksScreen() {
  const { me } = useAuth();
  const params = useLocalSearchParams<{ selected?: string }>();
  const {
    categories,
    selected,
    toggle,
    loading,
    error,
    setError,
    reload,
  } = useTasksCatalog(params.selected);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const editingFromHome = Boolean(me?.tasksSelected);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((c) => ({
        ...c,
        tasks: c.tasks.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q),
        ),
      }))
      .filter((c) => c.tasks.length > 0);
  }, [categories, debouncedQuery]);

  function onContinue() {
    if (selected.size === 0) {
      setError("Select at least one task to continue.");
      return;
    }
    const tasks = categories.flatMap((c) => c.tasks).filter((t) => selected.has(t.id));
    router.push({
      pathname: "/(app)/confirm",
      params: {
        taskIds: JSON.stringify([...selected]),
        summary: JSON.stringify(
          tasks.map((t) => ({ id: t.id, name: t.name, category: t.category })),
        ),
      },
    });
  }

  if (loading) {
    return (
      <Screen>
        <LoadingBlock label="Loading tasks…" />
      </Screen>
    );
  }

  if (error && categories.length === 0) {
    return (
      <Screen>
        <StateBlock
          title="Could not load tasks"
          body={error}
          actionLabel="Retry"
          onAction={reload}
        />
      </Screen>
    );
  }

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <View style={{ paddingHorizontal: space.lg }}>
        {editingFromHome ? (
          <LinkButton label="← Home" onPress={() => router.back()} />
        ) : null}
        {editingFromHome ? <View style={{ height: space.md }} /> : null}
        <Title>{editingFromHome ? "Edit your tasks" : "What can we handle?"}</Title>
        <Subtitle>
          {editingFromHome
            ? "Your current selection is checked. Change anything, then review."
            : "Pick the tasks you want your Lifestyle Manager to own."}
        </Subtitle>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search tasks"
          placeholderTextColor={colors.textSecondary}
          style={styles.search}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: space.lg }}>
        {filtered.length === 0 ? (
          <StateBlock title="No matches" body="Try a different search." />
        ) : (
          filtered.map((group) => (
            <View key={group.category} style={styles.group}>
              <Text style={styles.groupTitle}>{group.category}</Text>
              {group.tasks.map((task) => {
                const on = selected.has(task.id);
                return (
                  <Pressable
                    key={task.id}
                    onPress={() => toggle(task)}
                    style={[styles.card, on && styles.cardOn]}
                  >
                    <View style={[styles.check, on && styles.checkOn]}>
                      {on ? <Text style={styles.checkMark}>✓</Text> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.taskName}>{task.name}</Text>
                      <Text style={styles.taskDesc}>{task.description}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.count}>{selected.size} selected</Text>
        <Button label="Review selection" onPress={onContinue} disabled={selected.size === 0} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    marginBottom: space.md,
  },
  error: {
    color: colors.error,
    marginBottom: space.sm,
    fontFamily: fonts.regular,
  },
  group: {
    marginBottom: space.lg,
  },
  groupTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.primary,
    marginBottom: space.sm,
  },
  card: {
    flexDirection: "row",
    gap: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.sm,
  },
  cardOn: {
    borderColor: colors.primary,
    backgroundColor: colors.tealMuted,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkMark: {
    color: colors.white,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  taskName: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  taskDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: space.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: space.sm,
  },
  count: {
    textAlign: "center",
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },
});
