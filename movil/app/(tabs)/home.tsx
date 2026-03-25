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

const API_URL = "http://10.13.3.228:3000"; // cámbiala por tu IP real

type Usuario = {
  id?: number;
  nombre?: string;
  correo?: string;
  tipo_usuario?: number;
  edificio_id?: number;
  turno?: string | null;
};

type Message = {
  role: "assistant" | "user";
  text: string;
};

type ChatResponse = {
  conversacion_id: number;
  respuesta: string;
};

export default function HomeScreen() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [mood, setMood] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Inicia tu conversación con Jorima, tu asistente de bienestar emocional.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversacionId, setConversacionId] = useState<number | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("usuario");

        if (!storedUser) {
          router.replace("/(auth)/login");
          return;
        }

        const parsedUser = JSON.parse(storedUser);
        setUsuario(parsedUser);
      } catch (error) {
        router.replace("/(auth)/login");
      } finally {
        setCheckingSession(false);
      }
    };

    loadUser();
  }, []);

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

  const sendMessage = async () => {
    if (!input.trim() || loading || !usuario?.id) return;

    const textoUsuario = input.trim();

    setMessages((prev) => [...prev, { role: "user", text: textoUsuario }]);
    setInput("");
    setLoading(true);
    scrollToBottom();

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario_id: usuario.id,
          mensaje: textoUsuario,
          conversacion_id: conversacionId,
        }),
      });

      const data: ChatResponse | { error?: string } = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text:
              "Lo siento, hubo un error al procesar tu mensaje. Intenta de nuevo.",
          },
        ]);
        return;
      }

      const chatData = data as ChatResponse;

      if (!conversacionId && chatData.conversacion_id) {
        setConversacionId(chatData.conversacion_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            chatData.respuesta ||
            "Lo siento, no pude generar una respuesta en este momento.",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "No se pudo conectar con el servidor. Verifica tu conexión.",
        },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("usuario");
      router.replace("/(auth)/login");
    } catch (error) {
      Alert.alert("Error", "No se pudo cerrar la sesión correctamente.");
    }
  };

  const startNewConversation = () => {
    setConversacionId(null);
    setMessages([
      {
        role: "assistant",
        text: "Inicia tu conversación con Jorima, tu asistente de bienestar emocional.",
      },
    ]);
    setInput("");
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
                  onPress={() => setMood(item.value)}
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

          {mood && (
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
              onPress={startNewConversation}
            >
              <Feather name="edit-3" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.chatMessages}>
            {messages.map((msg, i) => (
              <View
                key={i}
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

          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              placeholder="Escribe tu mensaje aquí..."
              placeholderTextColor={COLORS.textSecondary}
              value={input}
              onChangeText={setInput}
              editable={!loading}
              multiline
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!input.trim() || loading) && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={loading || !input.trim()}
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