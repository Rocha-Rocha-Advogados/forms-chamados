import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CapaPublica } from '../components/CapaPublica'
import { ConfirmacaoEnvio } from '../components/ConfirmacaoEnvio'
import { ErrorBanner, Field, RadioCards, TextArea, TextInput } from '../components/ui'
import { DOMINIO, EMAIL_CORPORATIVO, useIdentificacao } from '../hooks/useIdentificacao'
import { EQUIPAMENTOS, NATUREZAS, URGENCIAS, URGENCIA_COLOR, URGENCIA_ICON } from '../lib/options'
import { supabase, supabaseConfigured } from '../lib/supabase'

type Form = {
  colaborador: string
  email: string
  natureza: string
  equipamento: string
  sistema: string
  descricao: string
  urgencia: string
}

const VAZIO: Form = {
  colaborador: '',
  email: '',
  natureza: '',
  equipamento: '',
  sistema: '',
  descricao: '',
  urgencia: '',
}

export function FormularioPage() {
  const { email: identificado, identificar } = useIdentificacao()
  const navegar = useNavigate()

  const [form, setForm] = useState<Form>({ ...VAZIO, email: identificado })
  const [erros, setErros] = useState<Partial<Record<keyof Form, string>>>({})
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [falha, setFalha] = useState<string | null>(null)

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErros((e) => ({ ...e, [key]: undefined }))
  }

  // ramificação igual à do formulário original
  const pedeEquipamento = form.natureza === 'Computador ou equipamento'
  const pedeSistema = form.natureza === 'Sistema ou aplicativo interno'

  const perguntas = useMemo(() => {
    const base = ['Identificação', 'Natureza do problema']
    if (pedeEquipamento) base.push('Equipamento')
    if (pedeSistema) base.push('Sistema')
    return [...base, 'Descrição', 'Urgência']
  }, [pedeEquipamento, pedeSistema])

  const validar = () => {
    const e: Partial<Record<keyof Form, string>> = {}
    if (!form.colaborador.trim()) e.colaborador = 'Informe seu nome.'
    const email = form.email.trim()
    if (!email) e.email = 'Informe seu e-mail corporativo.'
    else if (!EMAIL_CORPORATIVO.test(email)) e.email = `Use seu e-mail @${DOMINIO}.`
    if (!form.natureza) e.natureza = 'Selecione a natureza do problema.'
    if (pedeEquipamento && !form.equipamento) e.equipamento = 'Selecione o equipamento.'
    if (pedeSistema && !form.sistema.trim()) e.sistema = 'Informe o sistema ou aplicativo.'
    if (form.descricao.trim().length < 10) e.descricao = 'Descreva o problema com pelo menos 10 caracteres.'
    if (!form.urgencia) e.urgencia = 'Selecione a urgência.'
    setErros(e)
    return Object.keys(e).length === 0
  }

  const enviar = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setFalha(null)
    if (!validar()) {
      document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (!supabaseConfigured) {
      setFalha('Supabase não configurado: preencha VITE_SUPABASE_ANON_KEY no arquivo .env.')
      return
    }
    setEnviando(true)
    const email = form.email.trim().toLowerCase()
    const { error } = await supabase.from('chamados').insert({
      colaborador: form.colaborador.trim(),
      email,
      natureza: form.natureza,
      equipamento: pedeEquipamento ? form.equipamento : null,
      sistema: pedeSistema ? form.sistema.trim() : null,
      descricao: form.descricao.trim(),
      urgencia: form.urgencia,
    })
    setEnviando(false)
    if (error) {
      setFalha(error.message)
      return
    }
    // o chamado passa a aparecer em "Meus chamados" deste endereço
    identificar(email)
    setEnviado(true)
  }

  return (
    <>
      <CapaPublica
        titulo={
          <>
            Solicitação de
            <br />
            Suporte Técnico
          </>
        }
        subtitulo="Descreva seu problema e encaminharemos para a pessoa capacitada a te ajudar."
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <Link to="/" className="text-[12.5px] font-medium text-ink-2 hover:text-ink">
            ← Meus chamados
          </Link>
          <p className="text-[12.5px] text-muted">
            {perguntas.length} perguntas · os campos com <span style={{ color: 'var(--critical)' }}>*</span> são
            obrigatórios
          </p>
        </div>

        <form onSubmit={enviar} noValidate>
          {falha && (
            <div className="mb-5">
              <ErrorBanner message={`Não foi possível enviar: ${falha}`} />
            </div>
          )}

          <div className="grid gap-7">
            <Question numero={1} titulo="Quem está solicitando?" obrigatorio>
              <div className="grid gap-3.5">
                <Field label="Nome completo" required error={erros.colaborador}>
                  <TextInput
                    value={form.colaborador}
                    onChange={(e) => set('colaborador', e.target.value)}
                    aria-invalid={Boolean(erros.colaborador)}
                    placeholder="Insira sua resposta"
                    autoComplete="name"
                  />
                </Field>
                <Field
                  label="E-mail corporativo"
                  required
                  hint={`Precisa ser o seu endereço @${DOMINIO} — é por ele que o atendimento te procura.`}
                  error={erros.email}
                >
                  <TextInput
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    aria-invalid={Boolean(erros.email)}
                    placeholder={`nome@${DOMINIO}`}
                    autoComplete="email"
                  />
                </Field>
              </div>
            </Question>

            <Question numero={2} titulo="Qual a natureza do problema?" obrigatorio erro={erros.natureza}>
              <RadioCards name="natureza" value={form.natureza} options={NATUREZAS} onChange={(v) => set('natureza', v)} />
            </Question>

            {pedeEquipamento && (
              <Question numero={3} titulo="Qual equipamento apresenta o problema?" obrigatorio erro={erros.equipamento}>
                <RadioCards
                  name="equipamento"
                  value={form.equipamento}
                  options={EQUIPAMENTOS}
                  onChange={(v) => set('equipamento', v)}
                />
              </Question>
            )}

            {pedeSistema && (
              <Question numero={3} titulo="Qual sistema ou aplicativo apresenta o problema?" obrigatorio erro={erros.sistema}>
                <TextInput
                  value={form.sistema}
                  onChange={(e) => set('sistema', e.target.value)}
                  aria-invalid={Boolean(erros.sistema)}
                  placeholder="Insira sua resposta"
                />
              </Question>
            )}

            <Question
              numero={pedeEquipamento || pedeSistema ? 4 : 3}
              titulo="Descrição do problema"
              obrigatorio
              erro={erros.descricao}
            >
              <TextArea
                rows={5}
                value={form.descricao}
                onChange={(e) => set('descricao', e.target.value)}
                aria-invalid={Boolean(erros.descricao)}
                placeholder="O que aconteceu, desde quando, e o que você já tentou."
              />
              <p className="mt-1.5 text-[11.5px] text-muted">{form.descricao.trim().length} caracteres</p>
            </Question>

            <Question numero={pedeEquipamento || pedeSistema ? 5 : 4} titulo="Urgência" obrigatorio erro={erros.urgencia}>
              <div className="grid gap-2 sm:grid-cols-3">
                {URGENCIAS.map((u) => {
                  const ativo = form.urgencia === u
                  return (
                    <label
                      key={u}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5"
                      style={{
                        borderColor: ativo ? URGENCIA_COLOR[u] : 'var(--line)',
                        background: ativo ? 'var(--surface-2)' : 'var(--surface)',
                      }}
                    >
                      <input
                        type="radio"
                        name="urgencia"
                        checked={ativo}
                        onChange={() => set('urgencia', u)}
                        className="size-4"
                        style={{ accentColor: URGENCIA_COLOR[u] }}
                      />
                      <span aria-hidden style={{ color: URGENCIA_COLOR[u] }} className="text-[12px]">
                        {URGENCIA_ICON[u]}
                      </span>
                      <span className="text-[13.5px]">{u}</span>
                    </label>
                  )
                })}
              </div>
              <p className="mt-2 text-[11.5px] text-muted">
                Alta = trabalho parado. Média = atrapalha, mas há contorno. Baixa = pode aguardar.
              </p>
            </Question>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar solicitação'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setForm({ ...VAZIO, email: form.email })
                setErros({})
              }}
            >
              Limpar
            </button>
          </div>
        </form>
      </CapaPublica>

      {enviado && (
        <ConfirmacaoEnvio
          onVerChamados={() => navegar('/')}
          onNovoChamado={() => {
            setForm({ ...VAZIO, colaborador: form.colaborador, email: form.email })
            setEnviado(false)
            window.scrollTo({ top: 0 })
          }}
        />
      )}
    </>
  )
}

function Question({
  numero,
  titulo,
  obrigatorio,
  erro,
  children,
}: {
  numero: number
  titulo: string
  obrigatorio?: boolean
  erro?: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-3 text-[15px] font-semibold">
        <span className="tnum mr-1.5 text-muted">{numero}.</span>
        {titulo}
        {obrigatorio && (
          <span className="ml-1" style={{ color: 'var(--critical)' }}>
            *
          </span>
        )}
      </legend>
      {children}
      {erro && (
        <p className="mt-2 text-[12px]" style={{ color: 'var(--critical)' }} aria-live="polite">
          ⚠ {erro}
        </p>
      )}
    </fieldset>
  )
}
