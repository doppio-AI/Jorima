import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  ActivityIndicator,
  PressableProps,
} from "react-native";
import { COLORS, SIZES, FONTS } from "@/constants/theme";

type Variant = "primary" | "secondary" | "outline";

interface ThemedButtonProps extends PressableProps {
  title: string;
  variant?: Variant;
  loading?: boolean;
}

export default function ThemedButton({
  title,
  variant = "primary",
  loading = false,
  style,
  disabled,
  ...rest
}: ThemedButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={[
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? COLORS.primary : COLORS.white} />
      ) : (
        <Text style={[styles.text, variant === "outline" && styles.outlineText]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: SIZES.radius,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SIZES.large,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
  },
  outline: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  text: {
    color: COLORS.white,
    ...FONTS.button,
  },
  outlineText: {
    color: COLORS.primary,
  },
  disabled: {
    opacity: 0.6,
  },
});