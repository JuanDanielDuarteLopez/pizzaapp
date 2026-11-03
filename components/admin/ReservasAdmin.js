// Admin · Reservas: listado con filtros Hoy / Mañana / Todas y cambio de estado (RF-12).
import { useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colores } from '../../constants/colors';
import { cambiarEstadoReserva, listarReservas } from '../../services/admin';
import { aFechaISO, fechaLarga, recortarHora } from '../../services/fechas';
import { useCarga } from '../../services/useCarga';
import Boton from '../Boton';
import Chip from '../Chip';
import { Cargando, ErrorReintentar, Vacio } from '../Estados';
import ModalHoja from './ModalHoja';

const ETIQUETA_ESTADO = { confirmada: 'Confirmada', cancelada: 'Cancelada', completada: 'Completada' };

function PildoraEstado({ estado }) {
  const confirmada = estado === 'confirmada';
  return (
    <View style={[estilos.pildora, confirmada && estilos.pildoraConfirmada, estado === 'cancelada' && estilos.pildoraCancelada]}>
      <Text style={[estilos.pildoraTexto, confirmada && { color: colores.blanco }, estado === 'cancelada' && { color: colores.error }]}>
        {ETIQUETA_ESTADO[estado] ?? estado}
      </Text>
    </View>
  );
}

export default function ReservasAdmin({ pin }) {
  const { datos: reservas, cargando, refrescando, error, recargar, actualizar } = useCarga(() => listarReservas(pin));
  const [filtro, setFiltro] = useState('hoy');
  const [detalle, setDetalle] = useState(null);
  const [cambiando, setCambiando] = useState(false);

  const visibles = useMemo(() => {
    if (!reservas) return [];
    const hoy = new Date();
    const hoyISO = aFechaISO(hoy);
    const mananaISO = aFechaISO(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1, 12));
    if (filtro === 'todas') return reservas;
    const dia = filtro === 'hoy' ? hoyISO : mananaISO;
    return reservas.filter((r) => r.fecha === dia).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  }, [reservas, filtro]);

  const cambiarEstado = async (reserva, estado) => {
    setCambiando(true);
    try {
      await cambiarEstadoReserva(pin, reserva.id, estado);
      setDetalle(null);
      await actualizar();
    } catch (e) {
      Alert.alert('No se pudo cambiar el estado', e.message);
    } finally {
      setCambiando(false);
    }
  };

  const pedirCambio = (reserva, estado) => {
    if (estado !== 'cancelada') return cambiarEstado(reserva, estado);
    Alert.alert('Cancelar reserva', `¿Cancelar la reserva de ${reserva.cliente_nombre}? La hora quedará libre de nuevo.`, [
      { text: 'Volver', style: 'cancel' },
      { text: 'Cancelar reserva', style: 'destructive', onPress: () => cambiarEstado(reserva, estado) },
    ]);
  };

  if (cargando) return <Cargando texto="Cargando reservas…" />;
  if (error && !reservas) return <ErrorReintentar mensaje={error} onReintentar={recargar} />;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingVertical: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          <Chip titulo="Hoy" activo={filtro === 'hoy'} onPress={() => setFiltro('hoy')} />
          <Chip titulo="Mañana" activo={filtro === 'manana'} onPress={() => setFiltro('manana')} />
          <Chip titulo="Todas" activo={filtro === 'todas'} onPress={() => setFiltro('todas')} />
        </ScrollView>
      </View>

      <FlatList
        data={visibles}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 28, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={recargar} />}
        ListEmptyComponent={
          <Vacio
            icono="calendar-outline"
            titulo="Sin reservas"
            texto={filtro === 'todas' ? 'Todavía no hay reservas registradas.' : 'No hay reservas para este día.'}
          />
        }
        renderItem={({ item }) => (
          <View style={estilos.tarjeta}>
            <Text style={estilos.cliente}>{item.cliente_nombre}</Text>
            <Text style={estilos.detalle}>
              {item.mesa_nombre} · {recortarHora(item.hora_inicio)} · {item.num_personas} pers.
              {filtro === 'todas' ? `  ·  ${fechaLarga(item.fecha)}` : ''}
            </Text>
            <View style={estilos.fila}>
              <PildoraEstado estado={item.estado} />
              <Boton titulo="Ver" variante="secundario" pequeno onPress={() => setDetalle(item)} />
            </View>
          </View>
        )}
      />

      <ModalHoja visible={detalle !== null} titulo="Detalle de la reserva" onCerrar={() => setDetalle(null)}>
        {detalle ? (
          <>
            <View style={estilos.tarjeta}>
              {[
                ['Cliente', detalle.cliente_nombre],
                ['Contacto', detalle.cliente_contacto || 'No indicado'],
                ['Mesa', detalle.mesa_nombre],
                ['Fecha', fechaLarga(detalle.fecha)],
                ['Hora', `${recortarHora(detalle.hora_inicio)} – ${recortarHora(detalle.hora_fin)}`],
                ['Personas', String(detalle.num_personas)],
              ].map(([etiqueta, valor]) => (
                <View key={etiqueta} style={estilos.filaDato}>
                  <Text style={estilos.etiqueta}>{etiqueta}</Text>
                  <Text style={estilos.valor}>{valor}</Text>
                </View>
              ))}
              <View style={estilos.filaDato}>
                <Text style={estilos.etiqueta}>Estado</Text>
                <PildoraEstado estado={detalle.estado} />
              </View>
            </View>

            <Text style={estilos.seccion}>Cambiar estado</Text>
            {detalle.estado !== 'confirmada' ? (
              <Boton titulo="Marcar como confirmada" onPress={() => pedirCambio(detalle, 'confirmada')} cargando={cambiando} />
            ) : null}
            {detalle.estado !== 'completada' ? (
              <Boton titulo="Marcar como completada" variante="secundario" onPress={() => pedirCambio(detalle, 'completada')} deshabilitado={cambiando} />
            ) : null}
            {detalle.estado !== 'cancelada' ? (
              <Boton titulo="Cancelar reserva" variante="peligro" onPress={() => pedirCambio(detalle, 'cancelada')} deshabilitado={cambiando} />
            ) : null}
          </>
        ) : null}
      </ModalHoja>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderWidth: 1.5,
    borderColor: colores.borde,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  cliente: { fontSize: 17, fontWeight: '800', color: colores.texto },
  detalle: { fontSize: 14, color: colores.textoSuave },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  pildora: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colores.borde,
    backgroundColor: colores.fondo,
  },
  pildoraConfirmada: { backgroundColor: colores.primario, borderColor: colores.primario },
  pildoraCancelada: { backgroundColor: '#FBE9E7', borderColor: '#F0C4BE' },
  pildoraTexto: { fontSize: 12, fontWeight: '700', color: colores.textoSuave },
  filaDato: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  etiqueta: { color: colores.textoSuave, fontSize: 15 },
  valor: { color: colores.texto, fontSize: 15, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  seccion: { fontSize: 16, fontWeight: '800', color: colores.texto },
});
