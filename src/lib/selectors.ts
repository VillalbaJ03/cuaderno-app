import type { ClassBlock, Subject, Task } from '../types'
import { daysUntil, fromKey, isoWeekday, minutesOf, shiftKey, todayKey } from './dates'
import { urgencyOf, type Urgency } from './ui'

export interface TaskView extends Task {
  daysLeft: number
  urgency: Urgency
  /** Primer día en que conviene empezar a prepararla ('yyyy-MM-dd'). */
  startDate: string
  /** Ya llegó (o pasó) el día de empezar a prepararla y sigue sin terminar. */
  shouldStart: boolean
  progress: number
  subject?: Subject
}

export function decorate(task: Task, subjects: Subject[], from: string = todayKey()): TaskView {
  const daysLeft = daysUntil(task.dueDate, from)
  const startDate = shiftKey(task.dueDate, -Math.max(0, task.prepDays))
  const done = task.status === 'hecha'
  const total = task.subtasks.length
  const completed = task.subtasks.filter((s) => s.done).length
  return {
    ...task,
    daysLeft,
    urgency: urgencyOf(daysLeft),
    startDate,
    shouldStart: !done && daysUntil(startDate, from) <= 0,
    progress: done ? 1 : total ? completed / total : task.status === 'en_progreso' ? 0.5 : 0,
    subject: subjects.find((s) => s.id === task.subjectId),
  }
}

export function decorateAll(tasks: Task[], subjects: Subject[], from?: string): TaskView[] {
  return tasks.map((t) => decorate(t, subjects, from))
}

/** Orden natural de la agenda: primero lo urgente, luego por prioridad. */
export function sortByUrgency(a: TaskView, b: TaskView): number {
  const aDone = a.status === 'hecha'
  const bDone = b.status === 'hecha'
  if (aDone !== bDone) return aDone ? 1 : -1
  if (a.daysLeft !== b.daysLeft) return a.daysLeft - b.daysLeft
  const weight = { alta: 0, media: 1, baja: 2 }
  if (weight[a.priority] !== weight[b.priority]) return weight[a.priority] - weight[b.priority]
  return (a.dueTime ?? '99:99').localeCompare(b.dueTime ?? '99:99')
}

export function pending(tasks: TaskView[]): TaskView[] {
  return tasks.filter((t) => t.status !== 'hecha')
}

/** Clases de un día concreto, ordenadas por hora. */
export function classesOn(blocks: ClassBlock[], dateKey: string): ClassBlock[] {
  const weekday = isoWeekday(fromKey(dateKey))
  return blocks
    .filter((b) => b.weekday === weekday)
    .sort((a, b) => minutesOf(a.start) - minutesOf(b.start))
}

/** Actividades que vencen en un día concreto. */
export function tasksOn(tasks: TaskView[], dateKey: string): TaskView[] {
  return tasks.filter((t) => t.dueDate === dateKey).sort(sortByUrgency)
}

/**
 * Lo que hay que ponerse a preparar hoy: no está terminado, ya entró en su
 * ventana de preparación y todavía no vence hoy (eso ya sale como "vence hoy").
 */
export function toPrepareToday(tasks: TaskView[]): TaskView[] {
  return tasks.filter((t) => t.shouldStart && t.daysLeft > 0).sort(sortByUrgency)
}

export function overdue(tasks: TaskView[]): TaskView[] {
  return tasks.filter((t) => t.status !== 'hecha' && t.daysLeft < 0).sort(sortByUrgency)
}

export interface SubjectStats {
  subject: Subject
  total: number
  done: number
  pending: number
  overdue: number
  average: number | null
}

export function subjectStats(subject: Subject, tasks: Task[], from?: string): SubjectStats {
  const mine = tasks.filter((t) => t.subjectId === subject.id)
  const graded = mine.filter((t) => typeof t.grade === 'number' && t.grade !== null)
  const totalWeight = graded.reduce((sum, t) => sum + (t.weight || 1), 0)
  const average = graded.length
    ? graded.reduce((sum, t) => sum + (t.grade as number) * (t.weight || 1), 0) / totalWeight
    : null
  return {
    subject,
    total: mine.length,
    done: mine.filter((t) => t.status === 'hecha').length,
    pending: mine.filter((t) => t.status !== 'hecha').length,
    overdue: mine.filter((t) => t.status !== 'hecha' && daysUntil(t.dueDate, from) < 0).length,
    average,
  }
}
