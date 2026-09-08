export const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')

/** Todo o app mostra data e hora no fuso do escritório, não no do navegador. */
export const FUSO = 'America/Sao_Paulo'

const DT = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: FUSO })
const D = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: FUSO })
/** en-CA devolve AAAA-MM-DD, que é a chave usada nos agrupamentos por dia. */
const DIA = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO })

export const fmtDateTime = (iso: string | null | undefined) => (iso ? DT.format(new Date(iso)) : '—')

/** Datas puras (date) não têm fuso: formata sem deslocar o dia. */
export const fmtDate = (value: string | null | undefined) => {
  if (!value) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  return D.format(new Date(value))
}

export const dayKey = (iso: string | Date) => DIA.format(new Date(iso))

export const fmtDayLabel = (key: string) => `${key.slice(8, 10)}/${key.slice(5, 7)}`

export const horasEntre = (from: string, to: string) =>
  (new Date(to).getTime() - new Date(from).getTime()) / 36e5

export const fmtHoras = (h: number | null) => {
  if (h == null || !Number.isFinite(h)) return '—'
  if (h < 1) return `${Math.round(h * 60)} min`
  if (h < 48) return `${h.toFixed(1)} h`
  return `${(h / 24).toFixed(1)} d`
}

/**
 * Coluna "Tempo" da fila: conta sempre da abertura do chamado — até a solução
 * quando ela foi registrada, até agora quando ainda está na fila. Resolvido
 * sem hora de solução (os registros migrados da planilha) mostra "—" em vez
 * de uma idade que cresce para sempre.
 */
export const tempoDoChamado = (c: { created_at: string; resolvido: boolean; resolvido_em: string | null }) => {
  if (c.resolvido_em) return fmtHoras(horasEntre(c.created_at, c.resolvido_em))
  if (c.resolvido) return '—'
  return fmtHoras(horasEntre(c.created_at, new Date().toISOString()))
}

export const pct = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0)

export const contarPor = <T,>(rows: T[], pick: (row: T) => string | null | undefined) => {
  const map = new Map<string, number>()
  for (const row of rows) {
    const key = (pick(row) || '').trim() || 'Não informado'
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

/** Últimos N dias, incluindo dias sem chamado (série temporal não pode ter buraco). */
export const serieDiaria = (rows: Array<{ created_at: string }>, dias: number) => {
  const hoje = new Date()
  const buckets = new Map<string, number>()
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoje)
    d.setDate(d.getDate() - i)
    buckets.set(dayKey(d), 0)
  }
  for (const row of rows) {
    const key = dayKey(row.created_at)
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  return [...buckets.entries()].map(([key, total]) => ({ key, label: fmtDayLabel(key), total }))
}

export const toCsv = (headers: string[], rows: Array<Array<string | number | boolean | null>>) => {
  const esc = (v: string | number | boolean | null) => {
    const s = v == null ? '' : typeof v === 'boolean' ? (v ? 'Sim' : 'Não') : String(v)
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers, ...rows].map((r) => r.map(esc).join(';')).join('\r\n')
}

export const baixarCsv = (nome: string, conteudo: string) => {
  // BOM para o Excel abrir os acentos corretamente
  const blob = new Blob(['\uFEFF' + conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${nome}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export const buscaEm = (termo: string, ...campos: Array<string | null | undefined>) => {
  const q = normalizar(termo.trim())
  if (!q) return true
  return normalizar(campos.filter(Boolean).join(' ')).includes(q)
}
