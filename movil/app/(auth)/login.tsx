import React from "react";
import { SafeAreaView, StyleSheet, View, TouchableOpacity } from "react-native";
import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedInput from "@/components/ThemedInput";
import ThemedButton from "@/components/ThemedButton";
import { router } from "expo-router";

export default function LoginScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="h1" color={COLORS.primary}>
  Jorima
</ThemedText>
          <ThemedText variant="body" color={COLORS.textSecondary}>
            Bienestar laboral en un solo lugar
          </ThemedText>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <ThemedInput placeholder="Correo electrónico" />

          <View style={styles.inputGap} />
          <ThemedInput placeholder="Contraseña" secureTextEntry />

         <ThemedButton
  title="Iniciar sesión"
  variant="secondary"
  onPress={() => router.replace("/(tabs)/home")}
/>
          
          <View style={styles.registerContainer}>
  <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
    ¿No tienes cuenta?{" "}
  </ThemedText>

  <TouchableOpacity onPress={() => router.replace("/(tabs)/home")}>
    <ThemedText variant="bodySmall" color={COLORS.primary}>
      Crear cuenta
    </ThemedText>
  </TouchableOpacity>
</View>

          <View style={styles.linkContainer}>
            <TouchableOpacity>
              <ThemedText variant="bodySmall" color={COLORS.primary}>
                ¿Olvidaste tu contraseña?
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

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
    justifyContent: "center",
    padding: SIZES.padding,
  },

  header: {
    marginBottom: 40,
  },

  form: {
    width: "100%",
  },

  inputGap: {
    height: 16,
  },

  buttonGap: {
    height: 24,
  },

  linkContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  registerContainer: {
  flexDirection: "row",
  justifyContent: "center",
  marginTop: 20,
},
});