export type SubjectColor =
  | 'indigo'
  | 'violet'
  | 'sky'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'orange'
  | 'teal'
  | 'fuchsia'
  | 'slate'

export interface Subject {
  id: string
  name: string
  teacher: string
  color: SubjectColor
  room?: string
  /** Correo o contacto del profesor, opcional. */
  contact?: string
  notes?: string
  createdAt: string
}

/** Bloque del horario semanal. weekday: 1 = lunes … 7 = domingo (ISO). */
export interface ClassBlock {
  id: string
  subjectId: string
  weekday: number
  start: string // 'HH:mm'
  end: string // 'HH:mm'
  room?: string
}

export type TaskType = 'deber' | 'examen' | 'exposicion' | 'proyecto' | 'lectura' | 'entrega'
export type TaskStatus = 'pendiente' | 'en_progreso' | 'hecha'
export type Priority = 'baja' | 'media' | 'alta'

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  subjectId: string | null
  type: TaskType
  /** Fecha de entrega/presentación en formato 'yyyy-MM-dd'. */
  dueDate: string
  /** Hora de entrega opcional, 'HH:mm'. */
  dueTime?: string
  /** Días de antelación con los que hay que empezar a prepararlo. */
  prepDays: number
  status: TaskStatus
  priority: Priority
  notes?: string
  link?: string
  subtasks: Subtask[]
  /** Calificación obtenida, si ya la entregaron corregida. */
  grade?: number | null
  /** Peso de la actividad sobre la nota final de la materia (%). */
  weight?: number | null
  createdAt: string
  completedAt?: string | null
}

export interface Note {
  id: string
  title: string
  body: string
  subjectId: string | null
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export interface Settings {
  theme: 'light' | 'dark' | 'system'
  studentName: string
  /** Días de antelación por defecto al crear una actividad. */
  defaultPrepDays: number
  /** Nota máxima de la escala (10, 20, 100…). */
  gradeScale: number
  /** Mostrar sábado y domingo en el horario. */
  showWeekend: boolean
  /** Se completó la pantalla de bienvenida. */
  onboarded: boolean
}

export interface AppData {
  version: number
  subjects: Subject[]
  blocks: ClassBlock[]
  tasks: Task[]
  notes: Note[]
  settings: Settings
}
