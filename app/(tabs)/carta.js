// Pantalla CARTA: platos por categoría, solo lectura (RF-07).
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colores } from '../../constants/colors';
import { CATEGORIAS } from '../../constants/categorias';
import { obtenerPlatos } from '../../services/api';
import { formatoPrecio } from '../../services/reservas';
import { useCarga } from '../../services/useCarga';
import Chip from '../../components/Chip';
import { Cargando, ErrorReintentar, Vacio } from '../../components/Estados';

export default function Carta() {
  const [categoria, setCategoria] = useState('pizzas');
  const { datos: platos, cargando, refrescando, error, recargar } = useCarga(obtenerPlatos);

  const visibles = useMemo(() => (platos ?? []).filter((p) => p.categoria === categoria), [platos, categoria]);
  const icono = CATEGORIAS.find((c) => c.clave === categoria)?.icono ?? 'pizza-outline';

  if (cargando) return <Cargando texto="Cargando la carta…" />;
  if (error && !platos) return <ErrorReintentar mensaje={error} onReintentar={recargar} />;

  return (
    <View style={{ flex: 1 }}>
      <View style={estilos.barra}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.chips}>
          {CATEGORIAS.map((c) => (
            <Chip key={c.clave} titulo={c.titulo} activo={categoria === c.clave} onPress={() => setCategoria(c.clave)} />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={visibles}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 28, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={recargar} />}
        ListEmptyComponent={<Vacio icono={icono} titulo="Sin platos en esta categoría" texto="Pronto habrá novedades." />}
        renderItem={({ item }) => (
          <View style={estilos.plato}>
            <View style={estilos.icono}>
              <Ionicons name={icono} size={30} color={colores.primario} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.nombre}>{item.nombre}</Text>
              {item.descripcion ? <Text style={estilos.descripcion}>{item.descripcion}</Text> : null}
              <Text style={estilos.precio}>{formatoPrecio(item.precio)}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: { paddingVertical: 10, backgroundColor: colores.fondo },
  chips: { paddingHorizontal: 16, gap: 8 },
  plato: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: colores.tarjeta,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colores.borde,
  },
  icono: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#FCEBD7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombre: { fontSize: 17, fontWeight: '800', color: colores.texto },
  descripcion: { fontSize: 14, color: colores.textoSuave, marginTop: 2, lineHeight: 19 },
  precio: { alignSelf: 'flex-end', marginTop: 6, fontSize: 16, fontWeight: '800', color: colores.primario },
});
