import clsx from 'clsx'
import { Download, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button, ConfirmDialog, Field, Input, Segmented, Select } from '../components/ui'
import { emptyData, sampleData } from '../lib/seed'
import { useApp } from '../store'
import type { AppData } from '../types'

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

  function exportJson() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cuaderno-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('Copia de seguridad descargada.')
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
        description="Todo se guarda en este navegador. Descarga una copia para conservarla o pasarla a otro dispositivo."
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

          <div className="flex flex-wrap gap-2">
            <Button icon={<Download size={14} />} onClick={exportJson}>
              Descargar copia
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
