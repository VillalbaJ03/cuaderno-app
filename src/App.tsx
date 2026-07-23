import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { TaskEditorProvider } from './components/TaskEditor'
import Ajustes from './pages/Ajustes'
import Bienvenida from './pages/Bienvenida'
import Calendario from './pages/Calendario'
import Hoy from './pages/Hoy'
import Horario from './pages/Horario'
import Materias from './pages/Materias'
import Notas from './pages/Notas'
import Tareas from './pages/Tareas'
import { AppProvider, useApp } from './store'

/** Aplica el tema también fuera del Layout (por ejemplo en la bienvenida). */
function ThemeSync() {
  const { settings } = useApp()
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () =>
      document.documentElement.classList.toggle(
        'dark',
        settings.theme === 'dark' || (settings.theme === 'system' && media.matches),
      )
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [settings.theme])
  return null
}

function Rutas() {
  const { settings } = useApp()

  if (!settings.onboarded) return <Bienvenida />

  return (
    <TaskEditorProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/hoy" replace />} />
          <Route path="/hoy" element={<Hoy />} />
          <Route path="/tareas" element={<Tareas />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/horario" element={<Horario />} />
          <Route path="/materias" element={<Materias />} />
          <Route path="/notas" element={<Notas />} />
          <Route path="/ajustes" element={<Ajustes />} />
          <Route path="*" element={<Navigate to="/hoy" replace />} />
        </Route>
      </Routes>
    </TaskEditorProvider>
  )
}

export default function App() {
  return (
    <AppProvider>
      <ThemeSync />
      <HashRouter>
        <Rutas />
      </HashRouter>
    </AppProvider>
  )
}
