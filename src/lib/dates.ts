import {
  addDays,
  differenceInCalendarDays,
  format,
  isValid,
  parse,
  parseISO,
  startOfDay,
} from 'date-fns'
import { es } from 'date-fns/locale'

export const DATE_FMT = 'yyyy-MM-dd'

/** Fecha de hoy en formato 'yyyy-MM-dd' (hora local, no UTC). */
export function todayKey(): string {
  return format(new Date(), DATE_FMT)
}

/** Convierte 'yyyy-MM-dd' a Date local sin desfase de zona horaria. */
export function fromKey(key: string): Date {
  const d = parse(key, DATE_FMT, new Date())
  return isValid(d) ? d : startOfDay(parseISO(key))
}

export function toKey(date: Date): string {
  return format(date, DATE_FMT)
}

export function shiftKey(key: string, days: number): string {
  return toKey(addDays(fromKey(key), days))
}

/** Días que faltan desde hoy hasta `key`. Negativo si ya pasó. */
export function daysUntil(key: string, from: string = todayKey()): number {
  return differenceInCalendarDays(fromKey(key), fromKey(from))
}

/** 1 = lunes … 7 = domingo (ISO 8601). */
export function isoWeekday(date: Date): number {
  const d = date.getDay()
  return d === 0 ? 7 : d
}

export const WEEKDAYS: { value: number; label: string; short: string }[] = [
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 7, label: 'Domingo', short: 'Dom' },
]

export function fmt(key: string, pattern: string): string {
  return format(fromKey(key), pattern, { locale: es })
}

/** 'vie 25 jul' */
export function shortDate(key: string): string {
  return fmt(key, "EEE d 'de' MMM")
}

/** 'viernes, 25 de julio' */
export function longDate(key: string): string {
  return fmt(key, "EEEE, d 'de' MMMM")
}

/** Texto humano del plazo: «Hoy», «Mañana», «En 3 días», «Hace 2 días». */
export function relativeDue(key: string): string {
  const n = daysUntil(key)
  if (n === 0) return 'Hoy'
  if (n === 1) return 'Mañana'
  if (n === -1) return 'Ayer'
  if (n === 2) return 'Pasado mañana'
  if (n > 1 && n <= 7) return `En ${n} días`
  if (n > 7) return `En ${n} días`
  return `Hace ${Math.abs(n)} días`
}

/** Minutos desde medianoche a partir de 'HH:mm'. */
export function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function formatTime(time?: string): string {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const suffix = h < 12 ? 'a. m.' : 'p. m.'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
