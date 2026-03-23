import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";
import { COLORS, FONTS } from "@/constants/theme";

type Variant = "h1" | "h2" | "h3" | "body" | "bodySmall" | "caption";

interface ThemedTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  children: React.ReactNode;
}

export default function ThemedText({
  variant = "body",
  color,
  style,
  children,
  ...rest
}: ThemedTextProps) {
  return (
    <Text
      style={[
        styles.base,
        styles[variant],
        { color: color || COLORS.text },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: "System",
  },
  h1: {
    ...FONTS.h1,
  },
  h2: {
    ...FONTS.h2,
  },
  h3: {
    ...FONTS.h3,
  },
  body: {
    ...FONTS.body,
  },
  bodySmall: {
    ...FONTS.bodySmall,
  },
  caption: {
    ...FONTS.caption,
  },
});