import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { WebView } from "react-native-webview";
import * as WebBrowser from "expo-web-browser";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedButton from "@/components/ThemedButton";
import { API_URL } from "@/config/api";

type Usuario = {
  id?: number;
  nombre?: string;
  correo?: string;
  tipo_usuario?: number;
  edificio_id?: number;
  turno?: string | null;
};

type HelpContent = {
  id: number;
  hash: string;
  categoria: string;
  descripcion: string;
  ruta: string;
  nombre_archivo: string;
};

export default function RecursosScreen() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [helpContent, setHelpContent] = useState<HelpContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<HelpContent | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("usuario");

        if (!storedUser) {
          router.replace("/(auth)/login");
          return;
        }

        const parsedUser: Usuario = JSON.parse(storedUser);
        setUsuario(parsedUser);

        if (!parsedUser.id) {
          router.replace("/(auth)/login");
          return;
        }

        await loadHelpContent();
      } catch (error) {
        router.replace("/(auth)/login");
      } finally {
        setCheckingSession(false);
      }
    };

    init();
  }, []);

  const loadHelpContent = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/contenido-ayuda`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.error || "No se pudo cargar el contenido");
        return;
      }

      if (!Array.isArray(data)) {
        Alert.alert("Error", "Formato inválido de respuesta");
        return;
      }

      const mapped: HelpContent[] = data.map((item: any) => ({
        id: item.reporte_id,
        hash: item.hash,
        categoria: item.tipo_seguimiento || "General",
        descripcion: item.notas || "Sin descripción",
        ruta: item.ruta || "",
        nombre_archivo: item.nombre_archivo || "Documento sin nombre",
      }));

      setHelpContent(mapped);
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const getResourceIcon = (categoria: string) => {
    const text = (categoria || "").toLowerCase();

    if (text.includes("estrés")) {
      return (
        <MaterialCommunityIcons
          name="meditation"
          size={24}
          color="#f39c12"
        />
      );
    }

    if (text.includes("autocuidado")) {
      return (
        <MaterialCommunityIcons
          name="heart-plus-outline"
          size={24}
          color="#e74c3c"
        />
      );
    }

    if (text.includes("mindfulness")) {
      return (
        <MaterialCommunityIcons
          name="brain"
          size={24}
          color={COLORS.secondary}
        />
      );
    }

    if (text.includes("orientación")) {
      return (
        <MaterialCommunityIcons
          name="account-heart-outline"
          size={24}
          color={COLORS.primary}
        />
      );
    }

    return (
      <MaterialCommunityIcons
        name="file-document-outline"
        size={24}
        color={COLORS.primary}
      />
    );
  };

  const openDocument = async (url: string) => {
    try {
      if (!url) {
        Alert.alert("Aviso", "Este recurso no tiene URL disponible");
        return;
      }

      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      Alert.alert("Error", "No se pudo abrir el documento");
    }
  };

  if (checkingSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ThemedText variant="body" color={COLORS.textSecondary}>
            Cargando sesión...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
            Recursos del usuario
          </ThemedText>
          <ThemedText variant="h2" color={COLORS.primary}>
            Hola, {usuario?.nombre || usuario?.correo || "Usuario"}
          </ThemedText>
        </View>

        <View style={styles.introCard}>
          <ThemedText variant="h3">Recursos de Ayuda</ThemedText>
          <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
            Consulta material publicado para apoyar tu bienestar emocional,
            hábitos saludables y manejo de situaciones laborales.
          </ThemedText>
        </View>

        {loading && (
          <View style={styles.stateCard}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <ThemedText variant="body" color={COLORS.textSecondary}>
              Cargando recursos...
            </ThemedText>
          </View>
        )}

        {!loading && helpContent.length === 0 && (
          <View style={styles.stateCard}>
            <Feather name="book-open" size={42} color={COLORS.textSecondary} />
            <ThemedText variant="body" color={COLORS.textSecondary}>
              Aún no hay recursos publicados
            </ThemedText>

            <View style={styles.emptyButton}>
              <ThemedButton
                title="Volver al inicio"
                variant="secondary"
                onPress={() => router.push("/(tabs)/home")}
              />
            </View>
          </View>
        )}

        {!loading &&
          helpContent.map((doc) => (
            <View key={doc.id} style={styles.card}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => {
                  if (!doc.ruta) {
                    Alert.alert("Aviso", "Este recurso no tiene URL disponible");
                    return;
                  }
                  setSelectedDoc(doc);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.cardLeft}>
                  <View style={styles.iconCircle}>
                    {getResourceIcon(doc.categoria)}
                  </View>

                  <View style={styles.cardInfo}>
                    <ThemedText variant="body" style={styles.cardTitle}>
                      {doc.nombre_archivo}
                    </ThemedText>

                    <ThemedText variant="caption" color={COLORS.secondary}>
                      {doc.categoria}
                    </ThemedText>

                    <ThemedText variant="caption" color={COLORS.textSecondary}>
                      {doc.descripcion}
                    </ThemedText>
                  </View>
                </View>

                <Feather
                  name="chevron-right"
                  size={22}
                  color={COLORS.primary}
                />
              </TouchableOpacity>

              <View style={styles.actionsRow}>
                <View style={styles.actionButtonWrap}>
                  <ThemedButton
                    title="Ver aquí"
                    variant="primary"
                    onPress={() => {
                      if (!doc.ruta) {
                        Alert.alert("Aviso", "Este recurso no tiene URL disponible");
                        return;
                      }
                      setSelectedDoc(doc);
                    }}
                  />
                </View>

                <View style={styles.actionButtonWrap}>
                  <ThemedButton
                    title="Abrir"
                    variant="secondary"
                    onPress={() => openDocument(doc.ruta)}
                  />
                </View>
              </View>
            </View>
          ))}
      </ScrollView>

      <Modal
        visible={!!selectedDoc}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setSelectedDoc(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleWrap}>
              <ThemedText variant="body" style={styles.modalTitle}>
                {selectedDoc?.nombre_archivo || "Documento"}
              </ThemedText>

              <ThemedText variant="caption" color={COLORS.textSecondary}>
                {selectedDoc?.categoria || ""}
              </ThemedText>
            </View>

            <Pressable
              style={styles.closeButton}
              onPress={() => setSelectedDoc(null)}
            >
              <Feather name="x" size={20} color={COLORS.primary} />
            </Pressable>
          </View>

          {selectedDoc?.ruta ? (
            <WebView
              source={{ uri: selectedDoc.ruta }}
              style={styles.webview}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.centerState}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <ThemedText
                    variant="body"
                    color={COLORS.textSecondary}
                    style={{ marginTop: 8 }}
                  >
                    Cargando PDF...
                  </ThemedText>
                </View>
              )}
            />
          ) : (
            <View style={styles.centerState}>
              <ThemedText variant="body" color={COLORS.textSecondary}>
                No hay documento disponible
              </ThemedText>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SIZES.padding,
  },

  scrollContent: {
    padding: SIZES.padding,
    paddingBottom: 32,
    gap: 16,
  },

  header: {
    marginBottom: 4,
  },

  introCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },

  stateCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },

  emptyButton: {
    width: "100%",
    marginTop: 6,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 14,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  cardLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  cardInfo: {
    flex: 1,
    gap: 2,
  },

  cardTitle: {
    fontWeight: "600",
  },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },

  actionButtonWrap: {
    flex: 1,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },

  modalTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },

  modalTitle: {
    fontWeight: "700",
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  webview: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
});