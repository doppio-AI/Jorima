import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedInput from "@/components/ThemedInput";
import ThemedButton from "@/components/ThemedButton";

import { API_URL } from "../../config/api";

export default function LoginScreen() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!correo.trim() || !contrasena.trim()) {
      setError("Completa todos los campos");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_URL}/api/login/mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo: correo.trim(),
          contrasena: contrasena.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión");
        return;
      }

      if (typeof data.token !== "string" || !data.token) {
        setError("No se pudo iniciar sesión. Intenta de nuevo.");
        return;
      }

      // Guardamos ambos juntos para no dejar al usuario "logueado"
      // con solo uno de los dos si algo falla a la mitad.
      await AsyncStorage.multiSet([
        ["usuario", JSON.stringify(data.usuario)],
        ["session_token", data.token],
      ]);

      router.replace("/(tabs)/home");
    } catch (err) {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText variant="h1" color={COLORS.primary}>
            Jorima
          </ThemedText>
          <ThemedText variant="body" color={COLORS.textSecondary}>
            Bienestar laboral en un solo lugar
          </ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedInput
            placeholder="Correo electrónico"
            value={correo}
            onChangeText={setCorreo}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={styles.inputGap} />

          <ThemedInput
            placeholder="Contraseña"
            secureTextEntry
            value={contrasena}
            onChangeText={setContrasena}
            autoCapitalize="none"
          />

          <View style={styles.buttonGap} />

          <ThemedButton
            title={loading ? "Iniciando..." : "Iniciar sesión"}
            variant="secondary"
            onPress={handleLogin}
            disabled={loading}
          />

          {error ? (
            <View style={styles.errorBox}>
              <ThemedText variant="bodySmall" color={COLORS.error}>
                {error}
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.linkContainer}>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Recuperación de acceso",
                  "Esta opción la conectamos después."
                )
              }
            >
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

  errorBox: {
    marginTop: 12,
    alignItems: "center",
  },

  linkContainer: {
    marginTop: 16,
    alignItems: "center",
  },
});
