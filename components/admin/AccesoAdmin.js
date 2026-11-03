// Pantalla de acceso con PIN de 4 dígitos (RF-08).
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colores } from '../../constants/colors';
import Boton from '../Boton';

export default function AccesoAdmin({ onIngresar, mensajeInicial }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(mensajeInicial ?? null);
  const [verificando, setVerificando] = useState(false);
  const entradaRef = useRef(null);

  const ingresar = async () => {
    if (pin.length !== 4 || verificando) return;
    setVerificando(true);
    setError(null);
    const resultado = await onIngresar(pin);
    if (resultado) {
      setError(resultado);
      setPin('');
      entradaRef.current?.focus();
    }
    setVerificando(false);
  };

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.logo}>
        <Ionicons name="lock-closed" size={34} color={colores.acento} />
      </View>
      <Text style={estilos.titulo}>Acceso de administrador</Text>
      <Text style={estilos.etiqueta}>PIN de 4 números</Text>

      <Pressable
        onPress={() => entradaRef.current?.focus()}
        style={estilos.cajas}
        accessibilityLabel={`PIN, ${pin.length} de 4 dígitos escritos`}
      >
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[estilos.caja, i === pin.length && estilos.cajaActiva]}>
            <Text style={estilos.punto}>{pin[i] ? '●' : ''}</Text>
          </View>
        ))}
      </Pressable>

      <TextInput
        ref={entradaRef}
        value={pin}
        onChangeText={(t) => {
          setPin(t.replace(/[^0-9]/g, '').slice(0, 4));
          setError(null);
        }}
        onSubmitEditing={ingresar}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        caretHidden
        autoFocus
        style={estilos.oculto}
        accessibilityLabel="Escribe el PIN"
      />

      {error ? (
        <Text style={estilos.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : (
        <Text style={estilos.ayuda}>Si el PIN es incorrecto se mostrará un aviso.</Text>
      )}

      <Boton
        titulo="Ingresar"
        onPress={ingresar}
        cargando={verificando}
        deshabilitado={pin.length !== 4}
        style={{ alignSelf: 'stretch', marginTop: 8 }}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  titulo: { fontSize: 20, fontWeight: '800', color: colores.texto },
  etiqueta: { fontSize: 14, color: colores.textoSuave },
  cajas: { flexDirection: 'row', gap: 12, marginVertical: 8 },
  caja: {
    width: 54,
    height: 62,
    borderWidth: 2,
    borderColor: colores.primario,
    borderRadius: 8,
    backgroundColor: colores.tarjeta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cajaActiva: { borderColor: colores.acento },
  punto: { fontSize: 22, color: colores.primario },
  oculto: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  error: { color: colores.error, fontWeight: '700', textAlign: 'center' },
  ayuda: { color: colores.textoSuave, fontSize: 13, textAlign: 'center' },
});
