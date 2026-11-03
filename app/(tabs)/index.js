// Pantalla de INICIO: encabezado del restaurante y tarjetas de mesas (RF-01, RF-02).
import { useRef } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colores } from '../../constants/colors';
import { NEGOCIO } from '../../constants/negocio';
import { obtenerMesasActivas } from '../../services/api';
import { useCarga } from '../../services/useCarga';
import Boton from '../../components/Boton';
import MesaCard from '../../components/MesaCard';
import { Cargando, ErrorReintentar } from '../../components/Estados';

export default function Inicio() {
  const router = useRouter();
  const listaRef = useRef(null);
  const { datos: mesas, cargando, refrescando, error, recargar } = useCarga(obtenerMesasActivas);

  if (cargando) return <Cargando texto="Cargando mesas…" />;
  if (error && !mesas) return <ErrorReintentar mensaje={error} onReintentar={recargar} />;

  const irAMesas = () => {
    try {
      listaRef.current?.scrollToIndex({ index: 0, animated: true });
    } catch {}
  };

  const reservar = (mesa) => router.push({ pathname: '/reservar/[mesaId]', params: { mesaId: mesa.id } });

  const encabezado = (
    <View style={estilos.encabezado}>
      <View style={estilos.logo}>
        <Text style={estilos.logoTexto}>KONYS</Text>
        <Text style={estilos.logoSub}>{NEGOCIO.eslogan}</Text>
      </View>
      <View style={estilos.horario}>
        <Ionicons name="time-outline" size={16} color={colores.primario} />
        <Text style={estilos.horarioTexto}>{NEGOCIO.horarioTexto}</Text>
      </View>
      <Boton
        titulo="Reservar mesa"
        onPress={irAMesas}
        deshabilitado={!mesas || mesas.length === 0}
        style={{ marginTop: 14 }}
      />
      {error ? <Text style={estilos.aviso}>{error}</Text> : null}
      <Text style={estilos.subtitulo}>Nuestras mesas</Text>
    </View>
  );

  return (
    <FlatList
      ref={listaRef}
      data={mesas ?? []}
      keyExtractor={(m) => m.id}
      renderItem={({ item }) => <MesaCard mesa={item} onReservar={reservar} />}
      ListHeaderComponent={encabezado}
      ListEmptyComponent={
        <Text style={estilos.vacio}>
          Por ahora no hay mesas disponibles para reservar. Intenta de nuevo más tarde.
        </Text>
      }
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      contentContainerStyle={estilos.contenido}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={recargar} />}
      onScrollToIndexFailed={() => {}}
    />
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: 16, paddingBottom: 28 },
  encabezado: { marginBottom: 6 },
  logo: {
    backgroundColor: colores.primario,
    borderRadius: 14,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 4,
  },
  logoTexto: { color: colores.acento, fontSize: 40, fontWeight: '900', letterSpacing: 4 },
  logoSub: { color: colores.blanco, fontSize: 14, opacity: 0.9 },
  horario: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colores.borde,
    backgroundColor: colores.tarjeta,
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  horarioTexto: { color: colores.primario, fontWeight: '600', fontSize: 14 },
  aviso: { marginTop: 10, color: colores.error, textAlign: 'center' },
  subtitulo: { marginTop: 22, marginBottom: 10, fontSize: 20, fontWeight: '800', color: colores.texto },
  vacio: { textAlign: 'center', color: colores.textoSuave, marginTop: 20, fontSize: 15, lineHeight: 21 },
});
