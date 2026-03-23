import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '@/constants/styles';

export default function Home() {
  return (
    <View style={styles.container}>

      <Text style={{ fontSize: 18 }}>Hola 👋</Text>

      <Text style={{ marginTop: 20 }}>
        ¿Cómo te sientes hoy?
      </Text>

      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20
      }}>
        {['😡','😕','😐','😊','😁'].map((emoji, i) => (
          <TouchableOpacity key={i}>
            <Text style={{ fontSize: 30 }}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ marginTop: 30 }}>
        <Text>Chat privado</Text>

        <View style={{
          borderWidth: 1,
          height: 200,
          marginTop: 10,
          padding: 10
        }}>
          <Text>Hola, ¿en qué puedo ayudarte?</Text>
        </View>
      </View>

    </View>
  );
}