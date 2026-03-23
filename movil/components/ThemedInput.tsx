import React from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";
import { COLORS, SIZES, FONTS } from "@/constants/theme";

export default function ThemedInput({ style, ...rest }: TextInputProps) {
  return (
    <View style={styles.container}>
      <TextInput
        placeholderTextColor={COLORS.textSecondary}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.padding,
    color: COLORS.text,
    ...FONTS.body,
  },
});