// Pantalla RESERVAR MESA: fecha, hora y datos del cliente (RF-03 a RF-06).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colores, TAMANO_TACTIL } from '../../constants/colors';
import { crearReserva, obtenerHorarios, obtenerMesas, obtenerSlotsOcupados } from '../../services/api';
import { aMinutos, aFechaISO, claveDia, deFechaISO, diaCorto, fechaCorta, fechaLarga, proximosDias } from '../../services/fechas';
import {
  agruparPorJornada,
  estaOcupado,
  etiquetaZona,
  generarSlots,
  NOMBRES_JORNADA,
  yaPaso,
} from '../../services/reservas';
import Boton from '../../components/Boton';
import Campo from '../../components/Campo';
import SlotButton from '../../components/SlotButton';
import { Cargando, ErrorReintentar } from '../../components/Estados';

const DIAS_ADELANTE = 21;

function textoDuracion(slot) {
  const min = aMinutos(slot.fin) - aMinutos(slot.inicio);
  return min % 60 === 0 ? `${min / 60} h` : `${min} min`;
}

export default function ReservarMesa() {
  const { mesaId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [base, setBase] = useState(null); // { mesa, horarios }
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  const [fecha, setFecha] = useState(null); // 'YYYY-MM-DD'
  const [ocupados, setOcupados] = useState([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [errorSlots, setErrorSlots] = useState(null);
  const [version, setVersion] = useState(0); // sube para volver a consultar las horas ocupadas

  const [slot, setSlot] = useState(null);
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [personas, setPersonas] = useState('');
  const [errores, setErrores] = useState({});
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // 1) Cargar la mesa y los horarios de atención.
  const cargarBase = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const [mesas, horarios] = await Promise.all([obtenerMesas(), obtenerHorarios()]);
      const mesa = mesas.find((m) => m.id === mesaId);
      if (!mesa || !mesa.activa) {
        throw new Error('Esta mesa ya no está disponible. Vuelve al inicio y elige otra.');
      }
      setBase({ mesa, horarios });
    } catch (e) {
      setErrorCarga(e.message);
    } finally {
      setCargando(false);
    }
  }, [mesaId]);

  useEffect(() => {
    cargarBase();
  }, [cargarBase]);

  // 2) Días en los que el restaurante atiende (y que aún tienen horas libres si es hoy).
  const dias = useMemo(() => {
    if (!base) return [];
    const activos = new Set(base.horarios.filter((h) => h.activo).map((h) => h.dia_semana));
    return proximosDias(DIAS_ADELANTE).filter((d) => {
      if (!activos.has(claveDia(d))) return false;
      const iso = aFechaISO(d);
      const slots = generarSlots(base.horarios.filter((h) => h.dia_semana === claveDia(d)));
      return slots.some((s) => !yaPaso(s, iso));
    });
  }, [base]);

  useEffect(() => {
    if (dias.length > 0 && (!fecha || !dias.some((d) => aFechaISO(d) === fecha))) {
      setFecha(aFechaISO(dias[0]));
    }
  }, [dias, fecha]);

  // 3) Cada vez que cambia la fecha, consultar qué horas ya están ocupadas.
  useEffect(() => {
    if (!fecha) return undefined;
    let cancelado = false;
    setCargandoSlots(true);
    setErrorSlots(null);
    setSlot(null);
    obtenerSlotsOcupados(mesaId, fecha)
      .then((d) => !cancelado && setOcupados(d))
      .catch((e) => !cancelado && setErrorSlots(e.message))
      .finally(() => !cancelado && setCargandoSlots(false));
    return () => {
      cancelado = true;
    };
  }, [fecha, mesaId, version]);

  const slots = useMemo(() => {
    if (!base || !fecha) return [];
    return generarSlots(base.horarios.filter((h) => h.dia_semana === claveDia(deFechaISO(fecha))));
  }, [base, fecha]);
  const grupos = useMemo(() => agruparPorJornada(slots), [slots]);

  const validar = () => {
    const e = {};
    if (!slot) e.slot = 'Elige una hora disponible.';
    if (!nombre.trim()) e.nombre = 'Escribe tu nombre.';
    const n = parseInt(personas, 10);
    if (!personas.trim() || Number.isNaN(n) || n < 1) e.personas = 'Indica cuántas personas serán.';
    else if (n > base.mesa.capacidad) e.personas = `Esta mesa admite máximo ${base.mesa.capacidad} personas.`;
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const confirmar = async () => {
    setErrorEnvio(null);
    if (!validar()) return;
    setEnviando(true);
    try {
      const r = await crearReserva({
        mesaId,
        nombre: nombre.trim(),
        contacto: contacto.trim(),
        personas: parseInt(personas, 10),
        fecha,
        horaInicio: slot.inicio,
        horaFin: slot.fin,
      });
      router.replace({
        pathname: '/confirmacion',
        params: {
          nombre: r.cliente_nombre,
          mesa: r.mesa_nombre,
          zona: r.zona,
          fecha,
          hora: slot.inicio,
          personas: String(r.num_personas),
        },
      });
    } catch (e) {
      setErrorEnvio(e.message);
      if (e.codigo === 'slot_ocupado') {
        setSlot(null);
        setVersion((v) => v + 1); // refresca las horas ocupadas
      }
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) return <Cargando texto="Preparando la reserva…" />;
  if (errorCarga) return <ErrorReintentar mensaje={errorCarga} onReintentar={cargarBase} />;

  const { mesa } = base;

  const renderGrupo = (clave) => {
    const lista = grupos[clave];
    if (!lista || lista.length === 0) return null;
    return (
      <View key={clave} style={{ gap: 8 }}>
        <Text style={estilos.seccion}>{NOMBRES_JORNADA[clave]}</Text>
        <View style={estilos.grilla}>
          {lista.map((s) => (
            <SlotButton
              key={s.inicio}
              hora={s.inicio}
              ocupado={estaOcupado(s, ocupados) || yaPaso(s, fecha)}
              seleccionado={slot?.inicio === s.inicio}
              onPress={() => {
                setSlot(s);
                setErrorEnvio(null);
                setErrores((p) => ({ ...p, slot: undefined }));
              }}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: `Reservar · ${mesa.nombre}` }} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[estilos.contenido, { paddingBottom: 28 + insets.bottom }]}
      >
        <View style={estilos.resumenMesa}>
          <Text style={estilos.mesaNombre}>{mesa.nombre}</Text>
          <Text style={estilos.mesaDetalle}>
            {etiquetaZona(mesa.zona)} · hasta {mesa.capacidad} personas
          </Text>
        </View>

        <Text style={estilos.seccion}>Fecha</Text>
        {dias.length === 0 ? (
          <Text style={estilos.aviso}>No hay días disponibles para reservar en este momento.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {dias.map((d) => {
              const iso = aFechaISO(d);
              const activo = iso === fecha;
              return (
                <Pressable
                  key={iso}
                  accessibilityRole="button"
                  accessibilityLabel={fechaLarga(iso)}
                  accessibilityState={{ selected: activo }}
                  onPress={() => setFecha(iso)}
                  style={[estilos.dia, activo && estilos.diaActivo]}
                >
                  <Text style={[estilos.diaNombre, activo && estilos.diaTextoActivo]}>{diaCorto(d)}</Text>
                  <Text style={[estilos.diaNumero, activo && estilos.diaTextoActivo]}>{d.getDate()}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {cargandoSlots ? (
          <Text style={estilos.aviso}>Consultando horas disponibles…</Text>
        ) : errorSlots ? (
          <View style={{ gap: 8 }}>
            <Text style={[estilos.aviso, { color: colores.error }]}>{errorSlots}</Text>
            <Boton titulo="Reintentar" variante="secundario" pequeno onPress={() => setVersion((v) => v + 1)} />
          </View>
        ) : (
          <>
            {renderGrupo('almuerzo')}
            {renderGrupo('noche')}
          </>
        )}
        {errores.slot ? <Text style={estilos.error}>{errores.slot}</Text> : null}

        <Text style={estilos.seccion}>Tus datos</Text>
        <Campo
          etiqueta="Nombre completo"
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre completo"
          autoCapitalize="words"
          error={errores.nombre}
        />
        <Campo
          etiqueta="Teléfono (opcional)"
          value={contacto}
          onChangeText={setContacto}
          placeholder="Teléfono (opcional)"
          keyboardType="phone-pad"
        />
        <Campo
          etiqueta="Número de personas"
          value={personas}
          onChangeText={(t) => setPersonas(t.replace(/[^0-9]/g, ''))}
          placeholder={`Máximo ${mesa.capacidad}`}
          keyboardType="number-pad"
          maxLength={2}
          error={errores.personas}
        />

        {slot ? (
          <View style={estilos.resumen} accessibilityLiveRegion="polite">
            <Text style={estilos.resumenTexto}>
              {mesa.nombre} · {fechaCorta(fecha)} · {slot.inicio}
            </Text>
            <Text style={estilos.resumenSuave}>Duración estimada: {textoDuracion(slot)}</Text>
          </View>
        ) : null}

        {errorEnvio ? <Text style={estilos.errorEnvio}>{errorEnvio}</Text> : null}

        <Boton titulo="Confirmar reserva" onPress={confirmar} cargando={enviando} deshabilitado={!slot} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: 16, gap: 14 },
  resumenMesa: {
    backgroundColor: colores.primario,
    borderRadius: 12,
    padding: 14,
    gap: 2,
  },
  mesaNombre: { color: colores.blanco, fontSize: 20, fontWeight: '800' },
  mesaDetalle: { color: colores.acento, fontSize: 14, fontWeight: '600' },
  seccion: { fontSize: 16, fontWeight: '800', color: colores.texto, marginTop: 4 },
  aviso: { color: colores.textoSuave, fontSize: 14 },
  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dia: {
    width: 64,
    minHeight: TAMANO_TACTIL + 18,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colores.primario,
    backgroundColor: colores.tarjeta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaActivo: { backgroundColor: colores.primario },
  diaNombre: { fontSize: 13, color: colores.primario, fontWeight: '600' },
  diaNumero: { fontSize: 20, color: colores.primario, fontWeight: '800' },
  diaTextoActivo: { color: colores.blanco },
  resumen: {
    backgroundColor: colores.tarjeta,
    borderWidth: 1.5,
    borderColor: colores.borde,
    borderRadius: 10,
    padding: 12,
    gap: 2,
  },
  resumenTexto: { fontSize: 15, fontWeight: '700', color: colores.texto },
  resumenSuave: { fontSize: 14, color: colores.textoSuave },
  error: { color: colores.error, fontSize: 13 },
  errorEnvio: {
    color: colores.error,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: '#FBE9E7',
    padding: 10,
    borderRadius: 8,
  },
});
