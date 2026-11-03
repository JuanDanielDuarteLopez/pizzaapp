// Pantallas pequeñas reutilizables: cargando, error con "Reintentar" y lista vacía.
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colores } from '../constants/colors';
import Boton from './Boton';

export function Cargando({ texto = 'Cargando…' }) {
  return (
    <View style={estilos.centro} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colores.acento} />
      <Text style={estilos.texto}>{texto}</Text>
    </View>
  );
}

export function ErrorReintentar({ mensaje, onReintentar }) {
  return (
    <View style={estilos.centro} accessibilityLiveRegion="polite">
      <Ionicons name="cloud-offline-outline" size={46} color={colores.textoSuave} />
      <Text style={estilos.titulo}>No se pudo cargar</Text>
      <Text style={estilos.texto}>{mensaje}</Text>
      {onReintentar ? <Boton titulo="Reintentar" onPress={onReintentar} style={{ marginTop: 16 }} /> : null}
    </View>
  );
}

export function Vacio({ icono = 'file-tray-outline', titulo, texto }) {
  return (
    <View style={estilos.centro}>
      <Ionicons name={icono} size={46} color={colores.textoSuave} />
      <Text style={estilos.titulo}>{titulo}</Text>
      {texto ? <Text style={estilos.texto}>{texto}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 8 },
  titulo: { fontSize: 18, fontWeight: '700', color: colores.texto, textAlign: 'center' },
  texto: { fontSize: 15, color: colores.textoSuave, textAlign: 'center', lineHeight: 21 },
});
