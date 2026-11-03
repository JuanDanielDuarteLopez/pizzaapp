import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colores, TAMANO_TACTIL } from '../constants/colors';

// variante: 'principal' (oscuro) | 'secundario' (borde) | 'peligro' | 'acento' (naranja)
export default function Boton({
  titulo,
  onPress,
  variante = 'principal',
  cargando = false,
  deshabilitado = false,
  pequeno = false,
  style,
}) {
  const inactivo = deshabilitado || cargando;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: inactivo }}
      onPress={onPress}
      disabled={inactivo}
      style={({ pressed }) => [
        estilos.base,
        pequeno && estilos.pequeno,
        estilos[variante],
        inactivo && estilos.inactivo,
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={variante === 'secundario' ? colores.primario : colores.blanco} />
      ) : (
        <Text
          style={[
            estilos.texto,
            pequeno && estilos.textoPequeno,
            (variante === 'secundario' || variante === 'acento') && { color: colores.primario },
            variante === 'peligro' && { color: colores.error },
          ]}
        >
          {titulo}
        </Text>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: TAMANO_TACTIL + 4,
    borderRadius: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  pequeno: { minHeight: TAMANO_TACTIL, paddingHorizontal: 14 },
  principal: { backgroundColor: colores.primario, borderColor: colores.primario },
  acento: { backgroundColor: colores.acento, borderColor: colores.acento },
  secundario: { backgroundColor: colores.tarjeta, borderColor: colores.primario },
  peligro: { backgroundColor: colores.tarjeta, borderColor: colores.error },
  inactivo: { opacity: 0.45 },
  texto: { color: colores.blanco, fontSize: 16, fontWeight: '700' },
  textoPequeno: { fontSize: 14 },
});
