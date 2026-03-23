import React from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedButton from "@/components/ThemedButton";
import ThemedInput from "@/components/ThemedInput";

export default function DesignSystemScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ThemedText variant="h1">Jorima</ThemedText>
      <ThemedText variant="body" color={COLORS.textSecondary}>
        Pantalla de prueba de estilos
      </ThemedText>

      <View style={styles.spacing} />

      <ThemedInput placeholder="Correo electrónico" />
      <View style={styles.gap} />
      <ThemedInput placeholder="Contraseña" secureTextEntry />

      <View style={styles.gap} />
      <ThemedButton title="Iniciar sesión" />
      <View style={styles.gap} />
      <ThemedButton title="Continuar" variant="secondary" />
      <View style={styles.gap} />
      <ThemedButton title="Ver más" variant="outline" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
    justifyContent: "center",
  },
  spacing: {
    height: 32,
  },
  gap: {
    height: 16,
  },
});