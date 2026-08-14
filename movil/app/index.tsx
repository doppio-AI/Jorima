import React from "react";
import { SafeAreaView, StyleSheet, View, Image } from "react-native";
import { router } from "expo-router";

import { COLORS, SIZES } from "@/constants/theme"; // Ajusta la ruta si es necesario
import ThemedText from "@/components/ThemedText";
import ThemedButton from "@/components/ThemedButton";

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Sección de Logo y Mensaje de Bienvenida */}
        <View style={styles.headerContainer}>
          
          {/* Contenedor transparente para el logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require("@/assets/images/logo1.png")} // Asegúrate de que el nombre coincida (jpeg o jpg)
              style={styles.logoImage}
              resizeMode="contain" 
            />
          </View>
          
          <ThemedText variant="body" color={COLORS.textSecondary} style={styles.subtitle}>
            Bienvenido a tu plataforma de gestión emocional. Inicia sesión o regístrate para comenzar a administrar todo en un solo lugar.
          </ThemedText>
        </View>

        {/* Sección de Botones de Acción */}
        <View style={styles.actionContainer}>
          <ThemedButton 
            title="Iniciar sesión" 
            onPress={() => router.push("/(auth)/login")} 
          />
          
          <ThemedButton 
            title="Crear una cuenta" 
            variant="outline" 
            onPress={() => router.push("/(auth)/register")} 
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
    justifyContent: "space-between", // Empuja el header arriba y los botones abajo
  },
  
  headerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SIZES.padding,
  },
  
  // Contenedor sin bordes ni sombras, solo para centrar
  logoContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32, // Espacio entre el logo y el texto de abajo
  },
  
  // Tamaño ajustado para un logo horizontal
  logoImage: {
    width: 280,  // Bastante ancho para que el texto del logo se lea bien
    height: 120, // Altura proporcional
  },
  
  subtitle: {
    textAlign: "center",
    lineHeight: 24, // Mejora la lectura
    paddingHorizontal: 10,
  },
  
  actionContainer: {
    width: "100%",
    gap: 16, // Separación consistente entre los botones
    paddingBottom: 24,
  },
});