// Admin · Carta: agregar, editar, ocultar y eliminar platos (RF-14).
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colores } from '../../constants/colors';
import { CATEGORIAS } from '../../constants/categorias';
import { borrarPlato, guardarPlato, listarPlatos } from '../../services/admin';
import { formatoPrecio } from '../../services/reservas';
import { useCarga } from '../../services/useCarga';
import Boton from '../Boton';
import Campo from '../Campo';
import Chip from '../Chip';
import { Cargando, ErrorReintentar, Vacio } from '../Estados';
import ModalHoja from './ModalHoja';

function FormularioPlato({ pin, plato, categoriaInicial, onCerrar, onGuardado }) {
  const [nombre, setNombre] = useState(plato?.nombre ?? '');
  const [categoria, setCategoria] = useState(plato?.categoria ?? categoriaInicial);
  const [descripcion, setDescripcion] = useState(plato?.descripcion ?? '');
  const [precio, setPrecio] = useState(plato ? String(Math.round(Number(plato.precio))) : '');
  const [disponible, setDisponible] = useState(plato?.disponible ?? true);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setErrorGeneral(null);
    const e = {};
    if (!nombre.trim()) e.nombre = 'Escribe el nombre del plato.';
    if (precio === '' || Number.isNaN(Number(precio))) e.precio = 'Escribe el precio en pesos (solo números).';
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    setGuardando(true);
    try {
      await guardarPlato(pin, {
        id: plato?.id,
        nombre: nombre.trim(),
        categoria,
        descripcion: descripcion.trim(),
        precio: Number(precio),
        disponible,
      });
      onGuardado();
    } catch (err) {
      setErrorGeneral(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <Campo etiqueta="Nombre" value={nombre} onChangeText={setNombre} placeholder="Ej: Pizza Konys" error={errores.nombre} />
      <View style={{ gap: 6 }}>
        <Text style={estilos.etiqueta}>Categoría</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {CATEGORIAS.map((c) => (
            <Chip key={c.clave} titulo={c.titulo} activo={categoria === c.clave} onPress={() => setCategoria(c.clave)} />
          ))}
        </ScrollView>
      </View>
      <Campo
        etiqueta="Descripción (ingredientes)"
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Ingredientes o detalles"
        multiline
        style={{ minHeight: 90 }}
      />
      <Campo
        etiqueta="Precio (COP)"
        value={precio}
        onChangeText={(t) => setPrecio(t.replace(/[^0-9]/g, ''))}
        placeholder="Ej: 35000"
        keyboardType="number-pad"
        error={errores.precio}
      />
      <View style={estilos.filaSwitch}>
        <Text style={estilos.textoSwitch}>Visible en la carta</Text>
        <Switch value={disponible} onValueChange={setDisponible} trackColor={{ true: colores.primario }} />
      </View>
      {errorGeneral ? <Text style={estilos.error}>{errorGeneral}</Text> : null}
      <Boton titulo="Guardar plato" onPress={guardar} cargando={guardando} />
      <Boton titulo="Cancelar" variante="secundario" onPress={onCerrar} />
    </>
  );
}

export default function CartaAdmin({ pin }) {
  const { datos: platos, cargando, refrescando, error, recargar, actualizar } = useCarga(() => listarPlatos(pin));
  const [categoria, setCategoria] = useState('pizzas');
  const [editando, setEditando] = useState(null);
  const [ocupadoId, setOcupadoId] = useState(null);

  const visibles = useMemo(() => (platos ?? []).filter((p) => p.categoria === categoria), [platos, categoria]);

  const alternarDisponible = async (plato, valor) => {
    setOcupadoId(plato.id);
    try {
      await guardarPlato(pin, { ...plato, disponible: valor });
      await actualizar();
    } catch (e) {
      Alert.alert('No se pudo cambiar', e.message);
    } finally {
      setOcupadoId(null);
    }
  };

  const pedirBorrar = (plato) => {
    Alert.alert('Eliminar plato', `¿Eliminar "${plato.nombre}" de la carta? Si solo quieres ocultarlo, usa el interruptor.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await borrarPlato(pin, plato.id);
            await actualizar();
          } catch (e) {
            Alert.alert('No se pudo eliminar', e.message);
          }
        },
      },
    ]);
  };

  if (cargando) return <Cargando texto="Cargando la carta…" />;
  if (error && !platos) return <ErrorReintentar mensaje={error} onReintentar={recargar} />;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingVertical: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {CATEGORIAS.map((c) => (
            <Chip key={c.clave} titulo={c.titulo} activo={categoria === c.clave} onPress={() => setCategoria(c.clave)} />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={visibles}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 96, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={recargar} />}
        ListEmptyComponent={<Vacio icono="pizza-outline" titulo="Sin platos aquí" texto="Toca el botón + para agregar uno." />}
        renderItem={({ item }) => (
          <View style={[estilos.tarjeta, !item.disponible && { opacity: 0.7 }]}>
            <View style={estilos.fila}>
              <View style={{ flex: 1 }}>
                <Text style={estilos.nombre}>{item.nombre}</Text>
                {item.descripcion ? (
                  <Text style={estilos.descripcion} numberOfLines={2}>
                    {item.descripcion}
                  </Text>
                ) : null}
                <Text style={estilos.precio}>{formatoPrecio(item.precio)}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Switch
                  value={item.disponible}
                  disabled={ocupadoId === item.id}
                  onValueChange={(v) => alternarDisponible(item, v)}
                  trackColor={{ true: colores.primario }}
                  accessibilityLabel={`${item.nombre} visible`}
                />
                <Text style={estilos.descripcion}>{item.disponible ? 'Visible' : 'Oculto'}</Text>
              </View>
            </View>
            <View style={estilos.fila}>
              <Boton titulo="Editar" variante="secundario" pequeno onPress={() => setEditando(item)} />
              <Boton titulo="Eliminar" variante="peligro" pequeno onPress={() => pedirBorrar(item)} />
            </View>
          </View>
        )}
      />

      <Pressable accessibilityRole="button" accessibilityLabel="Agregar plato" onPress={() => setEditando({})} style={estilos.fab}>
        <Ionicons name="add" size={30} color={colores.blanco} />
      </Pressable>

      <ModalHoja visible={editando !== null} titulo={editando?.id ? 'Editar plato' : 'Nuevo plato'} onCerrar={() => setEditando(null)}>
        {editando !== null ? (
          <FormularioPlato
            key={editando.id ?? 'nuevo'}
            pin={pin}
            plato={editando.id ? editando : null}
            categoriaInicial={categoria}
            onCerrar={() => setEditando(null)}
            onGuardado={async () => {
              setEditando(null);
              await actualizar();
            }}
          />
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
    gap: 10,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nombre: { fontSize: 17, fontWeight: '800', color: colores.texto },
  descripcion: { fontSize: 13, color: colores.textoSuave, lineHeight: 18 },
  precio: { fontSize: 15, fontWeight: '800', color: colores.primario, marginTop: 4 },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  etiqueta: { fontSize: 13, fontWeight: '600', color: colores.textoSuave },
  filaSwitch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textoSwitch: { fontSize: 16, fontWeight: '700', color: colores.texto },
  error: { color: colores.error, fontWeight: '600', backgroundColor: '#FBE9E7', padding: 10, borderRadius: 8 },
});
