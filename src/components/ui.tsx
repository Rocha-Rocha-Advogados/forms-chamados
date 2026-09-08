import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '../lib/utils'

/* ------------------------------------------------------------------ Cartões */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('card', className)}>{children}</section>
}

export function SectionTitle({
  title,
  hint,
  right,
}: {
  title: string
  hint?: string
  right?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-4 pb-3">
      <div>
        <h2 className="text-[15px] font-semibold leading-tight">{title}</h2>
        {hint && <p className="mt-0.5 text-[12.5px] text-muted">{hint}</p>}
      </div>
      {right}
    </div>
  )
}

/* ------------------------------------------------- Número em destaque (KPI) */

export function StatTile({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string
  value: string | number
  hint?: string
  accent?: string
  icon?: string
}) {
  return (
    <div className="card px-4 py-3.5">
      <div className="flex items-center gap-2">
        {accent &&
          (icon ? (
            <span aria-hidden className="shrink-0 text-[12px] leading-none" style={{ color: accent }}>
              {icon}
            </span>
          ) : (
            <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: accent }} />
          ))}
        <span className="text-[12.5px] font-medium text-ink-2">{label}</span>
      </div>
      <div className="mt-1.5 text-[27px] font-semibold leading-none">{value}</div>
      {hint && <p className="mt-1 text-[12px] text-muted">{hint}</p>}
    </div>
  )
}

/* ----------------------------------------------------------------- Etiquetas */

export function Badge({
  children,
  color,
  icon,
  subtle,
}: {
  children: ReactNode
  color?: string
  icon?: string
  subtle?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-medium whitespace-nowrap',
        subtle ? 'text-ink-2' : 'text-ink',
      )}
      style={{
        background: 'var(--surface-2)',
        border: `1px solid ${color ?? 'var(--line)'}`,
      }}
    >
      {(icon || color) && (
        <span aria-hidden style={{ color: color ?? 'var(--muted)' }} className="text-[11px] leading-none">
          {icon ?? '●'}
        </span>
      )}
      {children}
    </span>
  )
}

/** Progresso do checklist: barra + fração (o texto carrega o sentido, não a cor). */
export function ProgressPill({ done, total }: { done: number; total: number }) {
  const completo = done === total && total > 0
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full"
        style={{ background: 'var(--surface-3)' }}
        role="img"
        aria-label={`${done} de ${total} etapas concluídas`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-200"
          style={{
            width: `${total ? (done / total) * 100 : 0}%`,
            background: completo ? 'var(--good)' : 'var(--series-1)',
          }}
        />
      </div>
      <span className="tnum text-[12px] font-medium text-ink-2">
        {completo ? 'Concluído' : `${done}/${total}`}
      </span>
    </div>
  )
}

/* ---------------------------------------------------------------- Formulário */

export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium">
        {label}
        {required && (
          <span className="ml-1" style={{ color: 'var(--critical)' }}>
            *
          </span>
        )}
      </span>
      {hint && <span className="mb-1.5 block text-[12px] text-muted">{hint}</span>}
      {children}
      {error && (
        <span className="mt-1 block text-[12px]" style={{ color: 'var(--critical)' }}>
          {error}
        </span>
      )}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn('field', props.className)} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn('field resize-y', props.className)} />
}

export function SelectInput({
  options,
  placeholder,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { options: readonly string[]; placeholder?: string }) {
  return (
    <select {...props} className={cn('field', props.className)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.filter(Boolean).map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  )
}

/** Rádio em cartão — o alvo de clique é a linha inteira, como no Forms. */
export function RadioCards({
  name,
  value,
  options,
  onChange,
}: {
  name: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-2">
      {options.map((opt) => {
        const ativo = value === opt
        return (
          <label
            key={opt}
            className={cn(
              'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors',
              ativo ? 'bg-surface-2' : 'bg-surface hover:bg-surface-2',
            )}
            style={{ borderColor: ativo ? 'var(--series-1)' : 'var(--line)' }}
          >
            <input
              type="radio"
              name={name}
              value={opt}
              checked={ativo}
              onChange={() => onChange(opt)}
              className="size-4 accent-[var(--series-1)]"
            />
            <span className="text-[13.5px]">{opt}</span>
          </label>
        )
      })}
    </div>
  )
}

export function Check({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <label className="inline-flex cursor-pointer items-center justify-center p-1" title={label}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="size-4 cursor-pointer accent-[var(--good)]"
      />
    </label>
  )
}

/* ------------------------------------------------------------------- Estados */

export function Spinner({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-14 text-[13px] text-muted">
      <span
        aria-hidden
        className="size-4 animate-spin rounded-full border-2"
        style={{ borderColor: 'var(--line-strong)', borderTopColor: 'var(--series-1)' }}
      />
      {label}
    </div>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-4 py-14 text-center">
      <p className="text-[14px] font-medium">{title}</p>
      {hint && <p className="mt-1 text-[12.5px] text-muted">{hint}</p>}
    </div>
  )
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-[13px]"
      style={{ borderColor: 'var(--critical)', background: 'color-mix(in srgb, var(--critical) 8%, var(--surface))' }}
    >
      <span>
        <strong className="mr-1.5" style={{ color: 'var(--critical)' }}>
          ⚠ Erro
        </strong>
        {message}
      </span>
      {onRetry && (
        <button type="button" className="btn btn-ghost" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  )
}
