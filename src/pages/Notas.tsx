import { Pin, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  SubjectChip,
  Textarea,
} from '../components/ui'
import { useApp } from '../store'
import type { Note } from '../types'

interface NoteDraft {
  id?: string
  title: string
  body: string
  subjectId: string | null
  pinned: boolean
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'ayer'
  if (d < 30) return `hace ${d} días`
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

export default function Notas() {
  const { notes, subjects, addNote, updateNote, removeNote } = useApp()
  const [draft, setDraft] = useState<NoteDraft | null>(null)
  const [query, setQuery] = useState('')
  const [confirm, setConfirm] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return notes
      .filter((n) => !q || `${n.title} ${n.body}`.toLowerCase().includes(q))
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return b.updatedAt.localeCompare(a.updatedAt)
      })
  }, [notes, query])

  function save() {
    if (!draft || (!draft.title.trim() && !draft.body.trim())) return
    const payload = {
      title: draft.title.trim() || 'Sin título',
      body: draft.body,
      subjectId: draft.subjectId,
      pinned: draft.pinned,
    }
    if (draft.id) updateNote(draft.id, payload)
    else addNote(payload)
    setDraft(null)
  }

  function openNote(note: Note) {
    setDraft({
      id: note.id,
      title: note.title,
      body: note.body,
      subjectId: note.subjectId,
      pinned: note.pinned,
    })
  }

  const nueva = () => setDraft({ title: '', body: '', subjectId: null, pinned: false })

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight">Notas</h1>
        <Button icon={<Plus size={15} />} onClick={nueva}>
          Nueva nota
        </Button>
      </header>

      {notes.length > 0 && (
        <div className="relative max-w-sm">
          <Search
            size={14}
            className="text-faint pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en tus notas"
            className="pl-8"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="panel">
          <EmptyState
            title={notes.length === 0 ? 'Aún no hay notas' : 'Sin resultados'}
            description={
              notes.length === 0
                ? 'Apunta ideas para un trabajo, recordatorios del profesor o cualquier cosa suelta.'
                : 'Prueba con otras palabras.'
            }
            action={
              notes.length === 0 ? (
                <Button variant="primary" icon={<Plus size={15} />} onClick={nueva}>
                  Escribir una nota
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((note) => {
            const subject = subjects.find((s) => s.id === note.subjectId)
            return (
              <article
                key={note.id}
                className="panel group flex min-h-[140px] flex-col p-3 transition-colors hover:bg-[color:var(--surface-2)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => openNote(note)} className="min-w-0 flex-1 text-left">
                    <h2 className="truncate text-[13px] font-medium">{note.title}</h2>
                  </button>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      onClick={() => updateNote(note.id, { pinned: !note.pinned })}
                      aria-label={note.pinned ? 'Quitar de fijadas' : 'Fijar nota'}
                      className="rounded p-1 transition-colors hover:bg-[color:var(--surface-3)]"
                      style={{ color: note.pinned ? 'var(--accent)' : 'var(--text-faint)' }}
                    >
                      <Pin size={13} fill={note.pinned ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => setConfirm(note.id)}
                      aria-label="Eliminar nota"
                      className="text-faint touch-visible rounded p-1 opacity-0 transition-all group-hover:opacity-100 hover:bg-[color:var(--surface-3)] focus:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <button onClick={() => openNote(note)} className="mt-1.5 flex-1 text-left">
                  <p className="text-muted line-clamp-4 text-[12px] leading-relaxed whitespace-pre-wrap">
                    {note.body}
                  </p>
                </button>

                <div className="hairline mt-3 flex items-center justify-between gap-2 border-t pt-2">
                  {subject ? <SubjectChip name={subject.name} color={subject.color} /> : <span />}
                  <span className="text-faint text-[11px]">{relativeTime(note.updatedAt)}</span>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Editar nota' : 'Nueva nota'}
        footer={
          <>
            <Button onClick={() => setDraft(null)}>Cancelar</Button>
            <Button variant="primary" onClick={save}>
              Guardar
            </Button>
          </>
        }
      >
        {draft && (
          <div className="flex flex-col gap-4">
            <Field label="Título">
              <Input
                autoFocus
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Idea para el proyecto de Química"
              />
            </Field>

            <Field label="Contenido">
              <Textarea
                rows={9}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              />
            </Field>

            <Field label="Materia relacionada">
              <Select
                value={draft.subjectId ?? ''}
                onChange={(e) => setDraft({ ...draft, subjectId: e.target.value || null })}
              >
                <option value="">Ninguna</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>

            <label className="flex cursor-pointer items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={draft.pinned}
                onChange={(e) => setDraft({ ...draft, pinned: e.target.checked })}
                className="h-3.5 w-3.5"
                style={{ accentColor: 'var(--accent)' }}
              />
              Fijar arriba
            </label>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirm !== null}
        title="Eliminar nota"
        message="Esta nota se borrará definitivamente."
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) removeNote(confirm)
          setConfirm(null)
        }}
      />
    </div>
  )
}
