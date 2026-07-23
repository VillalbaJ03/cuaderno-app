import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppData, ClassBlock, Note, Settings, Subject, Task } from './types'
import { emptyData, DEFAULT_SETTINGS } from './lib/seed'
import { uid } from './lib/ui'

const STORAGE_KEY = 'cuaderno.data.v1'

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData()
    const parsed = JSON.parse(raw) as Partial<AppData>
    return {
      version: 1,
      subjects: parsed.subjects ?? [],
      blocks: parsed.blocks ?? [],
      tasks: (parsed.tasks ?? []).map((t) => ({ ...t, subtasks: t.subtasks ?? [] })),
      notes: parsed.notes ?? [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    }
  } catch {
    return emptyData()
  }
}

function save(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* almacenamiento lleno o bloqueado: la app sigue funcionando en memoria */
  }
}

interface AppContextValue {
  data: AppData
  subjects: Subject[]
  blocks: ClassBlock[]
  tasks: Task[]
  notes: Note[]
  settings: Settings

  addSubject: (s: Omit<Subject, 'id' | 'createdAt'>) => Subject
  updateSubject: (id: string, patch: Partial<Subject>) => void
  removeSubject: (id: string) => void

  addBlock: (b: Omit<ClassBlock, 'id'>) => void
  updateBlock: (id: string, patch: Partial<ClassBlock>) => void
  removeBlock: (id: string) => void

  addTask: (t: Omit<Task, 'id' | 'createdAt'>) => Task
  updateTask: (id: string, patch: Partial<Task>) => void
  removeTask: (id: string) => void
  cycleTaskStatus: (id: string) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  addSubtask: (taskId: string, title: string) => void
  removeSubtask: (taskId: string, subtaskId: string) => void

  addNote: (n: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note
  updateNote: (id: string, patch: Partial<Note>) => void
  removeNote: (id: string) => void

  updateSettings: (patch: Partial<Settings>) => void
  replaceAll: (data: AppData) => void
  subjectById: (id: string | null | undefined) => Subject | undefined
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => load())

  useEffect(() => {
    save(data)
  }, [data])

  // Mantiene sincronizadas varias pestañas abiertas del mismo navegador.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY && e.newValue) setData(load())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const patch = useCallback((fn: (d: AppData) => AppData) => setData((d) => fn(d)), [])

  const value = useMemo<AppContextValue>(() => {
    const now = () => new Date().toISOString()

    return {
      data,
      subjects: data.subjects,
      blocks: data.blocks,
      tasks: data.tasks,
      notes: data.notes,
      settings: data.settings,

      addSubject: (s) => {
        const subject: Subject = { ...s, id: uid(), createdAt: now() }
        patch((d) => ({ ...d, subjects: [...d.subjects, subject] }))
        return subject
      },
      updateSubject: (id, p) =>
        patch((d) => ({
          ...d,
          subjects: d.subjects.map((s) => (s.id === id ? { ...s, ...p } : s)),
        })),
      removeSubject: (id) =>
        patch((d) => ({
          ...d,
          subjects: d.subjects.filter((s) => s.id !== id),
          blocks: d.blocks.filter((b) => b.subjectId !== id),
          tasks: d.tasks.map((t) => (t.subjectId === id ? { ...t, subjectId: null } : t)),
          notes: d.notes.map((n) => (n.subjectId === id ? { ...n, subjectId: null } : n)),
        })),

      addBlock: (b) => patch((d) => ({ ...d, blocks: [...d.blocks, { ...b, id: uid() }] })),
      updateBlock: (id, p) =>
        patch((d) => ({ ...d, blocks: d.blocks.map((b) => (b.id === id ? { ...b, ...p } : b)) })),
      removeBlock: (id) => patch((d) => ({ ...d, blocks: d.blocks.filter((b) => b.id !== id) })),

      addTask: (t) => {
        const task: Task = { ...t, id: uid(), createdAt: now() }
        patch((d) => ({ ...d, tasks: [...d.tasks, task] }))
        return task
      },
      updateTask: (id, p) =>
        patch((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...p } : t)) })),
      removeTask: (id) => patch((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) })),

      cycleTaskStatus: (id) =>
        patch((d) => ({
          ...d,
          tasks: d.tasks.map((t) => {
            if (t.id !== id) return t
            const next =
              t.status === 'pendiente'
                ? 'en_progreso'
                : t.status === 'en_progreso'
                  ? 'hecha'
                  : 'pendiente'
            return { ...t, status: next, completedAt: next === 'hecha' ? now() : null }
          }),
        })),

      toggleSubtask: (taskId, subtaskId) =>
        patch((d) => ({
          ...d,
          tasks: d.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.map((s) =>
                    s.id === subtaskId ? { ...s, done: !s.done } : s,
                  ),
                }
              : t,
          ),
        })),

      addSubtask: (taskId, title) =>
        patch((d) => ({
          ...d,
          tasks: d.tasks.map((t) =>
            t.id === taskId
              ? { ...t, subtasks: [...t.subtasks, { id: uid(), title, done: false }] }
              : t,
          ),
        })),

      removeSubtask: (taskId, subtaskId) =>
        patch((d) => ({
          ...d,
          tasks: d.tasks.map((t) =>
            t.id === taskId ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) } : t,
          ),
        })),

      addNote: (n) => {
        const note: Note = { ...n, id: uid(), createdAt: now(), updatedAt: now() }
        patch((d) => ({ ...d, notes: [...d.notes, note] }))
        return note
      },
      updateNote: (id, p) =>
        patch((d) => ({
          ...d,
          notes: d.notes.map((n) => (n.id === id ? { ...n, ...p, updatedAt: now() } : n)),
        })),
      removeNote: (id) => patch((d) => ({ ...d, notes: d.notes.filter((n) => n.id !== id) })),

      updateSettings: (p) => patch((d) => ({ ...d, settings: { ...d.settings, ...p } })),
      replaceAll: (next) => setData(next),
      subjectById: (id) => data.subjects.find((s) => s.id === id),
    }
  }, [data, patch])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>')
  return ctx
}
