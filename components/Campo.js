import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colores, TAMANO_TACTIL } from '../constants/colors';

// Campo de texto con etiqueta arriba. Acepta las mismas props que TextInput.
export default function Campo({ etiqueta, error, style, ...props }) {
  return (
    <View style={[estilos.contenedor, style]}>
      {etiqueta ? <Text style={estilos.etiqueta}>{etiqueta}</Text> : null}
      <TextInput
        accessibilityLabel={etiqueta}
        placeholderTextColor="#8A949C"
        style={[estilos.entrada, error && { borderColor: colores.error }]}
        {...props}
      />
      {error ? <Text style={estilos.error}>{error}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: 6 },
  etiqueta: { fontSize: 13, fontWeight: '600', color: colores.textoSuave },
  entrada: {
    minHeight: TAMANO_TACTIL + 4,
    borderWidth: 1.5,
    borderColor: colores.borde,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: colores.tarjeta,
    fontSize: 16,
    color: colores.texto,
  },
  error: { color: colores.error, fontSize: 13 },
});
