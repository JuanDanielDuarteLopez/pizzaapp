// Utilidades para fechas y horas. Todo se maneja en hora local del celular.

const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const DIAS_SEMANA = [
  { clave: 'lunes', etiqueta: 'Lunes' },
  { clave: 'martes', etiqueta: 'Martes' },
  { clave: 'miercoles', etiqueta: 'Miércoles' },
  { clave: 'jueves', etiqueta: 'Jueves' },
  { clave: 'viernes', etiqueta: 'Viernes' },
  { clave: 'sabado', etiqueta: 'Sábado' },
  { clave: 'domingo', etiqueta: 'Domingo' },
];

const dos = (n) => String(n).padStart(2, '0');

/** Date -> '2026-10-17' (en hora local, no UTC). */
export function aFechaISO(fecha) {
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

/** '2026-10-17' -> Date local (mediodía, para evitar saltos por zona horaria). */
export function deFechaISO(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d, 12, 0, 0);
}

/** Nombre del día sin tildes, igual que en la base de datos ('miercoles'). */
export function claveDia(fecha) {
  return DIAS[fecha.getDay()];
}

export function diaCorto(fecha) {
  return DIAS_CORTOS[fecha.getDay()];
}

/** '2026-10-17' -> 'Sáb 17 oct 2026' */
export function fechaLarga(iso) {
  const f = deFechaISO(iso);
  return `${DIAS_CORTOS[f.getDay()]} ${f.getDate()} ${MESES_CORTOS[f.getMonth()]} ${f.getFullYear()}`;
}

/** '2026-10-17' -> 'Sáb 17 oct' */
export function fechaCorta(iso) {
  const f = deFechaISO(iso);
  return `${DIAS_CORTOS[f.getDay()]} ${f.getDate()} ${MESES_CORTOS[f.getMonth()]}`;
}

/** Los próximos N días empezando hoy. */
export function proximosDias(cantidad) {
  const dias = [];
  const hoy = new Date();
  for (let i = 0; i < cantidad; i++) {
    dias.push(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i, 12, 0, 0));
  }
  return dias;
}

/** '17:30:00' o '17:30' -> '17:30' */
export function recortarHora(hora) {
  return String(hora).slice(0, 5);
}

/** '17:30' -> 1050 (minutos desde la medianoche) */
export function aMinutos(hora) {
  const [h, m] = recortarHora(hora).split(':').map(Number);
  return h * 60 + m;
}

/** 1050 -> '17:30' */
export function deMinutos(minutos) {
  return `${dos(Math.floor(minutos / 60))}:${dos(minutos % 60)}`;
}

/** '17:30' -> '5:30 p. m.' (para mostrar en textos largos) */
export function horaAmPm(hora) {
  const min = aMinutos(hora);
  const h = Math.floor(min / 60);
  const m = min % 60;
  const sufijo = h >= 12 ? 'p. m.' : 'a. m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${dos(m)} ${sufijo}`;
}
