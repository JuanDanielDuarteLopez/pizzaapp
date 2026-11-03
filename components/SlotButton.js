import { Pressable, StyleSheet, Text } from 'react-native';
import { colores, TAMANO_TACTIL } from '../constants/colors';

// Una hora en la grilla: libre (blanca), ocupada (gris) o seleccionada (oscura).
export default function SlotButton({ hora, ocupado, seleccionado, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${hora}${ocupado ? ', no disponible' : ''}`}
      accessibilityState={{ disabled: ocupado, selected: seleccionado }}
      disabled={ocupado}
      onPress={onPress}
      style={[estilos.slot, ocupado && estilos.ocupado, seleccionado && estilos.seleccionado]}
    >
      <Text style={[estilos.texto, ocupado && estilos.textoOcupado, seleccionado && estilos.textoSeleccionado]}>
        {hora}
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  slot: {
    minWidth: 72,
    minHeight: TAMANO_TACTIL,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colores.primario,
    backgroundColor: colores.tarjeta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ocupado: { backgroundColor: colores.ocupado, borderColor: colores.ocupado },
  seleccionado: { backgroundColor: colores.primario },
  texto: { fontSize: 15, fontWeight: '700', color: colores.primario },
  textoOcupado: { color: '#8A949C', textDecorationLine: 'line-through' },
  textoSeleccionado: { color: colores.blanco },
});
