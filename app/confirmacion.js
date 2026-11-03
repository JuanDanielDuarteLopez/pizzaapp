// Pantalla de CONFIRMACIÓN: comprobante visual de la reserva (RF-06).
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colores } from '../constants/colors';
import { fechaLarga } from '../services/fechas';
import { etiquetaZona } from '../services/reservas';
import Boton from '../components/Boton';

export default function Confirmacion() {
  const { nombre, mesa, zona, fecha, hora, personas } = useLocalSearchParams();
  const router = useRouter();

  const filas = [
    ['Nombre', nombre],
    ['Mesa', `${mesa} (${etiquetaZona(zona)})`],
    ['Fecha', fecha ? fechaLarga(String(fecha)) : ''],
    ['Hora', hora],
    ['Personas', personas],
  ];

  return (
    <ScrollView contentContainerStyle={estilos.contenido}>
      <View style={estilos.circulo} accessibilityLabel="Reserva confirmada">
        <Ionicons name="checkmark" size={54} color={colores.exito} />
      </View>
      <Text style={estilos.titulo}>¡Reserva confirmada!</Text>
      <Text style={estilos.sub}>Guarda una captura de esta pantalla como comprobante.</Text>

      <View style={estilos.tarjeta}>
        {filas.map(([etiqueta, valor]) => (
          <View key={etiqueta} style={estilos.fila}>
            <Text style={estilos.etiqueta}>{etiqueta}</Text>
            <Text style={estilos.valor}>{valor}</Text>
          </View>
        ))}
      </View>

      <Boton titulo="Volver al inicio" variante="secundario" onPress={() => router.replace('/')} style={{ alignSelf: 'stretch' }} />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: 24, alignItems: 'center', gap: 14 },
  circulo: {
    marginTop: 12,
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
    borderColor: colores.exito,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.tarjeta,
  },
  titulo: { fontSize: 24, fontWeight: '900', color: colores.texto },
  sub: { fontSize: 14, color: colores.textoSuave, textAlign: 'center' },
  tarjeta: {
    alignSelf: 'stretch',
    backgroundColor: colores.tarjeta,
    borderWidth: 1.5,
    borderColor: colores.borde,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginVertical: 8,
  },
  fila: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  etiqueta: { color: colores.textoSuave, fontSize: 15 },
  valor: { color: colores.texto, fontSize: 15, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
});
