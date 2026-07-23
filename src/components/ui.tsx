import clsx from 'clsx'
import { X } from 'lucide-react'
import {
  useEffect,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import type { SubjectColor } from '../types'
import { colorSoft, colorVar } from '../lib/ui'

/* ---------------------------------------------------------------- Botón */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'default' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  icon?: ReactNode
}

const VARIANT_STYLE: Record<string, CSSProperties> = {
  primary: {
    background: 'var(--accent)',
    color: 'var(--accent-contrast)',
    borderColor: 'transparent',
    boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.18), 0 1px 2px rgb(0 0 0 / 0.2)',
  },
  default: {
    background: 'var(--surface-2)',
    borderColor: 'var(--border-strong)',
    boxShadow: 'inset 0 1px 0 var(--bevel)',
  },
  ghost: { background: 'transparent', borderColor: 'transparent' },
  danger: {
    background: 'transparent',
    borderColor: 'var(--border-strong)',
    color: 'var(--due-late)',
  },
}

export function Button({
  variant = 'default',
  size = 'md',
  icon,
  className,
  style,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium',
        'transition-[background-color,border-color,opacity,transform] duration-150',
        'hover:brightness-[1.08] active:scale-[0.98]',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--accent-ring)]',
        'disabled:pointer-events-none disabled:opacity-40',
        size === 'sm' ? 'h-7 px-2.5 text-[12px]' : 'h-8 px-3 text-[13px]',
        className,
      )}
      style={{ ...VARIANT_STYLE[variant], ...style }}
    >
      {icon}
      {children}
    </button>
  )
}

/* --------------------------------------------------------------- Campos */

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={clsx('block', className)}>
      <span className="mb-1.5 block text-[12px] font-medium">{label}</span>
      {children}
      {hint && <span className="text-faint mt-1.5 block text-[11px]">{hint}</span>}
    </label>
  )
}

const controlClass =
  'w-full rounded-lg border px-2.5 py-2 text-[13px] transition-colors duration-150 ' +
  'placeholder:text-[color:var(--text-faint)] ' +
  'focus:border-[color:var(--accent)] focus:outline-2 focus:outline-offset-0 ' +
  'focus:outline-[color:var(--accent-ring)]'

const controlStyle: CSSProperties = {
  background: 'var(--surface-2)',
  borderColor: 'var(--border-strong)',
}

export function Input({ className, style, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...rest} style={{ ...controlStyle, ...style }} className={clsx(controlClass, className)} />
  )
}

export function Textarea({ className, style, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...rest}
      style={{ ...controlStyle, ...style }}
      className={clsx(controlClass, 'resize-y leading-relaxed', className)}
    />
  )
}

export function Select({ className, style, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      style={{ ...controlStyle, ...style }}
      className={clsx(controlClass, 'pr-7', className)}
    >
      {children}
    </select>
  )
}

/** Tecla de atajo. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      className="rounded border px-1.5 py-0.5 font-sans text-[10px] font-medium"
      style={{
        background: 'var(--surface-3)',
        borderColor: 'var(--border-strong)',
        color: 'var(--text-faint)',
      }}
    >
      {children}
    </kbd>
  )
}

/* --------------------------------------------------------------- Modal */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="animate-fade absolute inset-0 backdrop-blur-[3px]"
        style={{ background: 'rgb(4 5 8 / 0.6)' }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx(
          'animate-sheet relative flex max-h-[92vh] w-full flex-col overflow-hidden',
          'rounded-t-2xl border sm:rounded-xl',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-md',
        )}
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border-strong)',
          boxShadow: 'var(--overlay-shadow), inset 0 1px 0 var(--bevel)',
        }}
      >
        <header className="hairline flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-[13px] font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-faint rounded-md p-1 transition-colors hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text)]"
          >
            <X size={15} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && (
          <footer
            className="hairline pb-safe flex items-center justify-end gap-2 border-t px-4 py-3"
            style={{ background: 'var(--surface-2)' }}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}

/* --------------------------------------------------- Distintivos */

/** Pastilla con punto de color: plazos, estados, conteos. */
export function Pill({
  children,
  color,
  dot = true,
  className,
}: {
  children: ReactNode
  color?: string
  dot?: boolean
  className?: string
}) {
  const c = color ?? 'var(--text-muted)'
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap',
        className,
      )}
      style={{ color: c, background: `color-mix(in oklab, ${c} 12%, transparent)` }}
    >
      {dot && (
        <span
          aria-hidden
          className="h-[5px] w-[5px] shrink-0 rounded-full"
          style={{ background: c }}
        />
      )}
      {children}
    </span>
  )
}

/** Cuadrito con las iniciales de la materia. */
export function SubjectBadge({
  name,
  color,
  size = 22,
}: {
  name: string
  color?: SubjectColor
  size?: number
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-md font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: colorSoft(color, 18),
        color: colorVar(color),
        border: `1px solid ${colorSoft(color, 30)}`,
      }}
    >
      {initials || '·'}
    </span>
  )
}

export function SubjectDot({ color, size = 7 }: { color?: SubjectColor; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, background: colorVar(color) }}
    />
  )
}

export function SubjectChip({
  name,
  color,
  className,
}: {
  name: string
  color?: SubjectColor
  className?: string
}) {
  return (
    <span
      className={clsx('inline-flex items-center gap-1.5 text-[11px] font-medium', className)}
      style={{ color: colorVar(color) }}
    >
      <SubjectDot color={color} size={6} />
      {name}
    </span>
  )
}

/* ------------------------------------------------------- Estados vacíos */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && (
        <div
          className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--text-faint)',
          }}
        >
          {icon}
        </div>
      )}
      <h3 className="text-[14px] font-semibold">{title}</h3>
      {description && (
        <p className="text-muted mt-1.5 max-w-xs text-[13px] leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ------------------------------------------------- Control segmentado */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  className?: string
}) {
  return (
    <div
      className={clsx('inline-flex rounded-lg border p-[3px]', className)}
      style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className="rounded-[6px] px-2.5 py-1 text-[12px] font-medium transition-colors duration-150"
          style={
            value === o.value
              ? {
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  boxShadow: '0 1px 2px rgb(0 0 0 / 0.18), inset 0 1px 0 var(--bevel)',
                }
              : { color: 'var(--text-faint)' }
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* -------------------------------------------------------- Confirmación */

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Eliminar',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button onClick={onCancel}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-muted text-[13px] leading-relaxed">{message}</p>
    </Modal>
  )
}

/* ------------------------------------------------------- Barra progreso */

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  return (
    <div
      className="h-[5px] w-full overflow-hidden rounded-full"
      style={{ background: 'var(--surface-3)' }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{
          width: `${Math.round(value * 100)}%`,
          background: color ?? 'var(--accent)',
        }}
      />
    </div>
  )
}
