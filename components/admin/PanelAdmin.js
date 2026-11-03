// Panel de administración: barra superior + sección activa + pestañas inferiores
// (Mesas / Horarios / Reservas). La Carta se abre desde un botón de la barra superior.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colores, TAMANO_TACTIL } from '../../constants/colors';
import { cambiarPin, guardarPin } from '../../services/admin';
import Boton from '../Boton';
import Campo from '../Campo';
import CartaAdmin from './CartaAdmin';
import HorariosAdmin from './HorariosAdmin';
import MesasAdmin from './MesasAdmin';
import ModalHoja from './ModalHoja';
import ReservasAdmin from './ReservasAdmin';

const SECCIONES = [
  { clave: 'mesas', titulo: 'Mesas', icono: 'grid-outline' },
  { clave: 'horarios', titulo: 'Horarios', icono: 'time-outline' },
  { clave: 'reservas', titulo: 'Reservas', icono: 'calendar-outline' },
];

function BotonIcono({ icono, etiqueta, onPress }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={etiqueta} onPress={onPress} style={estilos.botonIcono}>
      <Ionicons name={icono} size={22} color={colores.primario} />
    </Pressable>
  );
}

function CambiarPin({ pin, onCerrar, onCambiado }) {
  const [nuevo, setNuevo] = useState('');
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!/^[0-9]{4}$/.test(nuevo)) {
      setError('El nuevo PIN debe tener exactamente 4 números.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await cambiarPin(pin, nuevo);
      await guardarPin(nuevo);
      onCambiado(nuevo);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <Text style={estilos.ayuda}>Elige un PIN de 4 números y no lo compartas con los clientes.</Text>
      <Campo
        etiqueta="Nuevo PIN"
        value={nuevo}
        onChangeText={(t) => {
          setNuevo(t.replace(/[^0-9]/g, '').slice(0, 4));
          setError(null);
        }}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        error={error}
      />
      <Boton titulo="Guardar PIN" onPress={guardar} cargando={guardando} />
      <Boton titulo="Cancelar" variante="secundario" onPress={onCerrar} />
    </>
  );
}

export default function PanelAdmin({ pin, onSalir, onPinCambiado }) {
  const [seccion, setSeccion] = useState('mesas');
  const [cambiandoPin, setCambiandoPin] = useState(false);

  const enCarta = seccion === 'carta';
  const titulo = enCarta ? 'Admin · Carta' : `Admin · ${SECCIONES.find((s) => s.clave === seccion)?.titulo}`;

  return (
    <View style={{ flex: 1 }}>
      <View style={estilos.barra}>
        {enCarta ? (
          <BotonIcono icono="arrow-back" etiqueta="Volver al panel" onPress={() => setSeccion('mesas')} />
        ) : null}
        <Text style={estilos.titulo} numberOfLines={1}>
          {titulo}
        </Text>
        {!enCarta ? <BotonIcono icono="restaurant-outline" etiqueta="Administrar la carta" onPress={() => setSeccion('carta')} /> : null}
        <BotonIcono icono="key-outline" etiqueta="Cambiar PIN" onPress={() => setCambiandoPin(true)} />
        <BotonIcono icono="log-out-outline" etiqueta="Cerrar sesión de administrador" onPress={onSalir} />
      </View>

      <View style={{ flex: 1 }}>
        {seccion === 'mesas' ? <MesasAdmin pin={pin} /> : null}
        {seccion === 'horarios' ? <HorariosAdmin pin={pin} /> : null}
        {seccion === 'reservas' ? <ReservasAdmin pin={pin} /> : null}
        {seccion === 'carta' ? <CartaAdmin pin={pin} /> : null}
      </View>

      {!enCarta ? (
        <View style={estilos.pestanas}>
          {SECCIONES.map((s) => {
            const activa = s.clave === seccion;
            return (
              <Pressable
                key={s.clave}
                accessibilityRole="button"
                accessibilityState={{ selected: activa }}
                onPress={() => setSeccion(s.clave)}
                style={[estilos.pestana, activa && estilos.pestanaActiva]}
              >
                <Ionicons name={s.icono} size={20} color={activa ? colores.primario : '#7C8790'} />
                <Text style={[estilos.pestanaTexto, activa && { color: colores.primario }]}>{s.titulo}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <ModalHoja visible={cambiandoPin} titulo="Cambiar PIN" onCerrar={() => setCambiandoPin(false)}>
        {cambiandoPin ? (
          <CambiarPin
            pin={pin}
            onCerrar={() => setCambiandoPin(false)}
            onCambiado={(nuevo) => {
              setCambiandoPin(false);
              onPinCambiado(nuevo);
            }}
          />
        ) : null}
      </ModalHoja>
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    minHeight: 54,
    backgroundColor: colores.tarjeta,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  titulo: { flex: 1, fontSize: 17, fontWeight: '800', color: colores.texto },
  botonIcono: { width: TAMANO_TACTIL, height: TAMANO_TACTIL, alignItems: 'center', justifyContent: 'center' },
  pestanas: {
    flexDirection: 'row',
    backgroundColor: colores.tarjeta,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
  },
  pestana: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderTopWidth: 3,
    borderTopColor: 'transparent',
  },
  pestanaActiva: { borderTopColor: colores.acento },
  pestanaTexto: { fontSize: 12, fontWeight: '700', color: '#7C8790' },
  ayuda: { color: colores.textoSuave, fontSize: 14, lineHeight: 20 },
});
