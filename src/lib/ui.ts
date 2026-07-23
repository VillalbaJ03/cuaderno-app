import type { Priority, SubjectColor, TaskStatus, TaskType } from '../types'

export const SUBJECT_COLORS: { value: SubjectColor; label: string }[] = [
  { value: 'indigo', label: 'Índigo' },
  { value: 'violet', label: 'Violeta' },
  { value: 'sky', label: 'Azul' },
  { value: 'emerald', label: 'Verde' },
  { value: 'teal', label: 'Turquesa' },
  { value: 'amber', label: 'Ocre' },
  { value: 'orange', label: 'Terracota' },
  { value: 'rose', label: 'Granate' },
  { value: 'fuchsia', label: 'Ciruela' },
  { value: 'slate', label: 'Grafito' },
]

/** Color CSS de la materia, adaptado automáticamente al tema activo. */
export function colorVar(color: SubjectColor | undefined): string {
  return `var(--subject-${color ?? 'slate'})`
}

/** Fondo tenue derivado del color de la materia. */
export function colorSoft(color: SubjectColor | undefined, amount = 10): string {
  return `color-mix(in oklab, ${colorVar(color)} ${amount}%, transparent)`
}

export const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'deber', label: 'Deber' },
  { value: 'examen', label: 'Examen' },
  { value: 'exposicion', label: 'Exposición' },
  { value: 'proyecto', label: 'Proyecto' },
  { value: 'lectura', label: 'Lectura' },
  { value: 'entrega', label: 'Entrega' },
]

export function taskTypeLabel(type: TaskType): string {
  return TASK_TYPES.find((t) => t.value === type)?.label ?? type
}

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
]

export const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En curso' },
  { value: 'hecha', label: 'Terminada' },
]

export function statusLabel(status: TaskStatus): string {
  return STATUSES.find((s) => s.value === status)?.label ?? status
}

/** Nivel de urgencia según los días que faltan. */
export type Urgency = 'vencida' | 'hoy' | 'manana' | 'semana' | 'lejos'

export function urgencyOf(daysLeft: number): Urgency {
  if (daysLeft < 0) return 'vencida'
  if (daysLeft === 0) return 'hoy'
  if (daysLeft === 1) return 'manana'
  if (daysLeft <= 7) return 'semana'
  return 'lejos'
}

export const URGENCY_STYLE: Record<Urgency, { color: string; label: string }> = {
  vencida: { color: 'var(--due-late)', label: 'Vencida' },
  hoy: { color: 'var(--due-today)', label: 'Vence hoy' },
  manana: { color: 'var(--due-soon)', label: 'Vence mañana' },
  semana: { color: 'var(--text-muted)', label: 'Esta semana' },
  lejos: { color: 'var(--text-faint)', label: 'Más adelante' },
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}
