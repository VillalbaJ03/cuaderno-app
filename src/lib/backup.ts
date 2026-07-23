import type { AppData } from '../types'
import { todayKey } from './dates'

/** Días transcurridos desde una fecha ISO hasta ahora. */
function daysAgo(iso: string): number {
  const diff = Date.now() - new Date(iso).getTime()
  return Math.floor(diff / 86_400_000)
}

/** Descarga todo el cuaderno como archivo JSON. */
export function downloadBackup(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cuaderno-${todayKey()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Se recuerda la copia cuando ha pasado este tiempo desde la última. */
const REMIND_AFTER_DAYS = 14
/** Por debajo de esto no merece la pena molestar. */
const MIN_ITEMS = 3

export interface BackupStatus {
  /** Elementos guardados (actividades + materias + notas). */
  items: number
  /** Días desde la última copia; null si nunca se descargó ninguna. */
  daysSinceBackup: number | null
  /** Días desde que empezó a usar la app. */
  daysUsing: number
  /** Conviene avisar ahora. */
  due: boolean
}

export function backupStatus(data: AppData): BackupStatus {
  const { tasks, subjects, notes, settings } = data
  const items = tasks.length + subjects.length + notes.length

  const daysSinceBackup = settings.lastBackupAt ? daysAgo(settings.lastBackupAt) : null

  // Sin copias previas medimos desde lo más antiguo que haya anotado.
  const createdDates = [...tasks, ...subjects, ...notes]
    .map((e) => e.createdAt)
    .filter(Boolean)
    .sort()
  const daysUsing = createdDates.length ? daysAgo(createdDates[0]) : 0

  const snoozed = settings.backupSnoozedUntil !== null && settings.backupSnoozedUntil > todayKey()
  const elapsed = daysSinceBackup ?? daysUsing

  return {
    items,
    daysSinceBackup,
    daysUsing,
    due: !snoozed && items >= MIN_ITEMS && elapsed >= REMIND_AFTER_DAYS,
  }
}

/** Texto humano del estado de la copia, para Ajustes. */
export function backupLabel(status: BackupStatus): string {
  if (status.daysSinceBackup === null) return 'Nunca has descargado una copia'
  if (status.daysSinceBackup === 0) return 'Última copia: hoy'
  if (status.daysSinceBackup === 1) return 'Última copia: ayer'
  return `Última copia: hace ${status.daysSinceBackup} días`
}
