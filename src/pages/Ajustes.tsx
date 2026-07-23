import clsx from 'clsx'
import { Download, ShieldCheck, ShieldOff, Trash2, Upload } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, ConfirmDialog, Field, Input, Segmented, Select } from '../components/ui'
import { backupLabel, backupStatus, downloadBackup } from '../lib/backup'
import { emptyData, sampleData } from '../lib/seed'
import {
  formatBytes,
  isPersisted,
  persistenceSupported,
  requestPersistence,
  storageUsage,
  type StorageUsage,
} from '../lib/storage'
import { useApp } from '../store'
import type { AppData } from '../types'

/**
 * Estado de la protección del almacenamiento, con opción a solicitarla si el
 * navegador aún no la ha concedido.
 */
function StorageProtection() {
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [usage, setUsage] = useState<StorageUsage | null>(null)
  const [asking, setAsking] = useState(false)

  const refresh = useCallback(async () => {
    setPersisted(await isPersisted())
    setUsage(await storageUsage())
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (!persistenceSupported()) {
    return (
      <p className="text-muted text-[13px] leading-relaxed">
        Este navegador no permite proteger el almacenamiento. Descarga copias con regularidad.
      </p>
    )
  }

  const ok = persisted === true

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2.5">
        {ok ? (
          <ShieldCheck size={17} className="mt-px shrink-0" style={{ color: 'var(--due-ok)' }} />
        ) : (
          <ShieldOff size={17} className="text-faint mt-px shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-[13px] font-medium">
            {persisted === null
              ? 'Comprobando…'
              : ok
                ? 'Datos protegidos'
                : 'Sin protección todavía'}
          </p>
          <p className="text-muted mt-0.5 text-[12px] leading-relaxed">
            {ok
              ? 'El navegador se ha comprometido a no borrar tu cuaderno para liberar espacio.'
              : 'El navegador podría borrar el cuaderno si le falta espacio o si pasas mucho tiempo sin abrir la app. En iPhone se concede al añadirla a la pantalla de inicio.'}
          </p>
          {usage && usage.usage > 0 && (
            <p className="text-faint mt-1 text-[11px] tabular-nums">
              Ocupa {formatBytes(usage.usage)}
              {usage.quota > 0 && ` de ${formatBytes(usage.quota)} disponibles`}
            </p>
          )}
        </div>
      </div>

      {!ok && persisted !== null && (
        <Button
          size="sm"
          className="self-start"
          disabled={asking}
          onClick={async () => {
            setAsking(true)
            await requestPersistence()
            await refresh()
            setAsking(false)
          }}
        >
          {asking ? 'Solicitando…' : 'Proteger mis datos'}
        </Button>
      )}
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="hairline grid gap-4 border-t py-6 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-8">
      <div>
        <h2 className="text-[13px] font-semibold">{title}</h2>
        {description && (
          <p className="text-muted mt-1 text-[12px] leading-relaxed">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </section>
  )
}

export default function Ajustes() {
  const { data, settings, updateSettings, replaceAll, tasks, subjects, notes, blocks } = useApp()
  const fileInput = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmSample, setConfirmSample] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function exportJson() {
    const result = await downloadBackup(data)
    if (result === 'cancelado') return
    updateSettings({ lastBackupAt: new Date().toISOString(), backupSnoozedUntil: null })
    setMessage(
      result === 'compartido'
        ? 'Copia creada. Elige «Guardar en Archivos» para conservarla en el teléfono.'
        : 'Copia de seguridad descargada.',
    )
  }

  function importJson(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppData
        if (!parsed || !Array.isArray(parsed.tasks)) throw new Error('formato')
        replaceAll({
          version: 1,
          subjects: parsed.subjects ?? [],
          blocks: parsed.blocks ?? [],
          tasks: parsed.tasks.map((t) => ({ ...t, subtasks: t.subtasks ?? [] })),
          notes: parsed.notes ?? [],
          settings: { ...settings, ...(parsed.settings ?? {}), onboarded: true },
        })
        setMessage('Datos restaurados correctamente.')
      } catch {
        setMessage('Ese archivo no parece una copia válida de Cuaderno.')
      }
    }
    reader.readAsText(file)
  }

  const prepOptions = [0, 1, 2, 3, 5, 7]
  const status = backupStatus(data)

  return (
    <div className="mx-auto flex max-w-3xl flex-col">
      <header className="pb-2">
        <h1 className="text-lg font-semibold tracking-tight">Ajustes</h1>
      </header>

      {message && (
        <div
          className="panel mt-3 px-3 py-2 text-[13px]"
          style={{ background: 'var(--surface-2)' }}
        >
          {message}
        </div>
      )}

      <Section title="Perfil" description="Solo se usa para el saludo y la escala de notas.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre">
            <Input
              value={settings.studentName}
              onChange={(e) => updateSettings({ studentName: e.target.value })}
              placeholder="Tu nombre"
            />
          </Field>

          <Field label="Escala de calificación">
            <Select
              value={settings.gradeScale}
              onChange={(e) => updateSettings({ gradeScale: Number(e.target.value) })}
            >
              <option value={5}>Sobre 5</option>
              <option value={10}>Sobre 10</option>
              <option value={20}>Sobre 20</option>
              <option value={100}>Sobre 100</option>
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="Apariencia">
        <div className="flex flex-col gap-4">
          <Segmented
            value={settings.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              { value: 'system', label: 'Automático' },
              { value: 'light', label: 'Claro' },
              { value: 'dark', label: 'Oscuro' },
            ]}
            className="self-start"
          />

          <label className="flex cursor-pointer items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={settings.showWeekend}
              onChange={(e) => updateSettings({ showWeekend: e.target.checked })}
              className="h-3.5 w-3.5"
              style={{ accentColor: 'var(--accent)' }}
            />
            Mostrar sábado y domingo en el horario
          </label>
        </div>
      </Section>

      <Section
        title="Preparación anticipada"
        description="Valor por defecto al crear una actividad nueva. Puedes cambiarlo en cada una."
      >
        <div className="flex flex-wrap gap-1.5">
          {prepOptions.map((n) => (
            <button
              key={n}
              onClick={() => updateSettings({ defaultPrepDays: n })}
              className={clsx(
                'h-7 rounded-md border px-2.5 text-[12px] transition-colors',
                settings.defaultPrepDays === n
                  ? 'font-medium'
                  : 'text-muted hover:bg-[color:var(--surface-2)]',
              )}
              style={
                settings.defaultPrepDays === n
                  ? {
                      background: 'var(--accent-soft)',
                      borderColor: 'var(--accent)',
                      color: 'var(--accent)',
                    }
                  : { borderColor: 'var(--border-strong)', background: 'var(--surface)' }
              }
            >
              {n === 0 ? 'El mismo día' : n === 1 ? '1 día antes' : `${n} días antes`}
            </button>
          ))}
        </div>
      </Section>

      <Section
        title="Datos"
        description="Todo se guarda en este navegador. Guarda una copia para conservarla o pasarla a otro dispositivo: en el móvil se abre la hoja de compartir (Archivos, correo, WhatsApp) y en el ordenador se descarga el archivo."
      >
        <div className="flex flex-col gap-4">
          <div
            className="panel grid grid-cols-2 gap-px overflow-hidden sm:grid-cols-4"
            style={{ background: 'var(--border)' }}
          >
            {[
              { label: 'Actividades', value: tasks.length },
              { label: 'Materias', value: subjects.length },
              { label: 'Clases', value: blocks.length },
              { label: 'Notas', value: notes.length },
            ].map((s) => (
              <div key={s.label} className="px-3 py-2.5" style={{ background: 'var(--surface)' }}>
                <div className="text-base font-semibold tabular-nums">{s.value}</div>
                <div className="text-faint text-[11px]">{s.label}</div>
              </div>
            ))}
          </div>

          <p
            className="text-[12px]"
            style={{
              color: status.due ? 'var(--due-today)' : 'var(--text-muted)',
            }}
          >
            {backupLabel(status)}
            {status.due && ' — conviene descargar una nueva.'}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={status.due ? 'primary' : 'default'}
              icon={<Download size={14} />}
              onClick={exportJson}
            >
              Guardar copia
            </Button>
            <Button icon={<Upload size={14} />} onClick={() => fileInput.current?.click()}>
              Restaurar copia
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) importJson(file)
                e.target.value = ''
              }}
            />
            <Button onClick={() => setConfirmSample(true)}>Cargar datos de ejemplo</Button>
            <Button
              variant="danger"
              icon={<Trash2 size={14} />}
              onClick={() => setConfirmReset(true)}
            >
              Borrar todo
            </Button>
          </div>
        </div>
      </Section>

      <Section
        title="Protección del almacenamiento"
        description="Evita que el navegador borre tu cuaderno por falta de espacio o por inactividad."
      >
        <StorageProtection />
      </Section>

      <Section title="Acerca de">
        <p className="text-muted text-[13px] leading-relaxed">
          Cuaderno funciona sin conexión y guarda todo en tu propio dispositivo. Puedes instalarla en
          el móvil desde el menú del navegador, con «Añadir a pantalla de inicio».
        </p>
      </Section>

      <ConfirmDialog
        open={confirmReset}
        title="Borrar todo"
        message="Se eliminarán todas tus materias, actividades, horario y notas de este dispositivo. Descarga una copia antes si quieres conservarlos."
        confirmLabel="Borrar todo"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          replaceAll({ ...emptyData(), settings: { ...settings, onboarded: true } })
          setConfirmReset(false)
          setMessage('Tu cuaderno quedó vacío.')
        }}
      />

      <ConfirmDialog
        open={confirmSample}
        title="Cargar datos de ejemplo"
        message="Se reemplazará lo que tengas ahora por un cuaderno de muestra con materias, horario y actividades."
        confirmLabel="Cargar ejemplo"
        onCancel={() => setConfirmSample(false)}
        onConfirm={() => {
          const sample = sampleData()
          replaceAll({
            ...sample,
            settings: {
              ...sample.settings,
              studentName: settings.studentName,
              theme: settings.theme,
            },
          })
          setConfirmSample(false)
          setMessage('Datos de ejemplo cargados.')
        }}
      />
    </div>
  )
}
