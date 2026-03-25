import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedButton from "@/components/ThemedButton";

type Usuario = {
  id?: number;
  nombre?: string;
  correo?: string;
  tipo_usuario?: number;
  edificio_id?: number;
  turno?: string | null;
};

export default function PerfilScreen() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("usuario");

        if (!storedUser) {
          router.replace("/(auth)/login");
          return;
        }

        setUsuario(JSON.parse(storedUser));
      } catch (error) {
        router.replace("/(auth)/login");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("usuario");
      router.replace("/(auth)/login");
    } catch (error) {
      Alert.alert("Error", "No se pudo cerrar sesión");
    }
  };

  const getTipoUsuario = (tipo?: number) => {
    if (tipo === 1) return "Recursos Humanos";
    if (tipo === 2) return "Personal";
    return "No definido";
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ThemedText color={COLORS.textSecondary}>
            Cargando perfil...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="h2" color={COLORS.primary}>
            Mi Perfil
          </ThemedText>
        </View>

        {/* Card usuario */}
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Feather name="user" size={28} color={COLORS.primary} />
          </View>

          <ThemedText variant="h3">
            {usuario?.nombre || "Usuario"}
          </ThemedText>

          <ThemedText color={COLORS.textSecondary}>
            {usuario?.correo}
          </ThemedText>
        </View>

        {/* Info */}
        <View style={styles.card}>
          <ThemedText variant="h3">Información</ThemedText>

          <View style={styles.infoItem}>
            <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
              Tipo de usuario
            </ThemedText>
            <ThemedText>
              {getTipoUsuario(usuario?.tipo_usuario)}
            </ThemedText>
          </View>

          <View style={styles.infoItem}>
            <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
              Turno
            </ThemedText>
            <ThemedText>
              {usuario?.turno || "No definido"}
            </ThemedText>
          </View>

          <View style={styles.infoItem}>
            <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
              Edificio
            </ThemedText>
            <ThemedText>
              #{usuario?.edificio_id || "N/A"}
            </ThemedText>
          </View>
        </View>

        {/* Botón logout */}
        <View style={styles.logoutContainer}>
          <ThemedButton
            title="Cerrar sesión"
            variant="outline"
            onPress={logout}
          />
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
    padding: SIZES.padding,
    gap: 16,
  },

  header: {
    marginBottom: 8,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    gap: 8,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  infoItem: {
    width: "100%",
    marginTop: 10,
  },

  logoutContainer: {
    marginTop: 10,
  },
});