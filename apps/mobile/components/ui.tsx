import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts, radius, space } from "../theme";

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <SafeAreaView style={[styles.screen, style]} edges={["top", "left", "right", "bottom"]}>
      {children}
    </SafeAreaView>
  );
}

export function FormKeyboard({
  children,
  footer,
  footerExtra,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
  footerExtra?: React.ReactNode;
}) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvt, () => setKeyboardOpen(true));
    const hide = Keyboard.addListener(hideEvt, () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView style={styles.formKeyboard} behavior="padding">
      <ScrollView
        style={styles.formScrollView}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.formScroll}
      >
        {children}
      </ScrollView>
      <View
        style={[
          styles.formFooter,
          keyboardOpen && styles.formFooterKeyboardOpen,
        ]}
      >
        {footer}
        {footerExtra ? (
          <View style={styles.formFooterExtra}>{footerExtra}</View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

export function BrandMark() {
  return (
    <View style={styles.brandRow}>
      <View style={styles.logo}>
        <Text style={styles.logoMark}>⌂</Text>
      </View>
      <Text style={styles.brand}>PadosiPro</Text>
    </View>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Field({
  label,
  error,
  secureTextEntry,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const [visible, setVisible] = useState(false);
  const isPassword = secureTextEntry === true;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textSecondary}
          {...props}
          secureTextEntry={isPassword ? !visible : secureTextEntry}
          style={[
            styles.input,
            isPassword && styles.inputWithToggle,
            error ? styles.inputError : null,
            props.style,
          ]}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            style={styles.eyeButton}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Hide password" : "Show password"}
            hitSlop={8}
          >
            <Ionicons
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function Button({
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "outline" | "ghost";
}) {
  const isPrimary = variant === "primary";
  const isOutline = variant === "outline";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isPrimary && styles.buttonPrimary,
        isOutline && styles.buttonOutline,
        variant === "ghost" && styles.buttonGhost,
        (disabled || loading) && styles.buttonDisabled,
        pressed && !disabled && { opacity: 0.9 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.white : colors.primary} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            (isOutline || variant === "ghost") && styles.buttonInvertedText,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function LinkButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button">
      <Text style={[styles.link, disabled && { opacity: 0.4 }]}>{label}</Text>
    </Pressable>
  );
}

export function StateBlock({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.stateBlock}>
      <Text style={styles.stateTitle}>{title}</Text>
      {body ? <Text style={styles.stateBody}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: space.md }}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={styles.stateBlock}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={[styles.stateBody, { marginTop: space.md }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    paddingBottom: space.md,
  },
  formKeyboard: {
    flex: 1,
  },
  formScrollView: {
    flex: 1,
  },
  formScroll: {
    flexGrow: 1,
    paddingBottom: space.md,
  },
  formFooter: {
    paddingTop: space.sm,
    paddingBottom: space.sm,
  },
  formFooterKeyboardOpen: {
    paddingBottom: space.sm,
  },
  formFooterExtra: {
    marginTop: space.md,
    alignItems: "center",
  },
  brandRow: {
    marginBottom: space.lg,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.sm,
  },
  logoMark: {
    color: colors.tealMuted,
    fontSize: 22,
    fontFamily: fonts.bold,
  },
  brand: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 32,
    lineHeight: 38,
    fontFamily: fonts.bold,
    marginBottom: space.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.regular,
    marginBottom: space.lg,
  },
  field: {
    marginBottom: space.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.semibold,
    marginBottom: space.sm,
  },
  inputWrap: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
  },
  inputWithToggle: {
    paddingRight: 48,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: 6,
    fontFamily: fonts.regular,
  },
  button: {
    borderRadius: radius.md,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.md,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  buttonGhost: {
    backgroundColor: "transparent",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.semibold,
    textAlign: "center",
  },
  buttonInvertedText: {
    color: colors.primary,
  },
  link: {
    color: colors.primary,
    fontSize: 15,
    fontFamily: fonts.semibold,
  },
  stateBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: space.lg,
  },
  stateTitle: {
    fontSize: 20,
    fontFamily: fonts.semibold,
    color: colors.textPrimary,
    textAlign: "center",
  },
  stateBody: {
    marginTop: space.sm,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: "center",
    fontFamily: fonts.regular,
  },
});
