import clsx from 'clsx'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, EmptyState, Field, Input, Modal, Select } from '../components/ui'
import { WEEKDAYS, formatTime, isoWeekday, minutesOf } from '../lib/dates'
import { colorSoft, colorVar } from '../lib/ui'
import { useApp } from '../store'
import type { ClassBlock } from '../types'

const ROW_HEIGHT = 28 // píxeles por cada media hora

interface BlockDraft {
  id?: string
  subjectId: string
  weekday: number
  start: string
  end: string
  room: string
}

function BlockEditor({ draft, onClose }: { draft: BlockDraft | null; onClose: () => void }) {
  const { subjects, addBlock, updateBlock, removeBlock } = useApp()
  const [local, setLocal] = useState<BlockDraft | null>(draft)

  function set<K extends keyof BlockDraft>(key: K, value: BlockDraft[K]) {
    setLocal((d) => (d ? { ...d, [key]: value } : d))
  }

  function save() {
    if (!local || !local.subjectId) return
    updateOrAdd()
    onClose()
  }

  function updateOrAdd() {
    if (!local) return
    const payload = {
      subjectId: local.subjectId,
      weekday: local.weekday,
      start: local.start,
      end: local.end,
      room: local.room.trim() || undefined,
    }
    if (local.id) updateBlock(local.id, payload)
    else addBlock(payload)
  }

  const invalid = local ? minutesOf(local.end) <= minutesOf(local.start) : false

  return (
    <Modal
      open={draft !== null}
      onClose={onClose}
      title={draft?.id ? 'Editar clase' : 'Añadir clase'}
      footer={
        <>
          {local?.id && (
            <Button
              variant="danger"
              className="mr-auto"
              icon={<Trash2 size={14} />}
              onClick={() => {
                removeBlock(local.id!)
                onClose()
              }}
            >
              Quitar
            </Button>
          )}
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={save} disabled={!local?.subjectId || invalid}>
            Guardar
          </Button>
        </>
      }
    >
      {local && (
        <div className="flex flex-col gap-4">
          <Field label="Materia">
            <Select value={local.subjectId} onChange={(e) => set('subjectId', e.target.value)}>
              <option value="">Elige una materia</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.teacher ? ` — ${s.teacher}` : ''}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Día">
            <Select value={local.weekday} onChange={(e) => set('weekday', Number(e.target.value))}>
              {WEEKDAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Empieza">
              <Input
                type="time"
                value={local.start}
                onChange={(e) => set('start', e.target.value)}
              />
            </Field>
            <Field
              label="Termina"
              hint={invalid ? 'Debe ser posterior a la hora de inicio.' : undefined}
            >
              <Input type="time" value={local.end} onChange={(e) => set('end', e.target.value)} />
            </Field>
          </div>

          <Field label="Aula">
            <Input
              value={local.room}
              onChange={(e) => set('room', e.target.value)}
              placeholder="Opcional"
            />
          </Field>
        </div>
      )}
    </Modal>
  )
}

export default function Horario() {
  const { blocks, subjects, settings } = useApp()
  const [draft, setDraft] = useState<BlockDraft | null>(null)
  const todayWeekday = isoWeekday(new Date())

  const days = settings.showWeekend ? WEEKDAYS : WEEKDAYS.slice(0, 5)

  const { startHour, endHour } = useMemo(() => {
    if (blocks.length === 0) return { startHour: 7, endHour: 15 }
    const starts = blocks.map((b) => minutesOf(b.start))
    const ends = blocks.map((b) => minutesOf(b.end))
    return {
      startHour: Math.max(0, Math.floor(Math.min(...starts) / 60)),
      endHour: Math.min(24, Math.ceil(Math.max(...ends) / 60)),
    }
  }, [blocks])

  const hours = useMemo(
    () => Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i),
    [startHour, endHour],
  )

  const gridHeight = (endHour - startHour) * 2 * ROW_HEIGHT

  function blockStyle(b: ClassBlock) {
    const top = ((minutesOf(b.start) - startHour * 60) / 30) * ROW_HEIGHT
    const height = Math.max(
      ((minutesOf(b.end) - minutesOf(b.start)) / 30) * ROW_HEIGHT - 3,
      ROW_HEIGHT - 3,
    )
    return { top, height }
  }

  function openNew(weekday: number) {
    setDraft({ subjectId: '', weekday, start: '07:00', end: '08:40', room: '' })
  }

  function openExisting(b: ClassBlock) {
    setDraft({
      id: b.id,
      subjectId: b.subjectId,
      weekday: b.weekday,
      start: b.start,
      end: b.end,
      room: b.room ?? '',
    })
  }

  if (subjects.length === 0) {
    return (
      <div className="panel">
        <EmptyState
          title="Primero registra tus materias"
          description="Añade las materias con el nombre del profesor y después arma el horario semanal."
          action={
            <Link to="/materias">
              <Button variant="primary">Ir a Materias</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight">Horario</h1>
        <Button icon={<Plus size={15} />} onClick={() => openNew(todayWeekday)}>
          Añadir clase
        </Button>
      </header>

      {blocks.length === 0 ? (
        <div className="panel">
          <EmptyState
            title="Tu horario está vacío"
            description="Añade cada bloque de clase con materia, día, hora y aula."
            action={
              <Button variant="primary" icon={<Plus size={15} />} onClick={() => openNew(1)}>
                Añadir la primera clase
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {/* Rejilla semanal */}
          <div className="panel hidden overflow-x-auto p-4 md:block">
            <div className="flex min-w-[620px]">
              <div className="w-12 shrink-0 pt-7">
                <div className="relative" style={{ height: gridHeight }}>
                  {hours.map((h, i) => (
                    <div
                      key={h}
                      className="text-faint absolute -translate-y-1/2 text-[11px] tabular-nums"
                      style={{ top: i * 2 * ROW_HEIGHT }}
                    >
                      {String(h).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="grid flex-1"
                style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
              >
                {days.map((day) => {
                  const dayBlocks = blocks
                    .filter((b) => b.weekday === day.value)
                    .sort((a, b) => minutesOf(a.start) - minutesOf(b.start))
                  const isToday = day.value === todayWeekday

                  return (
                    <div key={day.value} className="px-0.5">
                      <div
                        className={clsx(
                          'mb-1.5 pb-1 text-center text-[11px]',
                          isToday ? 'font-semibold' : 'text-muted',
                        )}
                      >
                        {day.short}
                      </div>

                      <div
                        className="hairline relative border-l"
                        style={{ height: gridHeight }}
                      >
                        {hours.slice(1).map((h, i) => (
                          <div
                            key={h}
                            className="absolute inset-x-0 border-t"
                            style={{
                              top: (i + 1) * 2 * ROW_HEIGHT,
                              borderColor: 'var(--border)',
                            }}
                          />
                        ))}

                        <button
                          onClick={() => openNew(day.value)}
                          aria-label={`Añadir clase el ${day.label}`}
                          className="absolute inset-0 h-full w-full"
                        />

                        {dayBlocks.map((b) => {
                          const subject = subjects.find((s) => s.id === b.subjectId)
                          const { top, height } = blockStyle(b)
                          return (
                            <button
                              key={b.id}
                              onClick={() => openExisting(b)}
                              className="absolute inset-x-0.5 overflow-hidden rounded-sm px-1.5 py-1 text-left transition-opacity hover:opacity-80"
                              style={{
                                top,
                                height,
                                background: colorSoft(subject?.color, 12),
                                borderLeft: `2px solid ${colorVar(subject?.color)}`,
                              }}
                            >
                              <div className="truncate text-[11px] leading-tight font-medium">
                                {subject?.name ?? 'Clase'}
                              </div>
                              <div className="text-faint truncate text-[10px] leading-tight tabular-nums">
                                {b.start}–{b.end}
                              </div>
                              {(b.room || subject?.room) && (
                                <div className="text-faint truncate text-[10px] leading-tight">
                                  {b.room ?? subject?.room}
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Lista por día — móvil */}
          <div className="flex flex-col gap-4 md:hidden">
            {days.map((day) => {
              const dayBlocks = blocks
                .filter((b) => b.weekday === day.value)
                .sort((a, b) => minutesOf(a.start) - minutesOf(b.start))
              const isToday = day.value === todayWeekday

              return (
                <section key={day.value}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <h2 className="eyebrow">
                      {day.label}
                      {isToday && (
                        <span className="ml-2 normal-case" style={{ color: 'var(--accent)' }}>
                          hoy
                        </span>
                      )}
                    </h2>
                    <button
                      onClick={() => openNew(day.value)}
                      className="text-faint text-[11px] hover:text-[color:var(--text)]"
                    >
                      Añadir
                    </button>
                  </div>

                  {dayBlocks.length === 0 ? (
                    <div className="panel text-faint px-3 py-2.5 text-[13px]">Sin clases.</div>
                  ) : (
                    <ul className="panel divide-hairline overflow-hidden">
                      {dayBlocks.map((b) => {
                        const subject = subjects.find((s) => s.id === b.subjectId)
                        return (
                          <li key={b.id}>
                            <button
                              onClick={() => openExisting(b)}
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[color:var(--surface-2)]"
                            >
                              <span
                                aria-hidden
                                className="h-7 w-[2px] shrink-0 rounded-full"
                                style={{ background: colorVar(subject?.color) }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-[13px] font-medium">
                                  {subject?.name ?? 'Clase'}
                                </div>
                                <div className="text-faint truncate text-[11px]">
                                  {subject?.teacher}
                                  {b.room || subject?.room ? ` · ${b.room ?? subject?.room}` : ''}
                                </div>
                              </div>
                              <div className="text-muted shrink-0 text-right text-[11px] tabular-nums">
                                <div>{formatTime(b.start)}</div>
                                <div className="text-faint">{formatTime(b.end)}</div>
                              </div>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </section>
              )
            })}
          </div>
        </>
      )}

      {/* La `key` remonta el formulario en cada apertura para partir de un estado limpio. */}
      <BlockEditor
        key={draft ? (draft.id ?? `nuevo-${draft.weekday}`) : 'cerrado'}
        draft={draft}
        onClose={() => setDraft(null)}
      />
    </div>
  )
}
