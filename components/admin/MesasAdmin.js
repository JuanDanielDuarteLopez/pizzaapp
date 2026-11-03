// Admin · Mesas: listado, activar/desactivar, editar, borrar y crear (RF-09, RF-10, RF-13).
import { useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colores, TAMANO_TACTIL } from '../../constants/colors';
import { obtenerMesas } from '../../services/api';
import { activarMesa, borrarMesa, guardarMesa } from '../../services/admin';
import { etiquetaZona } from '../../services/reservas';
import { useCarga } from '../../services/useCarga';
import Boton from '../Boton';
import Campo from '../Campo';
import Chip from '../Chip';
import { Cargando, ErrorReintentar, Vacio } from '../Estados';
import ModalHoja from './ModalHoja';

function FormularioMesa({ pin, mesa, onCerrar, onGuardada }) {
  const nueva = !mesa?.id;
  const [nombre, setNombre] = useState(mesa?.nombre ?? '');
  const [zona, setZona] = useState(mesa?.zona ?? 'salon');
  const [foto, setFoto] = useState(mesa?.foto_url ?? '');
  const [capacidad, setCapacidad] = useState(mesa?.capacidad ?? 4);
  const [activa, setActiva] = useState(mesa?.activa ?? true);
  const [errorNombre, setErrorNombre] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setErrorGeneral(null);
    if (!nombre.trim()) {
      setErrorNombre('Escribe el nombre o número de la mesa.');
      return;
    }
    setGuardando(true);
    try {
      await guardarMesa(pin, {
        id: mesa?.id,
        nombre: nombre.trim(),
        zona,
        capacidad,
        activa,
        foto_url: foto.trim(),
      });
      onGuardada();
    } catch (e) {
      setErrorGeneral(e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <Campo
        etiqueta="Nombre de la mesa"
        value={nombre}
        onChangeText={(t) => {
          setNombre(t);
          setErrorNombre(null);
        }}
        placeholder="Ej: Mesa 6"
        error={errorNombre}
      />

      <View style={{ gap: 6 }}>
        <Text style={estilos.etiqueta}>Zona</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip titulo="Terraza" activo={zona === 'terraza'} onPress={() => setZona('terraza')} />
          <Chip titulo="Salón" activo={zona === 'salon'} onPress={() => setZona('salon')} />
        </View>
      </View>

      <Campo
        etiqueta="Foto (opcional): enlace de la imagen"
        value={foto}
        onChangeText={setFoto}
        placeholder="https://…"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      <View style={{ gap: 6 }}>
        <Text style={estilos.etiqueta}>Capacidad (personas)</Text>
        <View style={estilos.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Disminuir capacidad"
            style={estilos.stepperBoton}
            onPress={() => setCapacidad((c) => Math.max(1, c - 1))}
          >
            <Ionicons name="remove" size={22} color={colores.primario} />
          </Pressable>
          <Text style={estilos.stepperValor}>{capacidad}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aumentar capacidad"
            style={estilos.stepperBoton}
            onPress={() => setCapacidad((c) => Math.min(30, c + 1))}
          >
            <Ionicons name="add" size={22} color={colores.primario} />
          </Pressable>
        </View>
      </View>

      <View style={estilos.filaSwitch}>
        <Text style={estilos.textoSwitch}>Mesa activa</Text>
        <Switch value={activa} onValueChange={setActiva} trackColor={{ true: colores.primario }} />
      </View>

      {errorGeneral ? <Text style={estilos.error}>{errorGeneral}</Text> : null}

      <Boton titulo={nueva ? 'Guardar mesa' : 'Guardar cambios'} onPress={guardar} cargando={guardando} />
      <Boton titulo="Cancelar" variante="secundario" onPress={onCerrar} />
    </>
  );
}

export default function MesasAdmin({ pin }) {
  const { datos: mesas, cargando, refrescando, error, recargar, actualizar } = useCarga(obtenerMesas);
  const [editando, setEditando] = useState(null); // null = cerrado, {} = nueva, mesa = editar
  const [ocupadaId, setOcupadaId] = useState(null);

  const cambiarActiva = async (mesa, valor) => {
    setOcupadaId(mesa.id);
    try {
      await activarMesa(pin, mesa.id, valor);
      await actualizar();
    } catch (e) {
      Alert.alert('No se pudo cambiar el estado', e.message);
    } finally {
      setOcupadaId(null);
    }
  };

  const pedirBorrar = (mesa) => {
    Alert.alert('Borrar mesa', `¿Seguro que quieres borrar "${mesa.nombre}"? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          try {
            await borrarMesa(pin, mesa.id);
            await actualizar();
          } catch (e) {
            Alert.alert('No se pudo borrar', e.message);
          }
        },
      },
    ]);
  };

  if (cargando) return <Cargando texto="Cargando mesas…" />;
  if (error && !mesas) return <ErrorReintentar mensaje={error} onReintentar={recargar} />;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={mesas ?? []}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 96, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={recargar} />}
        ListEmptyComponent={<Vacio icono="restaurant-outline" titulo="Aún no hay mesas" texto="Toca el botón + para crear la primera." />}
        renderItem={({ item }) => (
          <View style={[estilos.tarjeta, !item.activa && { opacity: 0.75 }]}>
            <View style={estilos.fila}>
              <View style={{ flex: 1 }}>
                <Text style={estilos.nombre}>{item.nombre}</Text>
                <Text style={estilos.detalle}>
                  {etiquetaZona(item.zona)} · {item.capacidad} pers.
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Switch
                  value={item.activa}
                  disabled={ocupadaId === item.id}
                  onValueChange={(v) => cambiarActiva(item, v)}
                  trackColor={{ true: colores.primario }}
                  accessibilityLabel={`${item.nombre} activa`}
                />
                <Text style={estilos.detalle}>{item.activa ? 'Activa' : 'Inactiva'}</Text>
              </View>
            </View>
            <View style={estilos.botones}>
              <Boton titulo="Editar" variante="secundario" pequeno onPress={() => setEditando(item)} />
              <Boton titulo="Borrar" variante="peligro" pequeno onPress={() => pedirBorrar(item)} />
            </View>
          </View>
        )}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Agregar mesa"
        onPress={() => setEditando({})}
        style={estilos.fab}
      >
        <Ionicons name="add" size={30} color={colores.blanco} />
      </Pressable>

      <ModalHoja visible={editando !== null} titulo={editando?.id ? 'Editar mesa' : 'Nueva mesa'} onCerrar={() => setEditando(null)}>
        {editando !== null ? (
          <FormularioMesa
            key={editando.id ?? 'nueva'}
            pin={pin}
            mesa={editando}
            onCerrar={() => setEditando(null)}
            onGuardada={async () => {
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
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nombre: { fontSize: 17, fontWeight: '800', color: colores.texto },
  detalle: { fontSize: 13, color: colores.textoSuave },
  botones: { flexDirection: 'row', gap: 8 },
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
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperBoton: {
    width: TAMANO_TACTIL + 6,
    height: TAMANO_TACTIL + 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.tarjeta,
  },
  stepperValor: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800', color: colores.texto },
  filaSwitch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textoSwitch: { fontSize: 16, fontWeight: '700', color: colores.texto },
  error: { color: colores.error, fontWeight: '600', backgroundColor: '#FBE9E7', padding: 10, borderRadius: 8 },
});
