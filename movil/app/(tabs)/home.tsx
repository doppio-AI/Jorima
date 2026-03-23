import React, { useRef, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import {
  Feather,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";
import ThemedButton from "@/components/ThemedButton";

type Usuario = {
  id?: number;
  nombre?: string;
  correo?: string;
};

type Message = {
  role: "assistant" | "user";
  text: string;
};

export default function HomeScreen() {
  const [usuario] = useState<Usuario>({
    nombre: "Ricardo",
    correo: "ricardo@jorima.com",
  });

  const [mood, setMood] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Inicia tu conversación con Jorima, tu asistente de bienestar emocional.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

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

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const textoUsuario = input.trim();

    setMessages((prev) => [...prev, { role: "user", text: textoUsuario }]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Gracias por compartir eso. Estoy aquí para escucharte y apoyarte.",
        },
      ]);
      setLoading(false);
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 1200);
  };

  const logout = () => {
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
              Bienvenido de vuelta
            </ThemedText>
            <ThemedText variant="h2" color={COLORS.primary}>
              Hola, {usuario?.nombre || usuario?.correo}
            </ThemedText>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Feather name="log-out" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Mood card */}
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

        {/* Chat card */}
        <View style={styles.card}>
          <View style={styles.chatHeader}>
            <ThemedText variant="h3">Chat Privado y Seguro</ThemedText>
            <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
              Tus conversaciones son confidenciales
            </ThemedText>
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
            />

            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendMessage}
              disabled={loading}
            >
              <Feather
                name={loading ? "loader" : "send"}
                size={18}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Botón extra opcional */}
        <ThemedButton
          title="Ver mi historial"
          variant="outline"
          onPress={() => {}}
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

  scrollContent: {
    padding: SIZES.padding,
    paddingBottom: 32,
    gap: 16,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
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

  chatHeader: {
    gap: 4,
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
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },

  chatInput: {
    flex: 1,
    minHeight: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
    color: COLORS.text,
  },

  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
});