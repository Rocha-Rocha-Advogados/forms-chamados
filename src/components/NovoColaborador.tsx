import { useState } from 'react'
import { Field, TextInput } from './ui'

/** Cadastro mínimo de uma linha nova: nome + data. O resto é editado na planilha. */
export function NovoColaborador({
  rotuloData,
  onCriar,
}: {
  rotuloData: string
  onCriar: (dados: { colaborador: string; data: string | null }) => Promise<void>
}) {
  const [aberto, setAberto] = useState(false)
  const [colaborador, setColaborador] = useState('')
  const [data, setData] = useState('')
  const [salvando, setSalvando] = useState(false)

  if (!aberto)
    return (
      <button type="button" className="btn btn-primary" onClick={() => setAberto(true)}>
        ＋ Novo colaborador
      </button>
    )

  const criar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!colaborador.trim()) return
    setSalvando(true)
    await onCriar({ colaborador: colaborador.trim(), data: data || null })
    setSalvando(false)
    setColaborador('')
    setData('')
    setAberto(false)
  }

  return (
    <form onSubmit={criar} className="card flex flex-wrap items-end gap-2 p-2.5">
      <div className="w-[260px]">
        <Field label="Colaborador" required>
          <TextInput
            autoFocus
            value={colaborador}
            onChange={(e) => setColaborador(e.target.value)}
            placeholder="Nome completo"
            required
          />
        </Field>
      </div>
      <div className="w-[160px]">
        <Field label={rotuloData}>
          <TextInput type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </Field>
      </div>
      <button type="submit" className="btn btn-primary" disabled={salvando || !colaborador.trim()}>
        {salvando ? 'Salvando…' : 'Adicionar'}
      </button>
      <button type="button" className="btn btn-ghost" onClick={() => setAberto(false)}>
        Cancelar
      </button>
    </form>
  )
}
