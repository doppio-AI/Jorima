import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS, SIZES } from "@/constants/theme";
import ThemedText from "@/components/ThemedText";

type Recurso = {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  icono: keyof typeof MaterialCommunityIcons.glyphMap;
};

const recursos: Recurso[] = [
  {
    id: 1,
    titulo: "Manejo del estrés",
    descripcion:
      "Aprende técnicas simples para reconocer y reducir el estrés en tu rutina diaria.",
    categoria: "Bienestar emocional",
    icono: "meditation",
  },
  {
    id: 2,
    titulo: "Respiración consciente",
    descripcion:
      "Ejercicios breves de respiración para recuperar calma y enfoque en momentos difíciles.",
    categoria: "Relajación",
    icono: "weather-windy",
  },
  {
    id: 3,
    titulo: "Organización del tiempo",
    descripcion:
      "Consejos prácticos para ordenar tareas, reducir saturación y mejorar tu productividad.",
    categoria: "Hábitos saludables",
    icono: "clock-outline",
  },
  {
    id: 4,
    titulo: "Comunicación asertiva",
    descripcion:
      "Recomendaciones para expresar ideas, necesidades y límites de manera clara y respetuosa.",
    categoria: "Relaciones laborales",
    icono: "account-voice",
  },
  {
    id: 5,
    titulo: "Pausas activas",
    descripcion:
      "Ideas de pausas cortas para reducir tensión física y mental durante la jornada.",
    categoria: "Salud integral",
    icono: "run-fast",
  },
];

export default function RecursosScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
            Apoyo para tu bienestar
          </ThemedText>

          <ThemedText variant="h2" color={COLORS.primary}>
            Recursos de Ayuda
          </ThemedText>
        </View>

        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Feather name="book-open" size={22} color={COLORS.primary} />
          </View>

          <View style={styles.introTextBlock}>
            <ThemedText variant="h3">Explora herramientas útiles</ThemedText>
            <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
              Aquí encontrarás contenido pensado para apoyarte en tu bienestar
              emocional, hábitos saludables y manejo de situaciones laborales.
            </ThemedText>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText variant="h3">Categorías destacadas</ThemedText>
        </View>

        <View style={styles.categoryRow}>
          <View style={styles.categoryChip}>
            <ThemedText variant="caption" color={COLORS.primary}>
              Bienestar emocional
            </ThemedText>
          </View>

          <View style={styles.categoryChip}>
            <ThemedText variant="caption" color={COLORS.primary}>
              Relajación
            </ThemedText>
          </View>

          <View style={styles.categoryChip}>
            <ThemedText variant="caption" color={COLORS.primary}>
              Hábitos saludables
            </ThemedText>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText variant="h3">Recursos disponibles</ThemedText>
        </View>

        {recursos.map((recurso) => (
          <TouchableOpacity
            key={recurso.id}
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => {}}
          >
            <View style={styles.cardTop}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons
                  name={recurso.icono}
                  size={22}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.cardContent}>
                <ThemedText variant="body" style={styles.cardTitle}>
                  {recurso.titulo}
                </ThemedText>

                <ThemedText variant="caption" color={COLORS.secondary}>
                  {recurso.categoria}
                </ThemedText>
              </View>

              <Feather name="chevron-right" size={20} color={COLORS.primary} />
            </View>

            <ThemedText variant="bodySmall" color={COLORS.textSecondary}>
              {recurso.descripcion}
            </ThemedText>
          </TouchableOpacity>
        ))}
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
    marginBottom: 4,
  },

  introCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  introIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },

  introTextBlock: {
    flex: 1,
    gap: 6,
  },

  sectionHeader: {
    marginTop: 4,
  },

  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  categoryChip: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },

  cardContent: {
    flex: 1,
    gap: 2,
  },

  cardTitle: {
    fontWeight: "600",
  },
});