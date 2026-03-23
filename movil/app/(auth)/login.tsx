import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { styles } from '@/constants/styles';

export default function Login() {
  return (
    <View style={styles.container}>

      <View style={styles.card}>

        <Text style={styles.title}>Iniciar Sesión</Text>

        <TextInput
          placeholder="Correo institucional"
          style={styles.input}
        />

        <TextInput
          placeholder="Contraseña"
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={{ textAlign: 'center', marginTop: 10 }}>
            ¿No tienes cuenta? Regístrate
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}