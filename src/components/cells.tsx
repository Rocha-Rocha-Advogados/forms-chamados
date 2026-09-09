import { useEffect, useRef, useState } from 'react'
import { cn } from '../lib/utils'
import { tarefaFeita } from '../lib/options'

/**
 * Célula de texto: mantém o que está sendo digitado e só grava no blur/Enter.
 * Se a linha for atualizada por outra pessoa (realtime), o valor externo volta.
 */
export function CellText({
  value,
  onCommit,
  placeholder = '—',
  list,
  className,
  type = 'text',
  ariaLabel,
}: {
  value: string | null
  onCommit: (value: string | null) => void
  placeholder?: string
  list?: string
  className?: string
  type?: 'text' | 'date' | 'email'
  ariaLabel: string
}) {
  const [rascunho, setRascunho] = useState(value ?? '')
  const [focado, setFocado] = useState(false)

  useEffect(() => {
    if (!focado) setRascunho(value ?? '')
  }, [value, focado])

  const commit = () => {
    const limpo = rascunho.trim()
    if ((limpo || null) !== (value || null)) onCommit(limpo || null)
  }

  return (
    <input
      type={type}
      list={list}
      aria-label={ariaLabel}
      title={focado ? undefined : (value ?? '')}
      className={cn('cell', className)}
      placeholder={placeholder}
      value={rascunho}
      onChange={(e) => setRascunho(e.target.value)}
      onFocus={() => setFocado(true)}
      onBlur={() => {
        setFocado(false)
        commit()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') {
          setRascunho(value ?? '')
          e.currentTarget.blur()
        }
      }}
    />
  )
}

/** Célula de status: o texto é o dado; a cor só reforça o estado concluído. */
export function CellStatus({
  value,
  options,
  onCommit,
  ariaLabel,
}: {
  value: string | null
  options: readonly string[]
  onCommit: (value: string | null) => void
  ariaLabel: string
}) {
  const feito = tarefaFeita(value)
  const vazio = !(value || '').trim()
  return (
    <select
      aria-label={ariaLabel}
      className="cell cursor-pointer"
      value={value ?? ''}
      onChange={(e) => onCommit(e.target.value || null)}
      style={{
        color: vazio ? 'var(--muted)' : feito ? 'var(--good)' : 'var(--ink)',
        fontWeight: feito ? 600 : 400,
      }}
    >
      {options.map((opt) => (
        <option key={opt || 'vazio'} value={opt} style={{ color: 'var(--ink)', fontWeight: 400 }}>
          {opt || '—'}
        </option>
      ))}
    </select>
  )
}

/**
 * Célula de texto longo (observações): mostra uma linha e cresce para cinco
 * ao receber o foco, empurrando a linha da planilha. Cresce no lugar, sem
 * flutuar, para não ser recortada pela rolagem da tabela.
 */
export function CellLong({
  value,
  onCommit,
  placeholder = '—',
  ariaLabel,
}: {
  value: string | null
  onCommit: (value: string | null) => void
  placeholder?: string
  ariaLabel: string
}) {
  const [rascunho, setRascunho] = useState(value ?? '')
  const [focado, setFocado] = useState(false)

  useEffect(() => {
    if (!focado) setRascunho(value ?? '')
  }, [value, focado])

  const commit = () => {
    const limpo = rascunho.trim()
    if ((limpo || null) !== (value || null)) onCommit(limpo || null)
  }

  return (
    <textarea
      aria-label={ariaLabel}
      title={focado ? undefined : (value ?? '')}
      className={cn('cell resize-none leading-snug', !focado && 'overflow-hidden')}
      rows={focado ? 5 : 1}
      // altura travada quando recolhida, senão sobra um pedaço da 2ª linha
      style={focado ? undefined : { height: 30 }}
      placeholder={placeholder}
      value={rascunho}
      onChange={(e) => setRascunho(e.target.value)}
      onFocus={() => setFocado(true)}
      onBlur={() => {
        setFocado(false)
        commit()
      }}
      onKeyDown={(e) => {
        // Enter quebra linha; Ctrl/Cmd+Enter grava; Esc descarta
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) e.currentTarget.blur()
        if (e.key === 'Escape') {
          setRascunho(value ?? '')
          e.currentTarget.blur()
        }
      }}
    />
  )
}

/**
 * Descrição do chamado na planilha: duas linhas, e o resto abre no clique.
 * O "ver mais" só aparece quando existe texto escondido — medido no próprio
 * elemento, porque o corte depende da largura da coluna. Enquanto está
 * aberto a medição para, senão o botão sumiria justo quando é "ver menos".
 */
export function TextoExpansivel({ texto, linhas = 2 }: { texto: string; linhas?: number }) {
  const [aberto, setAberto] = useState(false)
  const [cortado, setCortado] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || aberto) return
    const medir = () => setCortado(el.scrollHeight > el.clientHeight + 1)
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => observador.disconnect()
  }, [texto, aberto])

  return (
    <button
      type="button"
      disabled={!cortado && !aberto}
      onClick={() => setAberto((v) => !v)}
      aria-expanded={aberto}
      className="block w-full text-left enabled:cursor-pointer"
    >
      <p
        ref={ref}
        className="whitespace-pre-line"
        style={
          aberto
            ? undefined
            : { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: linhas, overflow: 'hidden' }
        }
      >
        {texto}
      </p>
      {(cortado || aberto) && (
        <span className="mt-0.5 inline-block text-[11.5px] text-muted underline underline-offset-2 hover:text-ink">
          {aberto ? 'ver menos' : 'ver mais'}
        </span>
      )}
    </button>
  )
}
