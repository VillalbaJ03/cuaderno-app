import clsx from 'clsx'
import { Plus, Trash2 } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useApp } from '../store'
import type { Priority, Subtask, Task, TaskStatus, TaskType } from '../types'
import { capitalize, fromKey, isoWeekday, longDate, shiftKey, todayKey } from '../lib/dates'
import { PRIORITIES, STATUSES, TASK_TYPES, uid } from '../lib/ui'
import { Button, ConfirmDialog, Field, Input, Modal, Select, Textarea } from './ui'

interface TaskDraft {
  id?: string
  title: string
  subjectId: string | null
  type: TaskType
  dueDate: string
  dueTime: string
  prepDays: number
  status: TaskStatus
  priority: Priority
  notes: string
  link: string
  subtasks: Subtask[]
  grade: string
  weight: string
}

interface TaskEditorContextValue {
  /** Abre el formulario. Sin argumentos crea una actividad nueva. */
  openTaskEditor: (task?: Task, preset?: { dueDate?: string; subjectId?: string }) => void
}

const TaskEditorContext = createContext<TaskEditorContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useTaskEditor(): TaskEditorContextValue {
  const ctx = useContext(TaskEditorContext)
  if (!ctx) throw new Error('useTaskEditor debe usarse dentro de <TaskEditorProvider>')
  return ctx
}

function emptyDraft(defaults: {
  prepDays: number
  dueDate?: string
  subjectId?: string | null
}): TaskDraft {
  return {
    title: '',
    subjectId: defaults.subjectId ?? null,
    type: 'deber',
    dueDate: defaults.dueDate ?? todayKey(),
    dueTime: '',
    prepDays: defaults.prepDays,
    status: 'pendiente',
    priority: 'media',
    notes: '',
    link: '',
    subtasks: [],
    grade: '',
    weight: '',
  }
}

function toDraft(task: Task): TaskDraft {
  return {
    id: task.id,
    title: task.title,
    subjectId: task.subjectId,
    type: task.type,
    dueDate: task.dueDate,
    dueTime: task.dueTime ?? '',
    prepDays: task.prepDays,
    status: task.status,
    priority: task.priority,
    notes: task.notes ?? '',
    link: task.link ?? '',
    subtasks: task.subtasks,
    grade: task.grade === null || task.grade === undefined ? '' : String(task.grade),
    weight: task.weight === null || task.weight === undefined ? '' : String(task.weight),
  }
}

/** Botón de opción dentro de un grupo de elección única. */
function Option({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'h-7 rounded-md border px-2.5 text-[12px] transition-colors',
        active ? 'font-medium' : 'text-muted hover:bg-[color:var(--surface-2)]',
      )}
      style={
        active
          ? {
              background: 'var(--accent-soft)',
              borderColor: 'var(--accent)',
              color: 'var(--accent)',
            }
          : { borderColor: 'var(--border-strong)', background: 'var(--surface)' }
      }
    >
      {children}
    </button>
  )
}

export function TaskEditorProvider({ children }: { children: ReactNode }) {
  const { subjects, settings, addTask, updateTask, removeTask, blocks } = useApp()
  const [draft, setDraft] = useState<TaskDraft | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [newSubtask, setNewSubtask] = useState('')

  const openTaskEditor = useCallback<TaskEditorContextValue['openTaskEditor']>(
    (task, preset) => {
      setNewSubtask('')
      setDraft(
        task
          ? toDraft(task)
          : emptyDraft({
              prepDays: settings.defaultPrepDays,
              dueDate: preset?.dueDate,
              subjectId: preset?.subjectId ?? null,
            }),
      )
    },
    [settings.defaultPrepDays],
  )

  const value = useMemo(() => ({ openTaskEditor }), [openTaskEditor])

  const close = () => {
    setDraft(null)
    setConfirmDelete(false)
  }

  function set<K extends keyof TaskDraft>(key: K, val: TaskDraft[K]) {
    setDraft((d) => (d ? { ...d, [key]: val } : d))
  }

  function save() {
    if (!draft || !draft.title.trim()) return
    const payload = {
      title: draft.title.trim(),
      subjectId: draft.subjectId,
      type: draft.type,
      dueDate: draft.dueDate,
      dueTime: draft.dueTime || undefined,
      prepDays: Math.max(0, Number(draft.prepDays) || 0),
      status: draft.status,
      priority: draft.priority,
      notes: draft.notes.trim() || undefined,
      link: draft.link.trim() || undefined,
      subtasks: draft.subtasks,
      grade: draft.grade === '' ? null : Number(draft.grade),
      weight: draft.weight === '' ? null : Number(draft.weight),
      completedAt: draft.status === 'hecha' ? new Date().toISOString() : null,
    }
    if (draft.id) updateTask(draft.id, payload)
    else addTask(payload)
    close()
  }

  const startDate = draft ? shiftKey(draft.dueDate, -Math.max(0, Number(draft.prepDays) || 0)) : ''

  // Si ese día hay clase de la materia elegida, lo indicamos como referencia.
  const classHint = useMemo(() => {
    if (!draft?.subjectId || !draft.dueDate) return null
    const weekday = isoWeekday(fromKey(draft.dueDate))
    const block = blocks.find((b) => b.subjectId === draft.subjectId && b.weekday === weekday)
    return block ? `Ese día hay clase de ${block.start} a ${block.end}` : null
  }, [draft?.subjectId, draft?.dueDate, blocks])

  const quickDates = [
    { label: 'Hoy', value: todayKey() },
    { label: 'Mañana', value: shiftKey(todayKey(), 1) },
    { label: '+3 días', value: shiftKey(todayKey(), 3) },
    { label: '+1 semana', value: shiftKey(todayKey(), 7) },
  ]

  function addSubtaskFromInput() {
    if (!draft || !newSubtask.trim()) return
    set('subtasks', [...draft.subtasks, { id: uid(), title: newSubtask.trim(), done: false }])
    setNewSubtask('')
  }

  return (
    <TaskEditorContext.Provider value={value}>
      {children}

      <Modal
        open={draft !== null}
        onClose={close}
        wide
        title={draft?.id ? 'Editar actividad' : 'Nueva actividad'}
        footer={
          <>
            {draft?.id && (
              <Button
                variant="danger"
                className="mr-auto"
                icon={<Trash2 size={14} />}
                onClick={() => setConfirmDelete(true)}
              >
                Eliminar
              </Button>
            )}
            <Button onClick={close}>Cancelar</Button>
            <Button variant="primary" onClick={save} disabled={!draft?.title.trim()}>
              Guardar
            </Button>
          </>
        }
      >
        {draft && (
          <div className="flex flex-col gap-5">
            <Field label="Qué te mandaron">
              <Input
                autoFocus
                value={draft.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Exposición sobre la tabla periódica"
              />
            </Field>

            <div>
              <span className="mb-1.5 block text-[13px] font-medium">Tipo</span>
              <div className="flex flex-wrap gap-1.5">
                {TASK_TYPES.map((t) => (
                  <Option
                    key={t.value}
                    active={draft.type === t.value}
                    onClick={() => set('type', t.value)}
                  >
                    {t.label}
                  </Option>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Materia">
                <Select
                  value={draft.subjectId ?? ''}
                  onChange={(e) => set('subjectId', e.target.value || null)}
                >
                  <option value="">Sin materia</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.teacher ? ` — ${s.teacher}` : ''}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Prioridad">
                <Select
                  value={draft.priority}
                  onChange={(e) => set('priority', e.target.value as Priority)}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
              <Field label="Día de entrega o presentación">
                <Input
                  type="date"
                  value={draft.dueDate}
                  onChange={(e) => set('dueDate', e.target.value || todayKey())}
                />
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {quickDates.map((q) => (
                    <Option
                      key={q.label}
                      active={draft.dueDate === q.value}
                      onClick={() => set('dueDate', q.value)}
                    >
                      {q.label}
                    </Option>
                  ))}
                </div>
              </Field>

              <Field label="Hora" hint={classHint ?? undefined}>
                <Input
                  type="time"
                  value={draft.dueTime}
                  onChange={(e) => set('dueTime', e.target.value)}
                />
              </Field>
            </div>

            <div className="hairline border-t pt-5">
              <span className="mb-1.5 block text-[13px] font-medium">Empezar a prepararlo</span>
              <div className="flex flex-wrap gap-1.5">
                {[0, 1, 2, 3, 5, 7].map((n) => (
                  <Option
                    key={n}
                    active={Number(draft.prepDays) === n}
                    onClick={() => set('prepDays', n)}
                  >
                    {n === 0 ? 'El mismo día' : n === 1 ? '1 día antes' : `${n} días antes`}
                  </Option>
                ))}
              </div>
              <p className="text-faint mt-2 text-[12px]">
                Aparecerá en Hoy desde el {capitalize(longDate(startDate))}.
              </p>
            </div>

            <Field label="Apuntes">
              <Textarea
                rows={3}
                value={draft.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="En parejas, 10 minutos, entra desde el capítulo 4."
              />
            </Field>

            <div>
              <span className="mb-1.5 block text-[13px] font-medium">Pasos</span>
              <div className="flex flex-col gap-1">
                {draft.subtasks.map((s) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={s.done}
                      onChange={() =>
                        set(
                          'subtasks',
                          draft.subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)),
                        )
                      }
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <input
                      value={s.title}
                      onChange={(e) =>
                        set(
                          'subtasks',
                          draft.subtasks.map((x) =>
                            x.id === s.id ? { ...x, title: e.target.value } : x,
                          ),
                        )
                      }
                      className={clsx(
                        'min-w-0 flex-1 bg-transparent py-1 text-[13px] outline-none',
                        s.done && 'text-faint line-through',
                      )}
                    />
                    <button
                      onClick={() =>
                        set(
                          'subtasks',
                          draft.subtasks.filter((x) => x.id !== s.id),
                        )
                      }
                      aria-label="Quitar paso"
                      className="text-faint shrink-0 rounded p-1 transition-colors hover:bg-[color:var(--surface-2)]"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}

                <div className="mt-1 flex gap-2">
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addSubtaskFromInput()
                      }
                    }}
                    placeholder="Añadir paso"
                  />
                  <Button icon={<Plus size={14} />} disabled={!newSubtask.trim()} onClick={addSubtaskFromInput}>
                    Añadir
                  </Button>
                </div>
              </div>
            </div>

            <div className="hairline grid gap-4 border-t pt-5 sm:grid-cols-3">
              <Field label="Estado">
                <Select
                  value={draft.status}
                  onChange={(e) => set('status', e.target.value as TaskStatus)}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Nota obtenida" hint={`Sobre ${settings.gradeScale}`}>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  max={settings.gradeScale}
                  value={draft.grade}
                  onChange={(e) => set('grade', e.target.value)}
                />
              </Field>

              <Field label="Peso" hint="% de la nota final">
                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="100"
                  value={draft.weight}
                  onChange={(e) => set('weight', e.target.value)}
                />
              </Field>
            </div>

            <Field label="Enlace">
              <Input
                type="url"
                value={draft.link}
                onChange={(e) => set('link', e.target.value)}
                placeholder="https://"
              />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar actividad"
        message="Se borrará definitivamente de tu cuaderno."
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (draft?.id) removeTask(draft.id)
          close()
        }}
      />
    </TaskEditorContext.Provider>
  )
}
