import clsx from 'clsx'
import { Check, Link2, Minus } from 'lucide-react'
import type { TaskView } from '../lib/selectors'
import { formatTime, relativeDue, shortDate } from '../lib/dates'
import { URGENCY_STYLE, colorVar, taskTypeLabel } from '../lib/ui'
import { useApp } from '../store'
import { useTaskEditor } from './TaskEditor'
import { Pill, SubjectBadge } from './ui'

/** Casilla que rota pendiente → en curso → terminada. */
function StatusBox({ task }: { task: TaskView }) {
  const { cycleTaskStatus } = useApp()
  const done = task.status === 'hecha'
  const doing = task.status === 'en_progreso'

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        cycleTaskStatus(task.id)
      }}
      aria-label={`Estado: ${done ? 'terminada' : doing ? 'en curso' : 'pendiente'}`}
      title={done ? 'Terminada' : doing ? 'En curso' : 'Pendiente'}
      className={clsx(
        'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border',
        'transition-all duration-150 hover:scale-110',
      )}
      style={{
        borderColor: done ? 'var(--due-ok)' : doing ? 'var(--due-today)' : 'var(--border-strong)',
        background: done ? 'var(--due-ok)' : 'transparent',
        color: done ? 'var(--app-bg)' : 'var(--due-today)',
      }}
    >
      {done && <Check size={12} strokeWidth={3.5} />}
      {doing && <Minus size={12} strokeWidth={3.5} />}
    </button>
  )
}

export default function TaskCard({
  task,
  showSubject = true,
  compact = false,
}: {
  task: TaskView
  showSubject?: boolean
  compact?: boolean
}) {
  const { openTaskEditor } = useTaskEditor()
  const done = task.status === 'hecha'
  const urgency = URGENCY_STYLE[task.urgency]
  const doneSubtasks = task.subtasks.filter((s) => s.done).length

  const meta: string[] = []
  meta.push(taskTypeLabel(task.type))
  meta.push(shortDate(task.dueDate) + (task.dueTime ? `, ${formatTime(task.dueTime)}` : ''))
  if (task.subtasks.length > 0) meta.push(`${doneSubtasks}/${task.subtasks.length} pasos`)
  if (typeof task.grade === 'number') meta.push(`Nota ${task.grade}`)

  return (
    <div
      onClick={() => openTaskEditor(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') openTaskEditor(task)
      }}
      className={clsx(
        'group flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors duration-150',
        'hover:bg-[color:var(--surface-hover)] focus-visible:bg-[color:var(--surface-hover)]',
        'focus-visible:outline-none',
        done && 'opacity-50',
      )}
    >
      <StatusBox task={task} />

      {showSubject && (
        <SubjectBadge name={task.subject?.name ?? '—'} color={task.subject?.color} size={26} />
      )}

      <div className="min-w-0 flex-1">
        <h3 className={clsx('truncate text-[13px] font-medium', done && 'line-through')}>
          {task.title}
        </h3>

        <div className="text-faint mt-0.5 flex items-center gap-1.5 text-[11px]">
          {showSubject && task.subject && (
            <>
              <span className="truncate" style={{ color: colorVar(task.subject.color) }}>
                {task.subject.name}
              </span>
              <span aria-hidden>·</span>
            </>
          )}
          <span className="truncate">{meta.join(' · ')}</span>
          {task.link && (
            <a
              href={task.link}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 transition-colors hover:text-[color:var(--text)]"
              aria-label="Abrir enlace"
            >
              <Link2 size={11} />
            </a>
          )}
        </div>

        {!compact && task.notes && (
          <p className="text-muted mt-1.5 line-clamp-2 text-[12px] leading-relaxed">{task.notes}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {task.priority === 'alta' && !done && (
          <span
            aria-label="Prioridad alta"
            title="Prioridad alta"
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--due-late)' }}
          />
        )}
        {done ? (
          <span className="text-faint text-[11px]">Terminada</span>
        ) : (
          <Pill color={urgency.color} dot={false}>
            {relativeDue(task.dueDate)}
          </Pill>
        )}
      </div>
    </div>
  )
}
