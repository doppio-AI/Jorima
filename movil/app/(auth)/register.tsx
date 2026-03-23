import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { styles } from '@/constants/styles';

export default function Register() {
  return (
    <ScrollView contentContainerStyle={styles.container}>

      <View style={styles.card}>

        <Text style={styles.title}>Crear Cuenta</Text>

        <TextInput placeholder="Nombre completo" style={styles.input} />
        <TextInput placeholder="Correo institucional" style={styles.input} />
        <TextInput placeholder="Matrícula" style={styles.input} />
        <TextInput placeholder="Contraseña" secureTextEntry style={styles.input} />
        <TextInput placeholder="Confirmar contraseña" secureTextEntry style={styles.input} />

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Registrar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ textAlign: 'center', marginTop: 10 }}>
            Volver
          </Text>
        </TouchableOpacity>

      </View>

    </ScrollView>
  );
}