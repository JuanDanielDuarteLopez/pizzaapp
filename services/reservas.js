// Lógica de negocio de las reservas: generar horas disponibles y detectar choques.
import { aMinutos, deMinutos, recortarHora } from './fechas';

// Las horas se ofrecen cada 30 minutos (12:30, 13:00, 13:30...).
export const PASO_MINUTOS = 30;

export const NOMBRES_JORNADA = { almuerzo: 'Almuerzo', noche: 'Noche' };

/**
 * Convierte los horarios de un día en la lista de horas reservables.
 * Ejemplo: jornada 12:30-14:30 con reservas de 60 min -> 12:30, 13:00, 13:30
 * (la última debe terminar antes o justo al cierre de la jornada).
 */
export function generarSlots(horariosDelDia) {
  const slots = [];
  const activos = horariosDelDia
    .filter((h) => h.activo)
    .sort((a, b) => aMinutos(a.hora_inicio) - aMinutos(b.hora_inicio));

  for (const h of activos) {
    const inicio = aMinutos(h.hora_inicio);
    const fin = aMinutos(h.hora_fin);
    for (let t = inicio; t + h.duracion_slot <= fin; t += PASO_MINUTOS) {
      slots.push({
        jornada: h.jornada,
        inicio: deMinutos(t),
        fin: deMinutos(t + h.duracion_slot),
      });
    }
  }
  return slots;
}

/** ¿Este slot se cruza con alguna reserva existente? */
export function estaOcupado(slot, ocupados) {
  const ini = aMinutos(slot.inicio);
  const fin = aMinutos(slot.fin);
  return ocupados.some((o) => aMinutos(o.hora_inicio) < fin && aMinutos(o.hora_fin) > ini);
}

/** Si la fecha es hoy, las horas que ya pasaron no se pueden reservar. */
export function yaPaso(slot, fechaISO, ahora = new Date()) {
  const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(
    ahora.getDate()
  ).padStart(2, '0')}`;
  if (fechaISO !== hoy) return false;
  return aMinutos(slot.inicio) <= ahora.getHours() * 60 + ahora.getMinutes();
}

export function agruparPorJornada(slots) {
  return {
    almuerzo: slots.filter((s) => s.jornada === 'almuerzo'),
    noche: slots.filter((s) => s.jornada === 'noche'),
  };
}

export function etiquetaZona(zona) {
  return zona === 'terraza' ? 'Terraza' : 'Salón';
}

export function formatoPrecio(valor) {
  const n = Math.round(Number(valor) || 0);
  return '$ ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export { recortarHora };
