import { CalendarClock, GraduationCap, Layers } from 'lucide-react'
import { useState } from 'react'
import { Button, Input } from '../components/ui'
import { sampleData } from '../lib/seed'
import { useApp } from '../store'

const FEATURES = [
  {
    icon: <GraduationCap size={16} />,
    title: 'Cada actividad con su materia y su profesor',
    text: 'Qué te mandaron, de qué materia es y quién la da.',
  },
  {
    icon: <CalendarClock size={16} />,
    title: 'Aviso antes de la entrega',
    text: 'Eliges con cuántos días empezar y aparece en Hoy a tiempo.',
  },
  {
    icon: <Layers size={16} />,
    title: 'Horario, notas e ideas',
    text: 'Tu semana de clases y un sitio para todo lo demás.',
  },
]

export default function Bienvenida() {
  const { updateSettings, replaceAll } = useApp()
  const [name, setName] = useState('')

  function start(withSample: boolean) {
    if (withSample) {
      const sample = sampleData()
      replaceAll({
        ...sample,
        settings: { ...sample.settings, studentName: name.trim(), onboarded: true },
      })
    } else {
      updateSettings({ studentName: name.trim(), onboarded: true })
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-5 py-14">
      <div className="animate-pop w-full max-w-[420px]">
        <div className="mb-9 flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[14px] font-bold"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
              boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.22), 0 6px 20px -6px var(--accent-ring)',
            }}
          >
            C
          </span>
          <span className="text-[15px] font-semibold">Cuaderno</span>
        </div>

        <h1 className="text-[30px] leading-[1.1] font-semibold text-balance">
          Tu agenda de clases,
          <br />
          <span style={{ color: 'var(--accent)' }}>ordenada.</span>
        </h1>
        <p className="text-muted mt-3 text-[13px] leading-relaxed">
          Deberes, exámenes, exposiciones y horario en un solo sitio. Sin cuentas y guardado en tu
          propio dispositivo.
        </p>

        <ul className="mt-8 flex flex-col gap-3">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex items-start gap-3">
              <span
                className="mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  border: '1px solid var(--border)',
                }}
              >
                {f.icon}
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-medium">{f.title}</div>
                <p className="text-faint mt-0.5 text-[12px] leading-relaxed">{f.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="panel mt-8 p-4">
          <label className="mb-1.5 block text-[12px] font-medium">Tu nombre</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && start(false)}
            placeholder="Opcional"
          />

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button variant="primary" className="flex-1" onClick={() => start(false)}>
              Empezar
            </Button>
            <Button className="flex-1" onClick={() => start(true)}>
              Ver un ejemplo
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
