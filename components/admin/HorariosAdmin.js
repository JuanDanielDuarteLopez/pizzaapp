// Admin · Horarios: jornadas de atención por día y duración de cada reserva (RF-11).
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { colores, TAMANO_TACTIL } from '../../constants/colors';
import { obtenerHorarios } from '../../services/api';
import { guardarHorario } from '../../services/admin';
import { aMinutos, DIAS_SEMANA, recortarHora } from '../../services/fechas';
import { NOMBRES_JORNADA, PASO_MINUTOS } from '../../services/reservas';
import { useCarga } from '../../services/useCarga';
import Boton from '../Boton';
import Campo from '../Campo';
import { Cargando, ErrorReintentar } from '../Estados';

const JORNADAS = ['almuerzo', 'noche'];
const POR_DEFECTO = {
  almuerzo: { inicio: '12:30', fin: '14:30' },
  noche: { inicio: '17:00', fin: '23:00' },
};

const construirFilas = (horarios) => {
  const filas = {};
  for (const { clave } of DIAS_SEMANA) {
    for (const j of JORNADAS) {
      const h = horarios.find((x) => x.dia_semana === clave && x.jornada === j);
      filas[`${clave}|${j}`] = {
        inicio: recortarHora(h?.hora_inicio ?? POR_DEFECTO[j].inicio),
        fin: recortarHora(h?.hora_fin ?? POR_DEFECTO[j].fin),
        activo: h ? h.activo : false,
      };
    }
  }
  return filas;
};

// '9:5' no vale; '9:05' o '09:05' sí. Devuelve '09:05' o null.
function normalizarHora(texto) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(texto.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export default function HorariosAdmin({ pin }) {
  const { datos: horarios, cargando, refrescando, error, recargar, actualizar } = useCarga(obtenerHorarios);
  const [filas, setFilas] = useState(null);
  const [duracion, setDuracion] = useState('60');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null); // { tipo: 'ok' | 'error', texto }

  useEffect(() => {
    if (horarios) {
      setFilas(construirFilas(horarios));
      setDuracion(String(horarios[0]?.duracion_slot ?? 60));
    }
  }, [horarios]);

  const cambiar = (clave, jornada, campos) => {
    setMensaje(null);
    setFilas((prev) => ({ ...prev, [`${clave}|${jornada}`]: { ...prev[`${clave}|${jornada}`], ...campos } }));
  };

  const diaAbierto = (clave) => JORNADAS.some((j) => filas[`${clave}|${j}`].activo);
  const alternarDia = (clave, valor) => JORNADAS.forEach((j) => cambiar(clave, j, { activo: valor }));

  const guardarTodo = async () => {
    setMensaje(null);
    const dur = parseInt(duracion, 10);
    if (Number.isNaN(dur) || dur < 15 || dur > 240) {
      setMensaje({ tipo: 'error', texto: 'La duración de cada reserva debe estar entre 15 y 240 minutos.' });
      return;
    }

    const paraGuardar = [];
    for (const { clave, etiqueta } of DIAS_SEMANA) {
      for (const j of JORNADAS) {
        const f = filas[`${clave}|${j}`];
        let inicio = normalizarHora(f.inicio);
        let fin = normalizarHora(f.fin);
        if (f.activo) {
          if (!inicio || !fin) {
            setMensaje({ tipo: 'error', texto: `${etiqueta} (${NOMBRES_JORNADA[j]}): escribe las horas como 12:30.` });
            return;
          }
          if (aMinutos(fin) <= aMinutos(inicio)) {
            setMensaje({ tipo: 'error', texto: `${etiqueta} (${NOMBRES_JORNADA[j]}): la hora de cierre debe ser posterior a la de apertura.` });
            return;
          }
          if (aMinutos(fin) - aMinutos(inicio) < dur) {
            setMensaje({ tipo: 'error', texto: `${etiqueta} (${NOMBRES_JORNADA[j]}): la jornada es más corta que la duración de una reserva.` });
            return;
          }
        } else if (!inicio || !fin || aMinutos(fin) <= aMinutos(inicio)) {
          inicio = POR_DEFECTO[j].inicio;
          fin = POR_DEFECTO[j].fin;
        }
        paraGuardar.push({
          dia_semana: clave,
          jornada: j,
          hora_inicio: inicio,
          hora_fin: fin,
          duracion_slot: dur,
          activo: f.activo,
        });
      }
    }

    setGuardando(true);
    try {
      await Promise.all(paraGuardar.map((h) => guardarHorario(pin, h)));
      await actualizar();
      setMensaje({ tipo: 'ok', texto: 'Horarios guardados.' });
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e.message });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando || (horarios && !filas)) return <Cargando texto="Cargando horarios…" />;
  if (error && !horarios) return <ErrorReintentar mensaje={error} onReintentar={recargar} />;

  const encabezado = (
    <View style={{ gap: 6, marginBottom: 12 }}>
      <Text style={estilos.titulo}>Jornadas por día</Text>
      <Campo
        etiqueta="Duración de cada reserva (minutos)"
        value={duracion}
        onChangeText={(t) => {
          setMensaje(null);
          setDuracion(t.replace(/[^0-9]/g, ''));
        }}
        keyboardType="number-pad"
        maxLength={3}
      />
      <Text style={estilos.nota}>
        Las horas se ofrecen cada {PASO_MINUTOS} minutos y la última reserva debe terminar antes del cierre.
      </Text>
    </View>
  );

  return (
    <FlatList
      data={DIAS_SEMANA}
      keyExtractor={(d) => d.clave}
      ListHeaderComponent={encabezado}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={recargar} />}
      renderItem={({ item }) => (
        <View style={estilos.tarjeta}>
          <View style={estilos.cabeceraDia}>
            <Text style={estilos.dia}>{item.etiqueta}</Text>
            <Switch
              value={diaAbierto(item.clave)}
              onValueChange={(v) => alternarDia(item.clave, v)}
              trackColor={{ true: colores.primario }}
              accessibilityLabel={`${item.etiqueta} abierto`}
            />
          </View>
          {JORNADAS.map((j) => {
            const f = filas[`${item.clave}|${j}`];
            return (
              <View key={j} style={[estilos.jornada, !f.activo && { opacity: 0.5 }]}>
                <Switch
                  value={f.activo}
                  onValueChange={(v) => cambiar(item.clave, j, { activo: v })}
                  trackColor={{ true: colores.primario }}
                  accessibilityLabel={`${item.etiqueta} ${NOMBRES_JORNADA[j]}`}
                />
                <Text style={estilos.nombreJornada}>{NOMBRES_JORNADA[j]}</Text>
                <TextInput
                  value={f.inicio}
                  onChangeText={(t) => cambiar(item.clave, j, { inicio: t })}
                  style={estilos.hora}
                  maxLength={5}
                  keyboardType="numbers-and-punctuation"
                  editable={f.activo}
                  accessibilityLabel={`Apertura ${NOMBRES_JORNADA[j]} ${item.etiqueta}`}
                />
                <Text style={estilos.guion}>–</Text>
                <TextInput
                  value={f.fin}
                  onChangeText={(t) => cambiar(item.clave, j, { fin: t })}
                  style={estilos.hora}
                  maxLength={5}
                  keyboardType="numbers-and-punctuation"
                  editable={f.activo}
                  accessibilityLabel={`Cierre ${NOMBRES_JORNADA[j]} ${item.etiqueta}`}
                />
              </View>
            );
          })}
        </View>
      )}
      ListFooterComponent={
        <View style={{ marginTop: 16, gap: 10 }}>
          {mensaje ? (
            <Text style={mensaje.tipo === 'ok' ? estilos.ok : estilos.error} accessibilityLiveRegion="polite">
              {mensaje.texto}
            </Text>
          ) : null}
          <Boton titulo="Guardar horarios" onPress={guardarTodo} cargando={guardando} />
        </View>
      }
    />
  );
}

const estilos = StyleSheet.create({
  titulo: { fontSize: 18, fontWeight: '800', color: colores.texto },
  nota: { fontSize: 13, color: colores.textoSuave, lineHeight: 18 },
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderWidth: 1.5,
    borderColor: colores.borde,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  cabeceraDia: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dia: { fontSize: 17, fontWeight: '800', color: colores.texto },
  jornada: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nombreJornada: { width: 70, fontSize: 13, fontWeight: '600', color: colores.textoSuave },
  hora: {
    flex: 1,
    minHeight: TAMANO_TACTIL,
    borderWidth: 1.5,
    borderColor: colores.borde,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 15,
    color: colores.texto,
    backgroundColor: colores.fondo,
  },
  guion: { color: colores.textoSuave, fontSize: 16 },
  ok: { color: colores.exito, fontWeight: '700', textAlign: 'center' },
  error: { color: colores.error, fontWeight: '600', backgroundColor: '#FBE9E7', padding: 10, borderRadius: 8 },
});
