import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

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

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

/* ── Coincide con la forma real de /api/chat (POST) ── */
type ChatPostResponse = {
  conversacion_id?: number;
  respuesta?: string;
  error?: string;
  temporal?: boolean;
};

/* ── Coincide con la forma real de /api/chat (GET) ── */
type ChatGetResponse = {
  conversacion_id?: number;
  mensajes?: Array<{
    mensaje_id: number;
    role: string;
    texto: string;
    fecha: string;
  }>;
  error?: string;
};

const MENSAJE_BIENVENIDA: Message = {
  id: "bienvenida",
  role: "assistant",
  text: "Inicia tu conversación con Jorima, tu asistente de bienestar emocional.",
};

const MAX_MENSAJE_LENGTH = 2000;

function crearIdMensaje(): string {
  return `${Date.now()}-${Math.random()}`;
}

export default function HomeScreen() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [mood, setMood] = useState<string | null>(null);
  const [sendingMood, setSendingMood] = useState(false);
  const [moodSaved, setMoodSaved] = useState(false);

  const [messages, setMessages] = useState<Message[]>([MENSAJE_BIENVENIDA]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [chatError, setChatError] = useState("");
  const [conversacionId, setConversacionId] = useState<number | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  /* =========================
     Sesión cerrada / token inválido
     Limpia AsyncStorage y manda al login.
  ========================= */
  const forzarLogout = async () => {
    await AsyncStorage.multiRemove(["usuario", "session_token"]);
    router.replace("/(auth)/login");
  };

  const authHeaders = (): Record<string, string> =>
    sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};

  /* =========================
     CARGAR SESIÓN
  ========================= */

  useEffect(() => {
    const loadUser = async () => {
      try {
        const entries = await AsyncStorage.multiGet([
          "usuario",
          "session_token",
        ]);

        const storedUser = entries.find(([key]) => key === "usuario")?.[1];
        const storedToken = entries.find(
          ([key]) => key === "session_token"
        )?.[1];

        if (!storedUser || !storedToken) {
          await forzarLogout();
          return;
        }

        setUsuario(JSON.parse(storedUser));
        setSessionToken(storedToken);
      } catch (error) {
        await forzarLogout();
      } finally {
        setCheckingSession(false);
      }
    };

    loadUser();
  }, []);

  /* =========================
     CARGAR CONVERSACIÓN GUARDADA
  ========================= */

  useEffect(() => {
    if (!usuario?.id || !sessionToken) {
      return;
    }

    const cargarConversacion = async () => {
      const storageKey = `jorima_conversacion_${usuario.id}`;
      const guardada = await AsyncStorage.getItem(storageKey);

      if (!guardada) {
        return;
      }

      const idGuardado = Number(guardada);

      if (!Number.isInteger(idGuardado) || idGuardado <= 0) {
        await AsyncStorage.removeItem(storageKey);
        return;
      }

      setLoadingHistorial(true);
      setChatError("");

      try {
        const res = await fetch(
          `${API_URL}/api/chat?conversacion_id=${idGuardado}`,
          {
            method: "GET",
            headers: { ...authHeaders() },
          }
        );

        if (res.status === 401) {
          await forzarLogout();
          return;
        }

        const data = (await res.json()) as ChatGetResponse;

        if (!res.ok) {
          await AsyncStorage.removeItem(storageKey);
          setConversacionId(null);
          setMessages([MENSAJE_BIENVENIDA]);
          return;
        }

        const mensajesValidos = (data.mensajes ?? [])
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map<Message>((m) => ({
            id: String(m.mensaje_id),
            role: m.role === "assistant" ? "assistant" : "user",
            text: m.texto,
          }));

        setConversacionId(idGuardado);
        setMessages(
          mensajesValidos.length > 0 ? mensajesValidos : [MENSAJE_BIENVENIDA]
        );
      } catch (error) {
        setChatError("No fue posible recuperar la conversación anterior.");
      } finally {
        setLoadingHistorial(false);
        scrollToBottom();
      }
    };

    void cargarConversacion();
  }, [usuario?.id, sessionToken]);

  const getMoodIconName = () => {
    switch (mood) {
      case "muy mal":
      case "mal":
        return "emoticon-sad-outline";
      case "regular":
        return "emoticon-neutral-outline";
      case "bien":
      case "muy bien":
      default:
        return "emoticon-happy-outline";
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  const saveMood = async (selectedMood: string) => {
    if (!usuario?.edificio_id) {
      Alert.alert("Error", "No se encontró el edificio del usuario.");
      return;
    }

    try {
      setSendingMood(true);
      setMoodSaved(false);

      const res = await fetch(`${API_URL}/api/respuesta`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          edificio_id: usuario.edificio_id,
          respuestas: {
            estado_animo: selectedMood,
          },
        }),
      });

      if (res.status === 401) {
        await forzarLogout();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.error || "No se pudo guardar la respuesta.");
        return;
      }

      setMoodSaved(true);
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setSendingMood(false);
    }
  };

  /* =========================
     ENVIAR MENSAJE
  ========================= */

  const sendMessage = async () => {
    const textoUsuario = input.trim();

    if (!textoUsuario || loading || loadingHistorial || !usuario?.id) {
      return;
    }

    if (textoUsuario.length > MAX_MENSAJE_LENGTH) {
      setChatError(
        `El mensaje no puede superar los ${MAX_MENSAJE_LENGTH} caracteres.`
      );
      return;
    }

    setMessages((prev) => [
      ...prev,
      { id: crearIdMensaje(), role: "user", text: textoUsuario },
    ]);
    setInput("");
    setChatError("");
    setLoading(true);
    scrollToBottom();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      // usuario_id ya NO se manda: /api/chat lo obtiene de la sesión
      // (cookie en web, Authorization: Bearer <token> en móvil).
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          mensaje: textoUsuario,
          conversacion_id: conversacionId,
        }),
        signal: controller.signal,
      });

      if (res.status === 401) {
        await forzarLogout();
        return;
      }

      const data = (await res.json().catch(() => ({}))) as ChatPostResponse;

      if (!res.ok) {
        throw new Error(data.error || "No fue posible procesar tu mensaje");
      }

      if (typeof data.respuesta !== "string" || !data.respuesta.trim()) {
        throw new Error("El asistente devolvió una respuesta inválida");
      }

      if (
        typeof data.conversacion_id === "number" &&
        data.conversacion_id > 0
      ) {
        setConversacionId(data.conversacion_id);
        await AsyncStorage.setItem(
          `jorima_conversacion_${usuario.id}`,
          String(data.conversacion_id)
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crearIdMensaje(),
          role: "assistant",
          text: data.respuesta!.trim(),
        },
      ]);
    } catch (error) {
      const mensajeError =
        error instanceof Error
          ? error.message
          : "No se pudo conectar con el servidor.";

      setChatError(mensajeError);

      setMessages((prev) => [
        ...prev,
        {
          id: crearIdMensaje(),
          role: "assistant",
          text: "Lo siento, ocurrió un problema al procesar tu mensaje. Puedes intentarlo nuevamente.",
        },
      ]);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      scrollToBottom();
    }
  };

  const logout = async () => {
    if (usuario?.id) {
      await AsyncStorage.removeItem(`jorima_conversacion_${usuario.id}`);
    }
    await forzarLogout();
  };

  const startNewConversation = async () => {
    setConversacionId(null);
    setMessages([MENSAJE_BIENVENIDA]);
    setInput("");
    setChatError("");

    if (usuario?.id) {
      await AsyncStorage.removeItem(`jorima_conversacion_${usuario.id}`);
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
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
              Bienvenido de vuelta
            </ThemedText>

            <ThemedText variant="h2" color={COLORS.primary}>
              Hola, {usuario?.nombre || usuario?.correo || "Usuario"}
            </ThemedText>

            {!!usuario?.turno && (
              <ThemedText variant="caption" color={COLORS.textSecondary}>
                Turno: {usuario.turno}
              </ThemedText>
            )}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Feather name="log-out" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <ThemedText variant="h3" color={COLORS.text}>
            ¿Cómo te sientes hoy antes de empezar?
          </ThemedText>

          <View style={styles.moodGrid}>
            {[
              { label: "Muy mal", value: "muy mal", icon: "emoticon-sad-outline" },
              { label: "Mal", value: "mal", icon: "emoticon-sad-outline" },
              { label: "Regular", value: "regular", icon: "emoticon-neutral-outline" },
              { label: "Bien", value: "bien", icon: "emoticon-happy-outline" },
              { label: "Muy bien", value: "muy bien", icon: "emoticon-happy-outline" },
            ].map((item) => {
              const selected = mood === item.value;

              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.moodOption,
                    selected && styles.moodOptionSelected,
                  ]}
                  onPress={async () => {
                    setMood(item.value);
                    await saveMood(item.value);
                  }}
                  disabled={sendingMood}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={26}
                    color={selected ? COLORS.white : COLORS.primary}
                  />

                  <ThemedText
                    variant="bodySmall"
                    color={selected ? COLORS.white : COLORS.text}
                    style={styles.moodLabel}
                  >
                    {item.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {sendingMood && (
            <View style={styles.thanksBox}>
              <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
                Guardando respuesta...
              </ThemedText>
            </View>
          )}

          {!sendingMood && moodSaved && (
            <View style={styles.thanksBox}>
              <ThemedText variant="bodySmall" color={COLORS.secondary}>
                ✓ Gracias por compartir cómo te sientes
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.chatHeaderRow}>
            <View style={styles.chatHeader}>
              <ThemedText variant="h3">Chat Privado y Seguro</ThemedText>
              <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
                Tus conversaciones son confidenciales
              </ThemedText>
            </View>

            <TouchableOpacity
              style={styles.newChatButton}
              onPress={() => void startNewConversation()}
            >
              <Feather name="edit-3" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.chatMessages}>
            {loadingHistorial && (
              <View style={[styles.messageBubble, styles.assistantMessage]}>
                <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
                  Cargando conversación...
                </ThemedText>
              </View>
            )}

            {!loadingHistorial &&
              messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubble,
                    msg.role === "assistant"
                      ? styles.assistantMessage
                      : styles.userMessage,
                  ]}
                >
                  {msg.role === "assistant" && (
                    <MaterialCommunityIcons
                      name={getMoodIconName() as any}
                      size={18}
                      color={COLORS.primary}
                      style={styles.messageIcon}
                    />
                  )}

                  <ThemedText
                    variant="bodySmall"
                    color={msg.role === "user" ? COLORS.white : COLORS.text}
                  >
                    {msg.text}
                  </ThemedText>
                </View>
              ))}

            {loading && (
              <View style={[styles.messageBubble, styles.assistantMessage]}>
                <MaterialCommunityIcons
                  name={getMoodIconName() as any}
                  size={18}
                  color={COLORS.primary}
                  style={styles.messageIcon}
                />
                <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
                  Escribiendo...
                </ThemedText>
              </View>
            )}
          </View>

          {!!chatError && (
            <ThemedText
              variant="caption"
              color={COLORS.error ?? "#D14343"}
              style={{ marginTop: 4 }}
            >
              {chatError}
            </ThemedText>
          )}

          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              placeholder="Escribe tu mensaje aquí..."
              placeholderTextColor={COLORS.textSecondary}
              value={input}
              onChangeText={(text) => {
                setInput(text);
                setChatError("");
              }}
              maxLength={MAX_MENSAJE_LENGTH}
              editable={!loading && !loadingHistorial}
              multiline
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!input.trim() || loading || loadingHistorial) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={() => void sendMessage()}
              disabled={loading || loadingHistorial || !input.trim()}
            >
              <Feather
                name={loading ? "loader" : "send"}
                size={18}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ThemedButton
          title="Ver mi historial"
          variant="outline"
          onPress={() => router.push("/(tabs)/historial")}
        />
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  headerTextBlock: {
    flex: 1,
    paddingRight: 12,
  },

  logoutButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },

  moodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  moodOption: {
    width: "30%",
    minWidth: 92,
    flexGrow: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  moodOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  moodLabel: {
    marginTop: 6,
    textAlign: "center",
  },

  thanksBox: {
    marginTop: 4,
  },

  chatHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  chatHeader: {
    flex: 1,
    gap: 4,
  },

  newChatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },

  chatMessages: {
    gap: 10,
  },

  messageBubble: {
    maxWidth: "88%",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  assistantMessage: {
    backgroundColor: COLORS.background,
    alignSelf: "flex-start",
  },

  userMessage: {
    backgroundColor: COLORS.primary,
    alignSelf: "flex-end",
  },

  messageIcon: {
    marginRight: 8,
    marginTop: 1,
  },

  chatInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginTop: 6,
  },

  chatInput: {
    flex: 1,
    minHeight: 50,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    textAlignVertical: "top",
  },

  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
  },

  sendButtonDisabled: {
    opacity: 0.6,
  },
});
