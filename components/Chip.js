import { Pressable, StyleSheet, Text } from 'react-native';
import { colores, TAMANO_TACTIL } from '../constants/colors';

// Botoncito tipo "píldora": se usa para categorías de la carta y filtros.
export default function Chip({ titulo, activo, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!activo }}
      onPress={onPress}
      style={[estilos.chip, activo && estilos.activo]}
    >
      <Text style={[estilos.texto, activo && estilos.textoActivo]}>{titulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  chip: {
    minHeight: TAMANO_TACTIL - 6,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colores.borde,
    backgroundColor: colores.tarjeta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activo: { backgroundColor: colores.primario, borderColor: colores.primario },
  texto: { color: colores.texto, fontWeight: '600', fontSize: 14 },
  textoActivo: { color: colores.blanco },
});
