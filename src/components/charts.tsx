import { useState, type ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

/**
 * Duas cores, com papéis fixos: a 1 é a cor de magnitude (quanto de algo)
 * e a 2 marca o que está em aberto. Barra de contagem não ganha uma cor por
 * item — o comprimento já diz tudo, e cor por ranking mentiria.
 */
export const SERIE_MAGNITUDE = 'var(--series-1)'
export const SERIE_ABERTO = 'var(--series-2)'

const AXIS = { fill: 'var(--muted)', fontSize: 11.5 }

/* ------------------------------------------------------------ Moldura comum */

export function ChartCard({
  title,
  hint,
  legend,
  table,
  className,
  children,
}: {
  title: string
  hint?: string
  className?: string
  legend?: ReactNode
  /** Visão em tabela: obrigatória como alternativa ao canal cor. */
  table?: { headers: string[]; rows: Array<Array<string | number>> }
  children: ReactNode
}) {
  const [modo, setModo] = useState<'grafico' | 'tabela'>('grafico')
  return (
    <section className={`card flex min-w-0 flex-col${className ? ` ${className}` : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-2 px-4 pt-4">
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold leading-tight">{title}</h3>
          {hint && <p className="mt-0.5 text-[12px] text-muted">{hint}</p>}
        </div>
        {table && (
          <button
            type="button"
            onClick={() => setModo((m) => (m === 'grafico' ? 'tabela' : 'grafico'))}
            className="rounded-md border px-2 py-1 text-[11.5px] font-medium text-ink-2 hover:bg-surface-2"
            aria-pressed={modo === 'tabela'}
          >
            {modo === 'grafico' ? 'Ver tabela' : 'Ver gráfico'}
          </button>
        )}
      </div>

      {legend && <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 px-4">{legend}</div>}

      <div className="min-w-0 grow px-1.5 pt-3 pb-2">
        {modo === 'grafico' ? children : table && <DataAsTable {...table} />}
      </div>
    </section>
  )
}

function DataAsTable({ headers, rows }: { headers: string[]; rows: Array<Array<string | number>> }) {
  return (
    <div className="scroll-x max-h-[260px] overflow-auto px-2.5">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="text-left text-muted">
            {headers.map((h, i) => (
              <th key={h} className={`border-b py-1.5 font-medium ${i ? 'text-right' : ''}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row[0])}>
              {row.map((cell, i) => (
                <td
                  key={i}
                  className={`border-b py-1.5 ${i ? 'tnum text-right' : 'pr-3'}`}
                  style={{ borderColor: 'var(--line)' }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function LegendItem({ color, label, icon }: { color: string; label: string; icon?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-2">
      <span aria-hidden style={{ color }} className="text-[11px] leading-none">
        {icon ?? '●'}
      </span>
      {label}
    </span>
  )
}

/* ------------------------------------------------------------------ Tooltip */

type TipPayload = Array<{ name?: string; value?: number | string; color?: string; payload?: Record<string, unknown> }>

function TooltipBox({
  active,
  label,
  payload,
  sufixo,
}: {
  active?: boolean
  label?: string | number
  payload?: TipPayload
  sufixo?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg border px-2.5 py-2 text-[12.5px] shadow-sm"
      style={{ background: 'var(--surface)', borderColor: 'var(--line-strong)', color: 'var(--ink)' }}
    >
      <div className="mb-1 font-semibold">{label}</div>
      {payload.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span aria-hidden style={{ color: item.color }} className="text-[10px] leading-none">
            ●
          </span>
          <span className="text-ink-2">{item.name}</span>
          <span className="tnum ml-auto font-semibold">
            {item.value}
            {sufixo ? ` ${sufixo}` : ''}
          </span>
        </div>
      ))}
    </div>
  )
}

/* --------------------------------------------------- Série temporal (linha) */

export function TimeSeries({
  data,
  height = 210,
  nome = 'Chamados',
}: {
  data: Array<{ label: string; total: number }>
  height?: number
  nome?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid stroke="var(--grid)" strokeWidth={1} vertical={false} />
        <XAxis
          dataKey="label"
          tick={AXIS}
          tickLine={false}
          axisLine={{ stroke: 'var(--axis)' }}
          interval="preserveStartEnd"
          minTickGap={18}
        />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
        <Tooltip
          content={<TooltipBox />}
          cursor={{ stroke: 'var(--line-strong)', strokeWidth: 1 }}
          animationDuration={120}
        />
        <Line
          type="monotone"
          name={nome}
          dataKey="total"
          stroke="var(--series-1)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4.5, strokeWidth: 2, stroke: 'var(--surface)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

/* ------------------------------------------ Barras horizontais (magnitudes) */

export function RankedBars({
  data,
  height,
  cores,
  nome = 'Chamados',
}: {
  data: Array<{ name: string; value: number; icon?: string }>
  height?: number
  /** Uma cor por barra (categórico) ou uma única cor para todas (magnitude). */
  cores?: string[] | string
  nome?: string
}) {
  const h = height ?? Math.max(140, data.length * 34 + 26)
  const largura = Math.min(186, Math.max(74, ...data.map((d) => d.name.length * 6.6)))
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 34, left: 4, bottom: 4 }} barCategoryGap={6}>
        <CartesianGrid stroke="var(--grid)" strokeWidth={1} horizontal={false} />
        <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={AXIS}
          tickLine={false}
          axisLine={{ stroke: 'var(--axis)' }}
          width={largura}
        />
        <Tooltip content={<TooltipBox />} cursor={{ fill: 'var(--surface-2)' }} animationDuration={120} />
        <Bar name={nome} dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false}>
          {data.map((item, i) => (
            <Cell
              key={item.name}
              fill={typeof cores === 'string' ? cores : (cores?.[i] ?? SERIE_MAGNITUDE)}
              stroke="var(--surface)"
              strokeWidth={2}
            />
          ))}
          {/* rótulo direto: o valor nunca depende só da cor da barra */}
          <LabelList
            dataKey="value"
            position="right"
            offset={7}
            style={{ fill: 'var(--ink-2)', fontSize: 12, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/* -------------------------------------- Barras empilhadas (aberto/resolvido) */

export function StackedBars({
  data,
  height,
}: {
  data: Array<{ name: string; Resolvidos: number; Abertos: number }>
  height?: number
}) {
  const h = height ?? Math.max(150, data.length * 34 + 26)
  const largura = Math.min(186, Math.max(74, ...data.map((d) => d.name.length * 6.6)))
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 4 }} barCategoryGap={6}>
        <CartesianGrid stroke="var(--grid)" strokeWidth={1} horizontal={false} />
        <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={{ stroke: 'var(--axis)' }} width={largura} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: 'var(--surface-2)' }} animationDuration={120} />
        <Bar
          dataKey="Resolvidos"
          stackId="s"
          fill="var(--series-1)"
          stroke="var(--surface)"
          strokeWidth={2}
          maxBarSize={18}
          isAnimationActive={false}
        />
        <Bar
          dataKey="Abertos"
          stackId="s"
          fill="var(--series-2)"
          stroke="var(--surface)"
          strokeWidth={2}
          radius={[0, 4, 4, 0]}
          maxBarSize={18}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
