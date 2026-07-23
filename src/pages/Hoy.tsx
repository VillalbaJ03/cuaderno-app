import { ArrowUpRight, CalendarOff, Plus, Sparkle } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import BackupBanner from '../components/BackupBanner'
import TaskCard from '../components/TaskCard'
import { useTaskEditor } from '../components/TaskEditor'
import { Button, EmptyState, Pill, SubjectBadge } from '../components/ui'
import { capitalize, daysUntil, longDate, shiftKey, todayKey } from '../lib/dates'
import {
  classesOn,
  decorateAll,
  overdue,
  sortByUrgency,
  tasksOn,
  toPrepareToday,
  type TaskView,
} from '../lib/selectors'
import { colorVar } from '../lib/ui'
import { useApp } from '../store'

function Section({
  title,
  hint,
  count,
  accent,
  tasks,
}: {
  title: string
  hint?: string
  count: number
  accent?: string
  tasks: TaskView[]
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2 px-0.5">
        {accent && (
          <span
            aria-hidden
            className="h-[7px] w-[7px] rounded-full"
            style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
          />
        )}
        <h2 className="eyebrow">{title}</h2>
        <span
          className="rounded px-1.5 text-[11px] font-semibold tabular-nums"
          style={{ background: 'var(--surface-2)', color: 'var(--text-faint)' }}
        >
          {count}
        </span>
      </div>
      {hint && <p className="text-muted mb-2.5 px-0.5 text-[12px] leading-relaxed">{hint}</p>}
      <div className="panel divide-hairline overflow-hidden">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} />
        ))}
      </div>
    </section>
  )
}

function StatCard({
  label,
  value,
  color,
  emphasis,
}: {
  label: string
  value: number
  color: string
  emphasis?: boolean
}) {
  return (
    <div className="panel relative overflow-hidden px-4 py-3.5">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: color, opacity: emphasis ? 1 : 0.35 }}
      />
      <div
        className="text-[26px] leading-none font-semibold tabular-nums"
        style={emphasis ? { color } : undefined}
      >
        {value}
      </div>
      <div className="text-faint mt-1.5 text-[11px]">{label}</div>
    </div>
  )
}

export default function Hoy() {
  const { tasks, subjects, blocks, settings } = useApp()
  const { openTaskEditor } = useTaskEditor()
  const today = todayKey()
  const tomorrow = shiftKey(today, 1)

  const views = useMemo(() => decorateAll(tasks, subjects), [tasks, subjects])

  const dueToday = useMemo(
    () => tasksOn(views, today).filter((t) => t.status !== 'hecha'),
    [views, today],
  )
  const dueTomorrow = useMemo(
    () => tasksOn(views, tomorrow).filter((t) => t.status !== 'hecha'),
    [views, tomorrow],
  )
  const late = useMemo(() => overdue(views), [views])
  const prepare = useMemo(() => toPrepareToday(views).filter((t) => t.daysLeft > 1), [views])

  const upcoming = useMemo(
    () =>
      views
        .filter(
          (t) =>
            t.status !== 'hecha' &&
            t.daysLeft > 1 &&
            (t.type === 'examen' || t.type === 'exposicion' || t.type === 'proyecto'),
        )
        .sort(sortByUrgency)
        .slice(0, 5),
    [views],
  )

  const todayClasses = useMemo(() => classesOn(blocks, today), [blocks, today])

  const stats = useMemo(() => {
    const pendientes = views.filter((t) => t.status !== 'hecha').length
    const semana = views.filter(
      (t) => t.status !== 'hecha' && t.daysLeft >= 0 && t.daysLeft <= 7,
    ).length
    const hechas = views.filter(
      (t) => t.status === 'hecha' && t.completedAt && daysUntil(t.completedAt.slice(0, 10)) >= -7,
    ).length
    return [
      { label: 'Por hacer', value: pendientes, color: 'var(--accent)' },
      {
        label: 'Vencidas',
        value: late.length,
        color: 'var(--due-late)',
        emphasis: late.length > 0,
      },
      { label: 'Próximos 7 días', value: semana, color: 'var(--due-today)' },
      { label: 'Terminadas (7 d)', value: hechas, color: 'var(--due-ok)' },
    ]
  }, [views, late])

  const firstName = settings.studentName.trim().split(' ')[0]
  const nothingUrgent = !late.length && !dueToday.length && !prepare.length

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{capitalize(longDate(today))}</p>
          <h1 className="mt-1.5 text-[26px] leading-none font-semibold">
            {firstName ? `Hola, ${firstName}` : 'Tu día'}
          </h1>
        </div>
        {/* El envoltorio controla la visibilidad: `hidden` sobre el propio
            botón perdería frente a su `inline-flex` de base. */}
        <div className="hidden lg:block">
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => openTaskEditor()}>
            Nueva actividad
          </Button>
        </div>
      </header>

      <BackupBanner />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        {/* Columna principal */}
        <div className="flex min-w-0 flex-col gap-7">
          {nothingUrgent && (
            <div className="panel">
              <EmptyState
                icon={<Sparkle size={20} />}
                title="Nada urgente por hoy"
                description="No hay entregas vencidas ni pendientes para hoy. Buen momento para adelantar algo."
                action={
                  <Button variant="primary" icon={<Plus size={15} />} onClick={() => openTaskEditor()}>
                    Anotar una actividad
                  </Button>
                }
              />
            </div>
          )}

          {late.length > 0 && (
            <Section title="Vencidas" count={late.length} accent="var(--due-late)" tasks={late} />
          )}

          {dueToday.length > 0 && (
            <Section
              title="Se entrega hoy"
              count={dueToday.length}
              accent="var(--due-today)"
              tasks={dueToday}
            />
          )}

          {prepare.length > 0 && (
            <Section
              title="Toca ir preparando"
              hint="Aún no se entrega, pero marcaste que querías empezar con antelación."
              count={prepare.length}
              accent="var(--accent)"
              tasks={prepare}
            />
          )}

          {dueTomorrow.length > 0 && (
            <Section title="Mañana" count={dueTomorrow.length} tasks={dueTomorrow} />
          )}
        </div>

        {/* Columna lateral */}
        <div className="flex min-w-0 flex-col gap-7">
          <section>
            <div className="mb-2.5 flex items-center justify-between px-0.5">
              <h2 className="eyebrow">Clases de hoy</h2>
              <Link
                to="/horario"
                className="text-faint inline-flex items-center gap-0.5 text-[11px] transition-colors hover:text-[color:var(--text)]"
              >
                Horario <ArrowUpRight size={12} />
              </Link>
            </div>

            {todayClasses.length === 0 ? (
              <div className="panel text-muted flex items-center gap-2.5 px-3.5 py-4 text-[13px]">
                <CalendarOff size={15} className="text-faint" />
                Hoy no tienes clases.
              </div>
            ) : (
              <ol className="panel overflow-hidden">
                {todayClasses.map((b, i) => {
                  const subject = subjects.find((s) => s.id === b.subjectId)
                  return (
                    <li key={b.id} className="relative flex gap-3 px-3.5 py-3">
                      {/* Línea de tiempo */}
                      <div className="flex w-11 shrink-0 flex-col items-end">
                        <span className="text-[12px] font-medium tabular-nums">{b.start}</span>
                        <span className="text-faint text-[10px] tabular-nums">{b.end}</span>
                      </div>

                      <div className="relative flex shrink-0 flex-col items-center">
                        <span
                          className="mt-1 h-2 w-2 rounded-full"
                          style={{ background: colorVar(subject?.color) }}
                        />
                        {i < todayClasses.length - 1 && (
                          <span
                            className="mt-1 w-px flex-1"
                            style={{ background: 'var(--border)' }}
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pb-1">
                        <div className="truncate text-[13px] font-medium">
                          {subject?.name ?? 'Clase'}
                        </div>
                        <div className="text-faint truncate text-[11px]">
                          {subject?.teacher}
                          {b.room || subject?.room ? ` · ${b.room ?? subject?.room}` : ''}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>

          <section>
            <h2 className="eyebrow mb-2.5 px-0.5">Exámenes y exposiciones</h2>
            {upcoming.length === 0 ? (
              <div className="panel text-muted px-3.5 py-4 text-[13px]">Nada previsto por ahora.</div>
            ) : (
              <ul className="panel divide-hairline overflow-hidden">
                {upcoming.map((t) => (
                  <li key={t.id}>
                    <button
                      onClick={() => openTaskEditor(t)}
                      className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-[color:var(--surface-hover)]"
                    >
                      <SubjectBadge
                        name={t.subject?.name ?? '—'}
                        color={t.subject?.color}
                        size={26}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px]">{t.title}</div>
                        <div className="text-faint truncate text-[11px]">
                          {t.subject?.name ?? 'Sin materia'}
                        </div>
                      </div>
                      <Pill dot={false}>{t.daysLeft} d</Pill>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
