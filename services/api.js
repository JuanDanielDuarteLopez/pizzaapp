// Funciones que hablan con Supabase para el módulo CLIENTE.
// Cada pantalla llama a estas funciones y no necesita saber cómo funciona Supabase.
import { supabase, supabaseConfigurado } from './supabase';

// Errores que lanza la base de datos (ver supabase/schema.sql) y su mensaje amigable.
const MENSAJES = {
  slot_ocupado: 'Ese horario acaba de ser reservado por otra persona. Elige otro, por favor.',
  capacidad_excedida: 'El número de personas supera la capacidad de la mesa.',
  mesa_no_disponible: 'Esta mesa no está disponible por ahora.',
  nombre_requerido: 'Escribe tu nombre para poder reservar.',
  fuera_de_horario: 'Ese horario está fuera del horario de atención.',
  fecha_pasada: 'Esa fecha ya pasó. Elige otra.',
  horas_invalidas: 'La hora de la reserva no es válida.',
  pin_incorrecto: 'PIN incorrecto.',
  pin_invalido: 'El PIN debe tener exactamente 4 números.',
  mesa_con_reservas:
    'Esta mesa tiene reservas próximas. Márcala como inactiva en lugar de borrarla.',
};

export class ErrorApp extends Error {
  constructor(mensaje, codigo = null) {
    super(mensaje);
    this.codigo = codigo;
  }
}

function traducir(error) {
  const texto = String(error?.message ?? error ?? '');
  for (const codigo of Object.keys(MENSAJES)) {
    if (texto.includes(codigo)) return new ErrorApp(MENSAJES[codigo], codigo);
  }
  if (/network|fetch|internet|timeout|conexi/i.test(texto)) {
    return new ErrorApp(
      'No hay conexión a internet o el servidor no responde. Revisa tu conexión e inténtalo de nuevo.',
      'sin_conexion'
    );
  }
  return new ErrorApp('Ocurrió un problema inesperado. Inténtalo de nuevo.', 'desconocido');
}

/** Ejecuta una consulta de Supabase y devuelve los datos, o lanza un ErrorApp claro. */
export async function ejecutar(consulta) {
  if (!supabaseConfigurado) {
    throw new ErrorApp(
      'La app aún no está conectada a Supabase. Falta configurar el archivo .env.',
      'sin_configurar'
    );
  }
  let respuesta;
  try {
    respuesta = await consulta;
  } catch (e) {
    throw traducir(e);
  }
  if (respuesta.error) throw traducir(respuesta.error);
  return respuesta.data;
}

const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, 'es', { numeric: true });

export async function obtenerMesas() {
  const datos = await ejecutar(supabase.from('mesas').select('*'));
  return datos.sort(porNombre);
}

export async function obtenerMesasActivas() {
  return (await obtenerMesas()).filter((m) => m.activa);
}

export async function obtenerHorarios() {
  return ejecutar(supabase.from('horarios').select('*'));
}

export async function obtenerPlatos() {
  const datos = await ejecutar(supabase.from('platos').select('*'));
  return datos.sort(porNombre);
}

export async function obtenerSlotsOcupados(mesaId, fechaISO) {
  return ejecutar(supabase.rpc('slots_ocupados', { p_mesa: mesaId, p_fecha: fechaISO }));
}

export async function crearReserva({ mesaId, nombre, contacto, personas, fecha, horaInicio, horaFin }) {
  return ejecutar(
    supabase.rpc('crear_reserva', {
      p_mesa: mesaId,
      p_nombre: nombre,
      p_contacto: contacto || null,
      p_personas: personas,
      p_fecha: fecha,
      p_hora_inicio: horaInicio,
      p_hora_fin: horaFin,
    })
  );
}
