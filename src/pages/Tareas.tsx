import { Filter, Plus, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import TaskCard from '../components/TaskCard'
import { useTaskEditor } from '../components/TaskEditor'
import { Button, EmptyState, Input, Segmented, Select } from '../components/ui'
import { decorateAll, sortByUrgency, type TaskView } from '../lib/selectors'
import { TASK_TYPES } from '../lib/ui'
import { useApp } from '../store'
import type { TaskType } from '../types'

type Scope = 'pendientes' | 'todas' | 'hechas'

const GROUPS: { key: string; label: string; accent?: string; match: (t: TaskView) => boolean }[] = [
  {
    key: 'vencidas',
    label: 'Vencidas',
    accent: 'var(--due-late)',
    match: (t) => t.daysLeft < 0 && t.status !== 'hecha',
  },
  {
    key: 'hoy',
    label: 'Hoy',
    accent: 'var(--due-today)',
    match: (t) => t.daysLeft === 0 && t.status !== 'hecha',
  },
  { key: 'manana', label: 'Mañana', match: (t) => t.daysLeft === 1 && t.status !== 'hecha' },
  {
    key: 'semana',
    label: 'Esta semana',
    match: (t) => t.daysLeft > 1 && t.daysLeft <= 7 && t.status !== 'hecha',
  },
  {
    key: 'despues',
    label: 'Más adelante',
    match: (t) => t.daysLeft > 7 && t.status !== 'hecha',
  },
  { key: 'hechas', label: 'Terminadas', match: (t) => t.status === 'hecha' },
]

export default function Tareas() {
  const { tasks, subjects } = useApp()
  const { openTaskEditor } = useTaskEditor()

  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<Scope>('pendientes')
  const [subjectId, setSubjectId] = useState('')
  const [type, setType] = useState<TaskType | ''>('')
  const [showFilters, setShowFilters] = useState(false)

  const views = useMemo(() => decorateAll(tasks, subjects), [tasks, subjects])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return views
      .filter((t) => {
        if (scope === 'pendientes' && t.status === 'hecha') return false
        if (scope === 'hechas' && t.status !== 'hecha') return false
        if (subjectId && t.subjectId !== subjectId) return false
        if (type && t.type !== type) return false
        if (q) {
          const haystack = `${t.title} ${t.notes ?? ''} ${t.subject?.name ?? ''} ${
            t.subject?.teacher ?? ''
          }`.toLowerCase()
          if (!haystack.includes(q)) return false
        }
        return true
      })
      .sort(sortByUrgency)
  }, [views, query, scope, subjectId, type])

  const groups = useMemo(
    () =>
      GROUPS.map((g) => ({ ...g, items: filtered.filter(g.match) })).filter(
        (g) => g.items.length > 0,
      ),
    [filtered],
  )

  const activeFilters = (subjectId ? 1 : 0) + (type ? 1 : 0)

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Actividades</h1>
          <p className="text-muted mt-0.5 text-[13px]">
            {filtered.length} {filtered.length === 1 ? 'actividad' : 'actividades'} en esta vista.
          </p>
        </div>
        <div className="hidden lg:block">
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => openTaskEditor()}>
            Nueva actividad
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={14}
              className="text-faint pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título, apuntes, materia o profesor"
              className="pl-8"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Limpiar búsqueda"
                className="text-faint absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 hover:bg-[color:var(--surface-2)]"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <Button icon={<Filter size={14} />} onClick={() => setShowFilters((v) => !v)}>
            <span className="hidden sm:inline">Filtros</span>
            {activeFilters > 0 && (
              <span className="text-faint tabular-nums">({activeFilters})</span>
            )}
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            value={scope}
            onChange={setScope}
            options={[
              { value: 'pendientes', label: 'Por hacer' },
              { value: 'todas', label: 'Todas' },
              { value: 'hechas', label: 'Terminadas' },
            ]}
          />
          {activeFilters > 0 && (
            <button
              onClick={() => {
                setSubjectId('')
                setType('')
              }}
              className="text-faint text-[12px] hover:text-[color:var(--text)]"
            >
              Quitar filtros
            </button>
          )}
        </div>

        {showFilters && (
          <div className="panel animate-fade grid grid-cols-1 gap-2 p-2 sm:grid-cols-2">
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">Todas las materias</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Select value={type} onChange={(e) => setType(e.target.value as TaskType | '')}>
              <option value="">Todos los tipos</option>
              {TASK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="panel">
          <EmptyState
            title={tasks.length === 0 ? 'Tu cuaderno está vacío' : 'Sin resultados'}
            description={
              tasks.length === 0
                ? 'Anota el primer deber, examen o exposición y aparecerá ordenado por fecha.'
                : 'Prueba a cambiar los filtros o la búsqueda.'
            }
            action={
              <Button variant="primary" icon={<Plus size={15} />} onClick={() => openTaskEditor()}>
                Anotar actividad
              </Button>
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <section key={g.key}>
              <div className="mb-2 flex items-baseline gap-2">
                {g.accent && (
                  <span
                    aria-hidden
                    className="h-[6px] w-[6px] rounded-full"
                    style={{ background: g.accent }}
                  />
                )}
                <h2 className="eyebrow">{g.label}</h2>
                <span className="text-faint text-[11px] tabular-nums">{g.items.length}</span>
              </div>
              <div className="panel divide-hairline overflow-hidden">
                {g.items.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
