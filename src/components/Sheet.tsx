import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

/** Casca da planilha: rolagem horizontal própria + cabeçalho fixo. */
export function Sheet({
  children,
  maxHeight = 'calc(100vh - 260px)',
  minWidth = 1180,
}: {
  children: ReactNode
  maxHeight?: string
  minWidth?: number
}) {
  return (
    <div className="scroll-x overflow-auto rounded-xl border" style={{ maxHeight, borderColor: 'var(--line)' }}>
      <table className="w-full border-separate border-spacing-0 text-[13px]" style={{ minWidth }}>
        {children}
      </table>
    </div>
  )
}

/** Faixa de agrupamento das colunas (como as mescladas da planilha). */
export function GroupRow({ groups }: { groups: Array<{ label: string; span: number; tone?: string }> }) {
  return (
    <tr>
      {groups.map((g, i) => (
        <th
          key={`${g.label}-${i}`}
          colSpan={g.span}
          className="sticky top-0 z-20 border-b border-r px-3 py-1.5 text-[11px] font-semibold tracking-wide uppercase"
          style={{
            background: g.tone ?? 'var(--brand)',
            color: 'var(--brand-ink)',
            borderColor: 'var(--line)',
          }}
        >
          {g.label}
        </th>
      ))}
    </tr>
  )
}

export function Th({
  children,
  className,
  align = 'left',
  width,
  top = 0,
  title,
}: {
  children: ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
  width?: number
  top?: number
  title?: string
}) {
  return (
    <th
      scope="col"
      title={title}
      style={{
        top,
        width,
        minWidth: width,
        background: 'var(--brand-2)',
        color: 'var(--brand-ink)',
        borderColor: 'var(--line)',
      }}
      className={cn(
        'sticky z-10 border-b px-3 py-2 text-[12px] font-semibold whitespace-nowrap',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        align === 'left' && 'text-left',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function Tr({
  children,
  zebra,
  tone,
}: {
  children: ReactNode
  zebra?: boolean
  /** Realce da linha inteira (ex.: resolvido / atrasado). */
  tone?: string
}) {
  return (
    <tr
      className="group"
      style={{ background: tone ?? (zebra ? 'var(--surface-2)' : 'var(--surface)') }}
    >
      {children}
    </tr>
  )
}

export function Td({
  children,
  className,
  align = 'left',
  title,
}: {
  children: ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
  title?: string
}) {
  return (
    <td
      title={title}
      style={{ borderColor: 'var(--line)' }}
      className={cn(
        'border-b px-2 py-1.5 align-middle',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className,
      )}
    >
      {children}
    </td>
  )
}
