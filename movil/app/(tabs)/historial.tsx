import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

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

type Mensaje = {
  mensaje_id: number;
  role: "user" | "assistant";
  texto: string;
  fecha: string;
};

type Conversacion = {
  conversacion_id: number;
  titulo: string | null;
  fecha_creacion: string;
  mensaje: Mensaje[];
  _count: { mensaje: number };
};

export default function HistorialScreen() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);

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

        await loadHistorial(parsedUser.id);
      } catch (error) {
        router.replace("/(auth)/login");
      } finally {
        setCheckingSession(false);
      }
    };

    init();
  }, []);

  const loadHistorial = async (userId: number) => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API_URL}/api/historial?usuario_id=${userId}`
      );

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.error || "No se pudo cargar el historial");
        return;
      }

      setConversaciones(data.conversaciones || []);
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const toggleConversacion = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getConversationIcon = (count: number) => {
    if (count > 10) {
      return (
        <MaterialCommunityIcons
          name="emoticon-sad-outline"
          size={24}
          color="#e74c3c"
        />
      );
    }

    if (count > 5) {
      return (
        <MaterialCommunityIcons
          name="emoticon-neutral-outline"
          size={24}
          color="#f39c12"
        />
      );
    }

    return (
      <MaterialCommunityIcons
        name="emoticon-happy-outline"
        size={24}
        color={COLORS.secondary}
      />
    );
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
            Historial del usuario
          </ThemedText>
          <ThemedText variant="h2" color={COLORS.primary}>
            Hola, {usuario?.nombre || usuario?.correo || "Usuario"}
          </ThemedText>
        </View>

        <View style={styles.introCard}>
          <ThemedText variant="h3">Mi Historial de Interacciones</ThemedText>
          <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
            Revisa tus conversaciones anteriores con el asistente virtual
          </ThemedText>
        </View>

        {loading && (
          <View style={styles.stateCard}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <ThemedText variant="body" color={COLORS.textSecondary}>
              Cargando historial...
            </ThemedText>
          </View>
        )}

        {!loading && conversaciones.length === 0 && (
          <View style={styles.stateCard}>
            <Feather
              name="message-circle"
              size={42}
              color={COLORS.textSecondary}
            />
            <ThemedText variant="body" color={COLORS.textSecondary}>
              Aún no tienes conversaciones registradas
            </ThemedText>

            <View style={styles.emptyButton}>
              <ThemedButton
                title="Iniciar una conversación"
                variant="secondary"
                onPress={() => router.push("/(tabs)/home")}
              />
            </View>
          </View>
        )}

        {!loading &&
          conversaciones.map((conv) => {
            const isExpanded = expandedId === conv.conversacion_id;

            return (
              <View
                key={conv.conversacion_id}
                style={[styles.card, isExpanded && styles.cardExpanded]}
              >
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => toggleConversacion(conv.conversacion_id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardLeft}>
                    <View style={styles.iconCircle}>
                      {getConversationIcon(conv._count.mensaje)}
                    </View>

                    <View style={styles.cardInfo}>
                      <ThemedText variant="body" style={styles.cardTitle}>
                        {conv.titulo || "Conversación sin título"}
                      </ThemedText>

                      <ThemedText variant="caption" color={COLORS.textSecondary}>
                        {conv._count.mensaje} mensajes intercambiados
                      </ThemedText>

                      <ThemedText variant="caption" color={COLORS.textSecondary}>
                        Fecha: {formatDate(conv.fecha_creacion)}
                      </ThemedText>

                      <ThemedText variant="caption" color={COLORS.textSecondary}>
                        Hora: {formatTime(conv.fecha_creacion)}
                      </ThemedText>
                    </View>
                  </View>

                  <Feather
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={22}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.messagesContainer}>
                    {conv.mensaje.map((msg) => (
                      <View
                        key={msg.mensaje_id}
                        style={[
                          styles.messageWrapper,
                          msg.role === "assistant"
                            ? styles.assistantWrapper
                            : styles.userWrapper,
                        ]}
                      >
                        <View
                          style={[
                            styles.messageBubble,
                            msg.role === "assistant"
                              ? styles.assistantBubble
                              : styles.userBubble,
                          ]}
                        >
                          {msg.role === "assistant" && (
                            <MaterialCommunityIcons
                              name="emoticon-happy-outline"
                              size={16}
                              color={COLORS.primary}
                              style={styles.messageIcon}
                            />
                          )}

                          <ThemedText
                            variant="bodySmall"
                            color={
                              msg.role === "assistant"
                                ? COLORS.text
                                : COLORS.white
                            }
                          >
                            {msg.texto}
                          </ThemedText>
                        </View>

                        <ThemedText
                          variant="caption"
                          color={COLORS.textSecondary}
                          style={styles.messageTime}
                        >
                          {formatTime(msg.fecha)}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
      </ScrollView>
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
  },

  cardExpanded: {
    borderColor: COLORS.primary,
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

  messagesContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },

  messageWrapper: {
    maxWidth: "100%",
  },

  assistantWrapper: {
    alignItems: "flex-start",
  },

  userWrapper: {
    alignItems: "flex-end",
  },

  messageBubble: {
    maxWidth: "88%",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  assistantBubble: {
    backgroundColor: COLORS.background,
  },

  userBubble: {
    backgroundColor: COLORS.primary,
  },

  messageIcon: {
    marginRight: 6,
    marginTop: 1,
  },

  messageTime: {
    marginTop: 4,
    paddingHorizontal: 4,
  },
});