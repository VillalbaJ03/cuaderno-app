import type { AppData } from '../types'
import { todayKey } from './dates'

/** Días transcurridos desde una fecha ISO hasta ahora. */
function daysAgo(iso: string): number {
  const diff = Date.now() - new Date(iso).getTime()
  return Math.floor(diff / 86_400_000)
}

export type BackupResult = 'compartido' | 'descargado' | 'cancelado'

/**
 * Guarda todo el cuaderno como archivo JSON.
 *
 * En el móvil abre la hoja de compartir del sistema («Guardar en Archivos»,
 * enviarlo por correo…), que es la única vía cómoda en iOS. En escritorio, o
 * si el navegador no la admite, cae en una descarga normal.
 *
 * Debe llamarse desde un gesto del usuario: compartir lo exige.
 */
export async function downloadBackup(data: AppData): Promise<BackupResult> {
  const name = `cuaderno-${todayKey()}.json`
  const file = new File([JSON.stringify(data, null, 2)], name, { type: 'application/json' })

  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Copia de Cuaderno' })
      return 'compartido'
    } catch (error) {
      // Si cancela la hoja, no insistimos con una descarga que no pidió.
      if ((error as Error)?.name === 'AbortError') return 'cancelado'
      // Cualquier otro fallo: seguimos con la descarga clásica.
    }
  }

  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.rel = 'noopener'
  // Safari exige que el enlace esté en el documento para respetar `download`.
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revocar de inmediato aborta la descarga en Safari; le damos margen.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
  return 'descargado'
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
