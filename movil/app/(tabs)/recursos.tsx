import React from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";

export default function RecursosScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ThemedText variant="h2" color={COLORS.primary}>
          Recursos de Ayuda
        </ThemedText>
        <ThemedText variant="body" color={COLORS.textSecondary}>
          Aquí irán los recursos de apoyo.
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SIZES.padding,
    justifyContent: "center",
  },
});