import clsx from 'clsx'
import {
  CalendarDays,
  CalendarRange,
  CheckSquare,
  Clock3,
  Cog,
  FileText,
  Library,
  Moon,
  MoreHorizontal,
  Plus,
  Search,
  Sun,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../store'
import CommandPalette from './CommandPalette'
import { useTaskEditor } from './TaskEditor'
import { Kbd, Modal } from './ui'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
}

const PLANNING: NavItem[] = [
  { to: '/hoy', label: 'Hoy', icon: <CalendarDays size={15} /> },
  { to: '/tareas', label: 'Actividades', icon: <CheckSquare size={15} /> },
  { to: '/calendario', label: 'Calendario', icon: <CalendarRange size={15} /> },
  { to: '/horario', label: 'Horario', icon: <Clock3 size={15} /> },
]

const LIBRARY: NavItem[] = [
  { to: '/materias', label: 'Materias', icon: <Library size={15} /> },
  { to: '/notas', label: 'Notas', icon: <FileText size={15} /> },
  { to: '/ajustes', label: 'Ajustes', icon: <Cog size={15} /> },
]

const ALL_NAV = [...PLANNING, ...LIBRARY]
const MOBILE_NAV = PLANNING

function useTheme() {
  const { settings, updateSettings } = useApp()
  const isDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', isDark ? '#08090c' : '#fafafb')
  }, [isDark])

  return { isDark, toggle: () => updateSettings({ theme: isDark ? 'light' : 'dark' }) }
}

function NavItemLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          'group relative flex h-[34px] items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors duration-150',
          isActive
            ? 'font-medium'
            : 'text-muted hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)]',
        )
      }
      style={({ isActive }) =>
        isActive
          ? {
              background: 'var(--surface-2)',
              boxShadow: 'inset 0 1px 0 var(--bevel)',
            }
          : undefined
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              aria-hidden
              className="absolute top-1/2 -left-3 h-4 w-[3px] -translate-y-1/2 rounded-r-full"
              style={{ background: 'var(--accent)' }}
            />
          )}
          <span
            className="shrink-0 transition-colors"
            style={isActive ? { color: 'var(--accent)' } : undefined}
          >
            {item.icon}
          </span>
          {item.label}
        </>
      )}
    </NavLink>
  )
}

export default function Layout() {
  const { isDark, toggle } = useTheme()
  const { openTaskEditor } = useTaskEditor()
  const [moreOpen, setMoreOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMoreOpen(false)
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const moreActive = LIBRARY.some((i) => location.pathname.startsWith(i.to))
  const current = ALL_NAV.find((i) => location.pathname.startsWith(i.to))

  return (
    <div className="flex min-h-full">
      {/* Barra lateral — escritorio */}
      <aside
        className="hairline sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col border-r px-3 py-4 lg:flex"
        style={{ background: 'color-mix(in oklab, var(--surface) 70%, transparent)' }}
      >
        <div className="flex items-center gap-2.5 px-2 pb-4">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-bold"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
              boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.22), 0 2px 8px -2px var(--accent-ring)',
            }}
          >
            C
          </span>
          <span className="text-[14px] font-semibold">Cuaderno</span>
        </div>

        <button
          onClick={() => setPaletteOpen(true)}
          className="hairline text-faint mb-2 flex h-8 items-center gap-2 rounded-lg border px-2.5 text-[12px] transition-colors hover:bg-[color:var(--surface-2)]"
          style={{ background: 'var(--surface-2)' }}
        >
          <Search size={14} />
          <span className="flex-1 text-left">Buscar</span>
          <Kbd>Ctrl K</Kbd>
        </button>

        <button
          onClick={() => openTaskEditor()}
          className="mb-5 flex h-8 items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium transition-transform active:scale-[0.98]"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-contrast)',
            boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.2), 0 4px 14px -6px var(--accent-ring)',
          }}
        >
          <Plus size={15} />
          Nueva actividad
        </button>

        <nav className="flex flex-1 flex-col gap-0.5">
          <div className="eyebrow px-2.5 pb-1.5">Planificación</div>
          {PLANNING.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}

          <div className="eyebrow px-2.5 pt-4 pb-1.5">Tu material</div>
          {LIBRARY.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
        </nav>

        <button
          onClick={toggle}
          className="text-muted flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)]"
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
          {isDark ? 'Tema claro' : 'Tema oscuro'}
        </button>
      </aside>

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Cabecera — móvil */}
        <header
          className="hairline sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b px-4 backdrop-blur-xl lg:hidden"
          style={{ background: 'color-mix(in oklab, var(--app-bg) 82%, transparent)' }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-bold"
              style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
            >
              C
            </span>
            <h1 className="text-[14px] font-semibold">{current?.label ?? 'Cuaderno'}</h1>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPaletteOpen(true)}
              aria-label="Buscar"
              className="text-muted rounded-lg p-2 transition-colors hover:bg-[color:var(--surface-2)]"
            >
              <Search size={17} />
            </button>
            <button
              onClick={toggle}
              aria-label="Cambiar tema"
              className="text-muted rounded-lg p-2 transition-colors hover:bg-[color:var(--surface-2)]"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 sm:px-8 lg:pt-8 lg:pb-14">
          <Outlet />
        </main>
      </div>

      {/* Acción rápida — móvil */}
      <button
        onClick={() => openTaskEditor()}
        aria-label="Nueva actividad"
        className="fixed right-4 bottom-[76px] z-40 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform active:scale-95 lg:hidden"
        style={{
          background: 'var(--accent)',
          color: 'var(--accent-contrast)',
          boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.22), 0 10px 28px -8px var(--accent-ring)',
        }}
      >
        <Plus size={22} />
      </button>

      {/* Navegación inferior — móvil */}
      <nav
        className="hairline pb-safe fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t backdrop-blur-xl lg:hidden"
        style={{ background: 'color-mix(in oklab, var(--app-bg) 88%, transparent)' }}
      >
        {MOBILE_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'relative flex flex-col items-center gap-1 pt-2.5 pb-1.5 text-[10px] transition-colors',
                isActive ? 'font-medium' : 'text-faint',
              )
            }
            style={({ isActive }) => (isActive ? { color: 'var(--accent)' } : undefined)}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute top-0 h-[2px] w-8 rounded-b-full"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
                {item.icon}
                {item.label}
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className={clsx(
            'flex flex-col items-center gap-1 pt-2.5 pb-1.5 text-[10px] transition-colors',
            moreActive ? 'font-medium' : 'text-faint',
          )}
          style={moreActive ? { color: 'var(--accent)' } : undefined}
        >
          <MoreHorizontal size={15} />
          Más
        </button>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Tu material">
        <div className="flex flex-col gap-0.5">
          {LIBRARY.map((item) => (
            <NavItemLink key={item.to} item={item} onClick={() => setMoreOpen(false)} />
          ))}
        </div>
      </Modal>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
