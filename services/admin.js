// Funciones del módulo ADMINISTRADOR. Todas envían el PIN, y la base de datos
// lo verifica antes de permitir cualquier cambio.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { ejecutar } from './api';

const CLAVE_PIN = 'konys_admin_pin';

// --- Sesión del administrador (recordar el PIN en el celular) ---
export async function leerPinGuardado() {
  try {
    return await AsyncStorage.getItem(CLAVE_PIN);
  } catch {
    return null;
  }
}
export async function guardarPin(pin) {
  try {
    await AsyncStorage.setItem(CLAVE_PIN, pin);
  } catch {}
}
export async function borrarPin() {
  try {
    await AsyncStorage.removeItem(CLAVE_PIN);
  } catch {}
}

export async function verificarPin(pin) {
  return (await ejecutar(supabase.rpc('admin_verificar', { p_pin: pin }))) === true;
}

export async function cambiarPin(pin, nuevo) {
  await ejecutar(supabase.rpc('admin_cambiar_pin', { p_pin: pin, p_nuevo: nuevo }));
}

// --- Mesas ---
export async function guardarMesa(pin, mesa) {
  return ejecutar(
    supabase.rpc('admin_guardar_mesa', {
      p_pin: pin,
      p_id: mesa.id ?? null,
      p_nombre: mesa.nombre,
      p_zona: mesa.zona,
      p_capacidad: mesa.capacidad,
      p_activa: mesa.activa,
      p_foto_url: mesa.foto_url || null,
    })
  );
}
export async function activarMesa(pin, id, activa) {
  await ejecutar(supabase.rpc('admin_activar_mesa', { p_pin: pin, p_id: id, p_activa: activa }));
}
export async function borrarMesa(pin, id) {
  await ejecutar(supabase.rpc('admin_borrar_mesa', { p_pin: pin, p_id: id }));
}

// --- Horarios ---
export async function guardarHorario(pin, h) {
  await ejecutar(
    supabase.rpc('admin_guardar_horario', {
      p_pin: pin,
      p_dia: h.dia_semana,
      p_jornada: h.jornada,
      p_hora_inicio: h.hora_inicio,
      p_hora_fin: h.hora_fin,
      p_duracion: h.duracion_slot,
      p_activo: h.activo,
    })
  );
}

// --- Reservas ---
export async function listarReservas(pin) {
  return ejecutar(supabase.rpc('admin_listar_reservas', { p_pin: pin }));
}
export async function cambiarEstadoReserva(pin, id, estado) {
  await ejecutar(supabase.rpc('admin_estado_reserva', { p_pin: pin, p_id: id, p_estado: estado }));
}

// --- Carta ---
export async function listarPlatos(pin) {
  return ejecutar(supabase.rpc('admin_listar_platos', { p_pin: pin }));
}
export async function guardarPlato(pin, plato) {
  return ejecutar(
    supabase.rpc('admin_guardar_plato', {
      p_pin: pin,
      p_id: plato.id ?? null,
      p_nombre: plato.nombre,
      p_categoria: plato.categoria,
      p_descripcion: plato.descripcion || null,
      p_precio: plato.precio,
      p_disponible: plato.disponible,
    })
  );
}
export async function borrarPlato(pin, id) {
  await ejecutar(supabase.rpc('admin_borrar_plato', { p_pin: pin, p_id: id }));
}
