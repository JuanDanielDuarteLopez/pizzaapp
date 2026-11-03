// Ventana a pantalla completa para formularios y detalles del panel de administración.
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colores, TAMANO_TACTIL } from '../../constants/colors';

export default function ModalHoja({ visible, titulo, onCerrar, children }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar}>
      <View style={[estilos.raiz, { paddingTop: insets.top }]}>
        <View style={estilos.cabecera}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onCerrar} style={estilos.volver}>
            <Ionicons name="arrow-back" size={24} color={colores.blanco} />
          </Pressable>
          <Text style={estilos.titulo}>{titulo}</Text>
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 28 + insets.bottom }}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: colores.fondo },
  cabecera: {
    backgroundColor: colores.primario,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    minHeight: 56,
    gap: 4,
  },
  volver: { width: TAMANO_TACTIL, height: TAMANO_TACTIL, alignItems: 'center', justifyContent: 'center' },
  titulo: { color: colores.blanco, fontSize: 18, fontWeight: '800' },
});
