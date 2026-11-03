import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colores } from '../constants/colors';
import { etiquetaZona } from '../services/reservas';
import Boton from './Boton';

// Tarjeta de una mesa en la pantalla de inicio (RF-01).
export default function MesaCard({ mesa, onReservar }) {
  return (
    <View style={estilos.tarjeta}>
      {mesa.foto_url ? (
        <Image source={{ uri: mesa.foto_url }} style={estilos.foto} accessibilityLabel={`Foto de ${mesa.nombre}`} />
      ) : (
        <View style={[estilos.foto, estilos.fotoVacia]}>
          <Ionicons name="restaurant-outline" size={30} color={colores.textoSuave} />
        </View>
      )}
      <View style={estilos.info}>
        <Text style={estilos.nombre}>{mesa.nombre}</Text>
        <Text style={estilos.detalle}>
          {etiquetaZona(mesa.zona)} · {mesa.capacidad} pers.
        </Text>
        <View style={estilos.fila}>
          <View style={estilos.pildora}>
            <Text style={estilos.pildoraTexto}>Disponible</Text>
          </View>
          <Boton titulo="Reservar" variante="secundario" pequeno onPress={() => onReservar(mesa)} />
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    backgroundColor: colores.tarjeta,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colores.borde,
    padding: 10,
    gap: 12,
  },
  foto: { width: 92, height: 92, borderRadius: 8 },
  fotoVacia: { backgroundColor: colores.ocupado, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, justifyContent: 'space-between' },
  nombre: { fontSize: 17, fontWeight: '800', color: colores.texto },
  detalle: { fontSize: 14, color: colores.textoSuave },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pildora: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E4F3EA',
  },
  pildoraTexto: { fontSize: 12, fontWeight: '700', color: colores.exito },
});
