import clsx from 'clsx'
import {
  CalendarDays,
  CalendarRange,
  CheckSquare,
  Clock3,
  Cog,
  CornerDownLeft,
  FileText,
  Library,
  Plus,
  Search,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { relativeDue, shortDate } from '../lib/dates'
import { decorateAll, sortByUrgency } from '../lib/selectors'
import { URGENCY_STYLE, taskTypeLabel } from '../lib/ui'
import { useApp } from '../store'
import { useTaskEditor } from './TaskEditor'
import { Kbd, SubjectBadge } from './ui'

interface Command {
  id: string
  group: string
  label: string
  detail?: string
  badge?: ReactNode
  trailing?: ReactNode
  run: () => void
}

export default function CommandPalette({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { tasks, subjects, notes } = useApp()
  const { openTaskEditor } = useTaskEditor()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  // Cada apertura empieza con la búsqueda limpia.
  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const views = useMemo(() => decorateAll(tasks, subjects), [tasks, subjects])

  const commands = useMemo<Command[]>(() => {
    const go = (to: string) => () => navigate(to)

    const actions: Command[] = [
      {
        id: 'new',
        group: 'Acciones',
        label: 'Nueva actividad',
        badge: <Plus size={14} />,
        run: () => openTaskEditor(),
      },
      { id: 'go-hoy', group: 'Ir a', label: 'Hoy', badge: <CalendarDays size={14} />, run: go('/hoy') },
      {
        id: 'go-tareas',
        group: 'Ir a',
        label: 'Actividades',
        badge: <CheckSquare size={14} />,
        run: go('/tareas'),
      },
      {
        id: 'go-cal',
        group: 'Ir a',
        label: 'Calendario',
        badge: <CalendarRange size={14} />,
        run: go('/calendario'),
      },
      {
        id: 'go-hor',
        group: 'Ir a',
        label: 'Horario',
        badge: <Clock3 size={14} />,
        run: go('/horario'),
      },
      {
        id: 'go-mat',
        group: 'Ir a',
        label: 'Materias',
        badge: <Library size={14} />,
        run: go('/materias'),
      },
      { id: 'go-not', group: 'Ir a', label: 'Notas', badge: <FileText size={14} />, run: go('/notas') },
      {
        id: 'go-set',
        group: 'Ir a',
        label: 'Ajustes',
        badge: <Cog size={14} />,
        run: go('/ajustes'),
      },
    ]

    const taskCommands: Command[] = [...views]
      .sort(sortByUrgency)
      .slice(0, 40)
      .map((t) => ({
        id: `task-${t.id}`,
        group: 'Actividades',
        label: t.title,
        detail: [t.subject?.name, taskTypeLabel(t.type), shortDate(t.dueDate)]
          .filter(Boolean)
          .join(' · '),
        badge: <SubjectBadge name={t.subject?.name ?? '—'} color={t.subject?.color} size={20} />,
        trailing:
          t.status === 'hecha' ? (
            <span className="text-faint text-[11px]">Terminada</span>
          ) : (
            <span className="text-[11px]" style={{ color: URGENCY_STYLE[t.urgency].color }}>
              {relativeDue(t.dueDate)}
            </span>
          ),
        run: () => openTaskEditor(t),
      }))

    const subjectCommands: Command[] = subjects.map((s) => ({
      id: `subject-${s.id}`,
      group: 'Materias',
      label: s.name,
      detail: s.teacher || undefined,
      badge: <SubjectBadge name={s.name} color={s.color} size={20} />,
      run: go('/materias'),
    }))

    const noteCommands: Command[] = notes.map((n) => ({
      id: `note-${n.id}`,
      group: 'Notas',
      label: n.title,
      detail: n.body.slice(0, 70) || undefined,
      badge: <FileText size={14} />,
      run: go('/notas'),
    }))

    return [...actions, ...taskCommands, ...subjectCommands, ...noteCommands]
  }, [views, subjects, notes, navigate, openTaskEditor])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands.filter((c) => c.group === 'Acciones' || c.group === 'Ir a')
    return commands
      .filter((c) => `${c.label} ${c.detail ?? ''}`.toLowerCase().includes(q))
      .slice(0, 30)
  }, [commands, query])

  useEffect(() => setCursor(0), [query])

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [cursor, results])

  if (!open) return null

  function choose(index: number) {
    const cmd = results[index]
    if (!cmd) return
    onClose()
    cmd.run()
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => (c + 1) % Math.max(results.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => (c - 1 + results.length) % Math.max(results.length, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(cursor)
    }
  }

  // Índice global de cada resultado para saber cuál está resaltado.
  let running = -1

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="animate-fade absolute inset-0 backdrop-blur-[3px]"
        style={{ background: 'rgb(4 5 8 / 0.6)' }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar"
        className="animate-pop overlay-h-sm relative flex w-full max-w-xl flex-col overflow-hidden rounded-xl border"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border-strong)',
          boxShadow: 'var(--overlay-shadow), inset 0 1px 0 var(--bevel)',
        }}
      >
        <div className="hairline flex items-center gap-2.5 border-b px-3.5">
          <Search size={16} className="text-faint shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Buscar actividades, materias o notas…"
            className="placeholder:text-[color:var(--text-faint)] h-12 flex-1 bg-transparent text-[14px] outline-none"
          />
          <Kbd>esc</Kbd>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <p className="text-faint px-4 py-8 text-center text-[13px]">
              Nada coincide con «{query}».
            </p>
          ) : (
            Object.entries(
              results.reduce<Record<string, Command[]>>((acc, c) => {
                ;(acc[c.group] ??= []).push(c)
                return acc
              }, {}),
            ).map(([group, items]) => (
              <div key={group} className="mb-1">
                <div className="eyebrow px-3.5 py-1.5">{group}</div>
                {items.map((cmd) => {
                  running++
                  const index = running
                  const active = index === cursor
                  return (
                    <button
                      key={cmd.id}
                      data-active={active}
                      onMouseMove={() => setCursor(index)}
                      onClick={() => choose(index)}
                      className={clsx(
                        'flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors',
                      )}
                      style={active ? { background: 'var(--surface-3)' } : undefined}
                    >
                      <span className="text-faint flex w-5 shrink-0 justify-center">
                        {cmd.badge}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px]">{cmd.label}</span>
                        {cmd.detail && (
                          <span className="text-faint block truncate text-[11px]">
                            {cmd.detail}
                          </span>
                        )}
                      </span>
                      {cmd.trailing && <span className="shrink-0">{cmd.trailing}</span>}
                      {active && <CornerDownLeft size={13} className="text-faint shrink-0" />}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div
          className="hairline text-faint flex items-center gap-3 border-t px-3.5 py-2 text-[11px]"
          style={{ background: 'var(--surface-2)' }}
        >
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> moverse
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>↵</Kbd> abrir
          </span>
        </div>
      </div>
    </div>
  )
}
