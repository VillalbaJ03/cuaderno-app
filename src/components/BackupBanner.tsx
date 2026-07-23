import { Download, ShieldAlert, X } from 'lucide-react'
import { useApp } from '../store'
import { backupStatus, downloadBackup } from '../lib/backup'
import { shiftKey, todayKey } from '../lib/dates'
import { Button } from './ui'

/** Días que se silencia el aviso al pulsar «Más tarde». */
const SNOOZE_DAYS = 7

/**
 * Aviso discreto cuando hace mucho que no se descarga una copia. Los datos
 * viven solo en este dispositivo, así que el respaldo es la única red.
 */
export default function BackupBanner() {
  const { data, updateSettings } = useApp()
  const status = backupStatus(data)

  if (!status.due) return null

  const message =
    status.daysSinceBackup === null
      ? `Llevas ${status.daysUsing} días anotando y aún no has guardado una copia.`
      : `Tu última copia es de hace ${status.daysSinceBackup} días.`

  return (
    <div
      className="panel animate-fade flex flex-wrap items-center gap-3 px-4 py-3"
      style={{ borderColor: 'color-mix(in oklab, var(--due-today) 40%, var(--border))' }}
    >
      <ShieldAlert size={17} className="shrink-0" style={{ color: 'var(--due-today)' }} />

      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium">{message}</p>
        <p className="text-faint mt-0.5 text-[12px] leading-relaxed">
          Todo se guarda solo en este dispositivo. Descarga el archivo y guárdalo donde no se
          pierda.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          icon={<Download size={13} />}
          onClick={() => {
            downloadBackup(data)
            updateSettings({ lastBackupAt: new Date().toISOString(), backupSnoozedUntil: null })
          }}
        >
          Descargar copia
        </Button>
        <button
          onClick={() => updateSettings({ backupSnoozedUntil: shiftKey(todayKey(), SNOOZE_DAYS) })}
          aria-label="Recordármelo más tarde"
          title="Más tarde"
          className="text-faint rounded-md p-1.5 transition-colors hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)]"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
