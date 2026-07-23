import clsx from 'clsx'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import TaskCard from '../components/TaskCard'
import { useTaskEditor } from '../components/TaskEditor'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  ProgressBar,
  SubjectBadge,
  Textarea,
} from '../components/ui'
import { WEEKDAYS, formatTime, minutesOf } from '../lib/dates'
import { decorateAll, sortByUrgency, subjectStats } from '../lib/selectors'
import { SUBJECT_COLORS, colorVar } from '../lib/ui'
import { useApp } from '../store'
import type { Subject, SubjectColor } from '../types'

interface SubjectDraft {
  id?: string
  name: string
  teacher: string
  color: SubjectColor
  room: string
  contact: string
  notes: string
}

function SubjectForm({ draft, onClose }: { draft: SubjectDraft | null; onClose: () => void }) {
  const { addSubject, updateSubject, removeSubject } = useApp()
  const [local, setLocal] = useState<SubjectDraft | null>(draft)
  const [confirm, setConfirm] = useState(false)

  function set<K extends keyof SubjectDraft>(key: K, value: SubjectDraft[K]) {
    setLocal((d) => (d ? { ...d, [key]: value } : d))
  }

  function save() {
    if (!local || !local.name.trim()) return
    const payload = {
      name: local.name.trim(),
      teacher: local.teacher.trim(),
      color: local.color,
      room: local.room.trim() || undefined,
      contact: local.contact.trim() || undefined,
      notes: local.notes.trim() || undefined,
    }
    if (local.id) updateSubject(local.id, payload)
    else addSubject(payload)
    onClose()
  }

  return (
    <>
      <Modal
        open={draft !== null}
        onClose={onClose}
        title={draft?.id ? 'Editar materia' : 'Nueva materia'}
        footer={
          <>
            {local?.id && (
              <Button
                variant="danger"
                className="mr-auto"
                icon={<Trash2 size={14} />}
                onClick={() => setConfirm(true)}
              >
                Eliminar
              </Button>
            )}
            <Button onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={save} disabled={!local?.name.trim()}>
              Guardar
            </Button>
          </>
        }
      >
        {local && (
          <div className="flex flex-col gap-4">
            <Field label="Nombre">
              <Input
                autoFocus
                value={local.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Química"
              />
            </Field>

            <Field label="Profesor">
              <Input
                value={local.teacher}
                onChange={(e) => set('teacher', e.target.value)}
                placeholder="Lic. Andrés Peña"
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Aula habitual">
                <Input
                  value={local.room}
                  onChange={(e) => set('room', e.target.value)}
                  placeholder="Lab 3"
                />
              </Field>
              <Field label="Contacto">
                <Input
                  value={local.contact}
                  onChange={(e) => set('contact', e.target.value)}
                  placeholder="correo@colegio.edu"
                />
              </Field>
            </div>

            <div>
              <span className="mb-2 block text-[13px] font-medium">Color</span>
              <div className="flex flex-wrap gap-1.5">
                {SUBJECT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => set('color', c.value)}
                    aria-label={c.label}
                    title={c.label}
                    className={clsx(
                      'h-7 w-7 rounded-md border transition-transform',
                      local.color === c.value && 'scale-110',
                    )}
                    style={{
                      background: colorVar(c.value),
                      borderColor:
                        local.color === c.value ? 'var(--text)' : 'transparent',
                    }}
                  />
                ))}
              </div>
            </div>

            <Field label="Apuntes" hint="Criterios de evaluación, libro, enlaces.">
              <Textarea
                rows={3}
                value={local.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirm}
        title="Eliminar materia"
        message="Se quitará también de tu horario. Las actividades y notas asociadas se conservan, pero quedarán sin materia."
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          if (local?.id) removeSubject(local.id)
          setConfirm(false)
          onClose()
        }}
      />
    </>
  )
}

function SubjectDetail({ subject, onClose }: { subject: Subject | null; onClose: () => void }) {
  const { tasks, subjects, blocks, settings } = useApp()
  const { openTaskEditor } = useTaskEditor()

  const views = useMemo(
    () => decorateAll(tasks, subjects).filter((t) => t.subjectId === subject?.id),
    [tasks, subjects, subject?.id],
  )
  const stats = subject ? subjectStats(subject, tasks) : null
  const mine = blocks
    .filter((b) => b.subjectId === subject?.id)
    .sort((a, b) => a.weekday - b.weekday || minutesOf(a.start) - minutesOf(b.start))

  const pendientes = views.filter((t) => t.status !== 'hecha').sort(sortByUrgency)
  const hechas = views.filter((t) => t.status === 'hecha').sort(sortByUrgency)

  return (
    <Modal open={subject !== null} onClose={onClose} wide title={subject?.name ?? ''}>
      {subject && stats && (
        <div className="flex flex-col gap-5">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-3">
            {subject.teacher && (
              <div>
                <dt className="text-faint text-[11px]">Profesor</dt>
                <dd className="mt-0.5">{subject.teacher}</dd>
              </div>
            )}
            {subject.room && (
              <div>
                <dt className="text-faint text-[11px]">Aula</dt>
                <dd className="mt-0.5">{subject.room}</dd>
              </div>
            )}
            {subject.contact && (
              <div>
                <dt className="text-faint text-[11px]">Contacto</dt>
                <dd className="mt-0.5 truncate">{subject.contact}</dd>
              </div>
            )}
            {stats.average !== null && (
              <div>
                <dt className="text-faint text-[11px]">Promedio</dt>
                <dd className="mt-0.5 tabular-nums">
                  {stats.average.toFixed(1)} / {settings.gradeScale}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-faint text-[11px]">Progreso</dt>
              <dd className="mt-0.5 tabular-nums">
                {stats.done} de {stats.total}
              </dd>
            </div>
          </dl>

          {subject.notes && (
            <p className="text-muted text-[13px] leading-relaxed whitespace-pre-wrap">
              {subject.notes}
            </p>
          )}

          {mine.length > 0 && (
            <div>
              <h3 className="eyebrow mb-2">Horario</h3>
              <div className="text-muted flex flex-wrap gap-x-4 gap-y-1 text-[12px] tabular-nums">
                {mine.map((b) => (
                  <span key={b.id}>
                    <span className="text-[color:var(--text)] font-medium">
                      {WEEKDAYS.find((d) => d.value === b.weekday)?.short}
                    </span>{' '}
                    {formatTime(b.start)}–{formatTime(b.end)}
                    {b.room ? ` · ${b.room}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="eyebrow">Pendientes ({pendientes.length})</h3>
              <Button
                size="sm"
                icon={<Plus size={13} />}
                onClick={() => {
                  onClose()
                  openTaskEditor(undefined, { subjectId: subject.id })
                }}
              >
                Añadir
              </Button>
            </div>
            {pendientes.length === 0 ? (
              <p className="text-muted text-[13px]">Nada pendiente en esta materia.</p>
            ) : (
              <div className="panel divide-hairline overflow-hidden">
                {pendientes.map((t) => (
                  <TaskCard key={t.id} task={t} showSubject={false} compact />
                ))}
              </div>
            )}
          </div>

          {hechas.length > 0 && (
            <div>
              <h3 className="eyebrow mb-2">Terminadas ({hechas.length})</h3>
              <div className="panel divide-hairline overflow-hidden">
                {hechas.slice(0, 6).map((t) => (
                  <TaskCard key={t.id} task={t} showSubject={false} compact />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

export default function Materias() {
  const { subjects, tasks, blocks, settings } = useApp()
  const [draft, setDraft] = useState<SubjectDraft | null>(null)
  const [detail, setDetail] = useState<Subject | null>(null)

  function openNew() {
    const used = new Set(subjects.map((s) => s.color))
    const next = SUBJECT_COLORS.find((c) => !used.has(c.value))?.value ?? 'indigo'
    setDraft({ name: '', teacher: '', color: next, room: '', contact: '', notes: '' })
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight">Materias</h1>
        <Button icon={<Plus size={15} />} onClick={openNew}>
          Nueva materia
        </Button>
      </header>

      {subjects.length === 0 ? (
        <div className="panel">
          <EmptyState
            title="Todavía no tienes materias"
            description="Registra cada materia con el nombre del profesor. Después podrás asignarle actividades y horario."
            action={
              <Button variant="primary" icon={<Plus size={15} />} onClick={openNew}>
                Añadir la primera
              </Button>
            }
          />
        </div>
      ) : (
        <div className="panel divide-hairline overflow-hidden">
          {subjects.map((subject) => {
            const stats = subjectStats(subject, tasks)
            const classCount = blocks.filter((b) => b.subjectId === subject.id).length
            const progress = stats.total ? stats.done / stats.total : 0

            return (
              <div
                key={subject.id}
                className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-[color:var(--surface-hover)]"
              >
                <SubjectBadge name={subject.name} color={subject.color} size={32} />

                <button
                  onClick={() => setDetail(subject)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="truncate text-[13px] font-medium">{subject.name}</div>
                  <div className="text-faint truncate text-[11px]">
                    {subject.teacher || 'Sin profesor'}
                    {classCount > 0 && ` · ${classCount} clase${classCount === 1 ? '' : 's'}/semana`}
                    {subject.room && ` · ${subject.room}`}
                  </div>
                </button>

                <div className="hidden w-28 shrink-0 sm:block">
                  {stats.total > 0 && (
                    <>
                      <div className="text-faint mb-1 text-right text-[11px] tabular-nums">
                        {stats.done}/{stats.total}
                      </div>
                      <ProgressBar value={progress} color={colorVar(subject.color)} />
                    </>
                  )}
                </div>

                <div className="w-20 shrink-0 text-right text-[11px] tabular-nums">
                  {stats.overdue > 0 ? (
                    <span style={{ color: 'var(--due-late)' }}>{stats.overdue} vencida{stats.overdue === 1 ? '' : 's'}</span>
                  ) : stats.pending > 0 ? (
                    <span className="text-muted">{stats.pending} pendiente{stats.pending === 1 ? '' : 's'}</span>
                  ) : (
                    <span className="text-faint">Al día</span>
                  )}
                  {stats.average !== null && (
                    <div className="text-faint">
                      {stats.average.toFixed(1)}/{settings.gradeScale}
                    </div>
                  )}
                </div>

                <button
                  onClick={() =>
                    setDraft({
                      id: subject.id,
                      name: subject.name,
                      teacher: subject.teacher,
                      color: subject.color,
                      room: subject.room ?? '',
                      contact: subject.contact ?? '',
                      notes: subject.notes ?? '',
                    })
                  }
                  className="text-faint shrink-0 rounded px-2 py-1 text-[11px] transition-colors hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text)]"
                >
                  Editar
                </button>
              </div>
            )
          })}
        </div>
      )}

      <SubjectForm
        key={draft ? (draft.id ?? 'nueva') : 'cerrado'}
        draft={draft}
        onClose={() => setDraft(null)}
      />
      <SubjectDetail subject={detail} onClose={() => setDetail(null)} />
    </div>
  )
}
