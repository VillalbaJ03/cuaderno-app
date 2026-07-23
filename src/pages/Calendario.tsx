import clsx from 'clsx'
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import TaskCard from '../components/TaskCard'
import { useTaskEditor } from '../components/TaskEditor'
import { Button } from '../components/ui'
import { capitalize, formatTime, longDate, toKey, todayKey } from '../lib/dates'
import { classesOn, decorateAll, tasksOn } from '../lib/selectors'
import { colorVar } from '../lib/ui'
import { useApp } from '../store'

const WEEK_HEADERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export default function Calendario() {
  const { tasks, subjects, blocks } = useApp()
  const { openTaskEditor } = useTaskEditor()
  const today = todayKey()

  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState(today)

  const views = useMemo(() => decorateAll(tasks, subjects), [tasks, subjects])

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [cursor])

  const byDay = useMemo(() => {
    const map = new Map<string, typeof views>()
    for (const t of views) {
      const list = map.get(t.dueDate) ?? []
      list.push(t)
      map.set(t.dueDate, list)
    }
    return map
  }, [views])

  const selectedTasks = useMemo(() => tasksOn(views, selected), [views, selected])
  const selectedClasses = useMemo(() => classesOn(blocks, selected), [blocks, selected])

  function move(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight">Calendario</h1>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            onClick={() => {
              setCursor(startOfMonth(new Date()))
              setSelected(today)
            }}
          >
            Hoy
          </Button>
          <Button size="sm" onClick={() => move(-1)} aria-label="Mes anterior">
            <ChevronLeft size={15} />
          </Button>
          <Button size="sm" onClick={() => move(1)} aria-label="Mes siguiente">
            <ChevronRight size={15} />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="panel p-3 sm:p-4">
          <h2 className="mb-3 text-[13px] font-medium">
            {capitalize(format(cursor, 'MMMM yyyy', { locale: es }))}
          </h2>

          <div className="grid grid-cols-7">
            {WEEK_HEADERS.map((d, i) => (
              <div key={i} className="text-faint pb-2 text-center text-[11px] font-medium">
                {d}
              </div>
            ))}

            {days.map((day) => {
              const key = toKey(day)
              const dayTasks = byDay.get(key) ?? []
              const pendientes = dayTasks.filter((t) => t.status !== 'hecha')
              const isToday = key === today
              const isSelected = key === selected
              const inMonth = isSameMonth(day, cursor)
              const hasClasses = classesOn(blocks, key).length > 0

              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={clsx(
                    'relative flex aspect-square flex-col items-center rounded-md transition-colors sm:aspect-[1/0.8]',
                    !inMonth && 'opacity-30',
                    !isSelected && 'hover:bg-[color:var(--surface-2)]',
                  )}
                  style={
                    isSelected
                      ? { background: 'var(--accent)', color: 'var(--accent-contrast)' }
                      : undefined
                  }
                >
                  <span
                    className={clsx(
                      'mt-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[12px] tabular-nums',
                      isToday && 'font-semibold',
                    )}
                    style={
                      isToday && !isSelected
                        ? { background: 'var(--surface-3)' }
                        : undefined
                    }
                  >
                    {format(day, 'd')}
                  </span>

                  <div className="mt-1 flex max-w-full flex-wrap justify-center gap-[3px]">
                    {pendientes.slice(0, 4).map((t) => (
                      <span
                        key={t.id}
                        className="h-[5px] w-[5px] rounded-full"
                        style={{
                          background: isSelected
                            ? 'var(--accent-contrast)'
                            : colorVar(t.subject?.color),
                        }}
                      />
                    ))}
                  </div>

                  {hasClasses && (
                    <span
                      aria-hidden
                      className="absolute bottom-1.5 h-px w-3"
                      style={{
                        background: isSelected
                          ? 'color-mix(in oklab, var(--accent-contrast) 55%, transparent)'
                          : 'var(--border-strong)',
                      }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          <div className="text-faint hairline mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span
                className="h-[5px] w-[5px] rounded-full"
                style={{ background: 'var(--text-muted)' }}
              />
              entrega pendiente
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-px w-3" style={{ background: 'var(--border-strong)' }} />
              hay clases
            </span>
          </div>
        </section>

        <section className="flex min-w-0 flex-col gap-4">
          <div className="panel overflow-hidden">
            <div className="hairline flex items-center justify-between gap-3 border-b px-3 py-2.5">
              <h2 className="text-[13px] font-medium">
                {capitalize(longDate(selected))}
                {selected === today && <span className="text-faint ml-2 text-[11px]">hoy</span>}
              </h2>
              <Button
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => openTaskEditor(undefined, { dueDate: selected })}
              >
                Añadir
              </Button>
            </div>

            {selectedClasses.length > 0 && (
              <ul className="divide-hairline">
                {selectedClasses.map((b) => {
                  const subject = subjects.find((s) => s.id === b.subjectId)
                  return (
                    <li key={b.id} className="flex items-center gap-2.5 px-3 py-2">
                      <span
                        aria-hidden
                        className="h-4 w-[2px] shrink-0 rounded-full"
                        style={{ background: colorVar(subject?.color) }}
                      />
                      <span className="text-muted shrink-0 text-[11px] tabular-nums">
                        {formatTime(b.start)}
                      </span>
                      <span className="truncate text-[13px]">{subject?.name ?? 'Clase'}</span>
                      {(b.room || subject?.room) && (
                        <span className="text-faint ml-auto shrink-0 text-[11px]">
                          {b.room ?? subject?.room}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {selectedTasks.length === 0 ? (
            <div className="panel text-muted px-3 py-6 text-center text-[13px]">
              Nada anotado para este día.
            </div>
          ) : (
            <div className="panel divide-hairline overflow-hidden">
              {selectedTasks.map((t) => (
                <TaskCard key={t.id} task={t} compact />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
