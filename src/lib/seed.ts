import type { AppData } from '../types'
import { shiftKey, todayKey } from './dates'
import { uid } from './ui'

export const DEFAULT_SETTINGS: AppData['settings'] = {
  theme: 'dark',
  studentName: '',
  defaultPrepDays: 1,
  gradeScale: 10,
  showWeekend: false,
  onboarded: false,
  lastBackupAt: null,
  backupSnoozedUntil: null,
  persistenceRequested: false,
}

export function emptyData(): AppData {
  return {
    version: 1,
    subjects: [],
    blocks: [],
    tasks: [],
    notes: [],
    settings: { ...DEFAULT_SETTINGS },
  }
}

/** Datos de ejemplo para ver la app funcionando desde el primer minuto. */
export function sampleData(): AppData {
  const now = new Date().toISOString()
  const today = todayKey()

  const mate = { id: uid(), name: 'Matemáticas', teacher: 'Ing. Laura Méndez', color: 'indigo' as const, room: 'A-201', createdAt: now }
  const quim = { id: uid(), name: 'Química', teacher: 'Lic. Andrés Peña', color: 'emerald' as const, room: 'Lab 3', createdAt: now }
  const hist = { id: uid(), name: 'Historia', teacher: 'Mg. Carmen Ruiz', color: 'amber' as const, room: 'B-105', createdAt: now }
  const ingl = { id: uid(), name: 'Inglés', teacher: 'Prof. Mark Davies', color: 'sky' as const, room: 'C-12', createdAt: now }

  return {
    version: 1,
    subjects: [mate, quim, hist, ingl],
    blocks: [
      { id: uid(), subjectId: mate.id, weekday: 1, start: '07:00', end: '08:40', room: 'A-201' },
      { id: uid(), subjectId: ingl.id, weekday: 1, start: '09:00', end: '10:30', room: 'C-12' },
      { id: uid(), subjectId: quim.id, weekday: 2, start: '08:00', end: '09:40', room: 'Lab 3' },
      { id: uid(), subjectId: hist.id, weekday: 3, start: '07:00', end: '08:40', room: 'B-105' },
      { id: uid(), subjectId: mate.id, weekday: 4, start: '10:00', end: '11:40', room: 'A-201' },
      { id: uid(), subjectId: quim.id, weekday: 5, start: '09:00', end: '10:40', room: 'Lab 3' },
      { id: uid(), subjectId: hist.id, weekday: 5, start: '11:00', end: '12:30', room: 'B-105' },
    ],
    tasks: [
      {
        id: uid(),
        title: 'Exposición: tabla periódica y enlaces químicos',
        subjectId: quim.id,
        type: 'exposicion',
        dueDate: shiftKey(today, 2),
        dueTime: '09:00',
        prepDays: 2,
        status: 'en_progreso',
        priority: 'alta',
        notes: 'En parejas, 10 minutos. Hay que entregar las diapositivas impresas.',
        subtasks: [
          { id: uid(), title: 'Investigar y reunir fuentes', done: true },
          { id: uid(), title: 'Armar las diapositivas', done: false },
          { id: uid(), title: 'Ensayar en voz alta', done: false },
        ],
        grade: null,
        weight: 20,
        createdAt: now,
        completedAt: null,
      },
      {
        id: uid(),
        title: 'Ejercicios 12 al 30 — funciones cuadráticas',
        subjectId: mate.id,
        type: 'deber',
        dueDate: shiftKey(today, 1),
        prepDays: 1,
        status: 'pendiente',
        priority: 'media',
        notes: 'Páginas 88 y 89 del libro.',
        subtasks: [],
        grade: null,
        weight: 5,
        createdAt: now,
        completedAt: null,
      },
      {
        id: uid(),
        title: 'Examen parcial: Revolución Industrial',
        subjectId: hist.id,
        type: 'examen',
        dueDate: shiftKey(today, 6),
        dueTime: '07:00',
        prepDays: 4,
        status: 'pendiente',
        priority: 'alta',
        notes: 'Entra desde el capítulo 4 hasta el 7.',
        subtasks: [
          { id: uid(), title: 'Resumir capítulos 4 y 5', done: false },
          { id: uid(), title: 'Hacer fichas de fechas clave', done: false },
        ],
        grade: null,
        weight: 30,
        createdAt: now,
        completedAt: null,
      },
      {
        id: uid(),
        title: 'Essay: My favorite city (300 palabras)',
        subjectId: ingl.id,
        type: 'entrega',
        dueDate: shiftKey(today, -1),
        prepDays: 1,
        status: 'pendiente',
        priority: 'media',
        notes: 'Subir al aula virtual.',
        subtasks: [],
        grade: null,
        weight: 10,
        createdAt: now,
        completedAt: null,
      },
      {
        id: uid(),
        title: 'Lectura: capítulo 3 del libro guía',
        subjectId: mate.id,
        type: 'lectura',
        dueDate: shiftKey(today, -6),
        prepDays: 1,
        status: 'hecha',
        priority: 'baja',
        subtasks: [],
        grade: 9,
        weight: 5,
        createdAt: now,
        completedAt: now,
      },
    ],
    notes: [
      {
        id: uid(),
        title: 'Idea para el proyecto de Química',
        body: 'Usar ejemplos de la cocina para explicar los enlaces: sal, agua y aceite. Preguntar al profe si se puede llevar una demostración.',
        subjectId: quim.id,
        pinned: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid(),
        title: 'Recordatorios sueltos',
        body: '• Pedir apuntes de la clase del martes.\n• El profe de Historia sube el material los domingos.\n• Traer calculadora científica los jueves.',
        subjectId: null,
        pinned: false,
        createdAt: now,
        updatedAt: now,
      },
    ],
    settings: { ...DEFAULT_SETTINGS, studentName: '', onboarded: true },
  }
}
