import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { EQUIPAMENTOS, NATUREZAS, SETORES, URGENCIAS, URGENCIA_COLOR, URGENCIA_ICON } from '../lib/options'
import { Field, RadioCards, SelectInput, TextArea, TextInput, ErrorBanner } from '../components/ui'
import { useTheme } from '../hooks/useTheme'

type Form = {
  colaborador: string
  setor: string
  email: string
  natureza: string
  equipamento: string
  sistema: string
  descricao: string
  urgencia: string
}

const VAZIO: Form = {
  colaborador: '',
  setor: '',
  email: '',
  natureza: '',
  equipamento: '',
  sistema: '',
  descricao: '',
  urgencia: '',
}

export function FormularioPage() {
  const { theme, toggle } = useTheme()
  const [form, setForm] = useState<Form>(VAZIO)
  const [erros, setErros] = useState<Partial<Record<keyof Form, string>>>({})
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [falha, setFalha] = useState<string | null>(null)
  const confirmacao = useRef<HTMLDivElement>(null)

  // a confirmação é mais curta que o formulário: sem isso a página encolhe e
  // quem enviou fica olhando para o rodapé
  useEffect(() => {
    if (!enviado) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
    confirmacao.current?.focus()
  }, [enviado])

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
    if (!form.natureza) e.natureza = 'Selecione a natureza do problema.'
    if (pedeEquipamento && !form.equipamento) e.equipamento = 'Selecione o equipamento.'
    if (pedeSistema && !form.sistema.trim()) e.sistema = 'Informe o sistema ou aplicativo.'
    if (form.descricao.trim().length < 10) e.descricao = 'Descreva o problema com pelo menos 10 caracteres.'
    if (!form.urgencia) e.urgencia = 'Selecione a urgência.'
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'E-mail inválido.'
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
    const { error } = await supabase.from('chamados').insert({
      colaborador: form.colaborador.trim(),
      setor: form.setor || null,
      email: form.email.trim() || null,
      natureza: form.natureza,
      equipamento: pedeEquipamento ? form.equipamento : null,
      sistema: pedeSistema ? form.sistema.trim() : null,
      descricao: form.descricao.trim(),
      urgencia: form.urgencia,
    })
    setEnviando(false)
    if (error) setFalha(error.message)
    else setEnviado(true)
  }

  return (
    <div className="min-h-screen lg:grid lg:min-h-screen lg:grid-cols-[minmax(320px,42%)_1fr] lg:gap-0">
      {/* ------------------------------------------------------- capa (marca) */}
      {/* a coluna estica com a linha do grid; o conteúdo dentro dela é que fica fixo */}
      <aside
        className="relative overflow-hidden lg:min-h-screen"
        style={{
          backgroundImage: [
            `linear-gradient(155deg,
               color-mix(in srgb, var(--brand) 93%, transparent) 0%,
               color-mix(in srgb, var(--brand-2) 84%, transparent) 48%,
               color-mix(in srgb, var(--brand) 95%, transparent) 100%)`,
            'url(/fachada.jpg)',
          ].join(', '),
          backgroundSize: 'cover, cover',
          backgroundPosition: 'center, center 32%',
          backgroundRepeat: 'no-repeat, no-repeat',
          color: 'var(--brand-ink)',
        }}
      >
        <div className="flex min-h-full flex-col justify-between gap-10 px-7 py-9 lg:sticky lg:top-0 lg:h-screen lg:gap-0 lg:px-10 lg:py-12">
        <div className="relative">
          <p className="text-[12px] font-semibold tracking-[0.18em] uppercase opacity-80">Rocha &amp; Rocha</p>
          <p className="text-[11px] tracking-[0.3em] uppercase opacity-50">Advogados</p>
        </div>

        <div className="relative mt-10 lg:mt-0">
          <h1 className="text-[30px] leading-[1.15] font-semibold tracking-tight lg:text-[38px]">
            Solicitação de
            <br />
            Suporte Técnico
          </h1>
          <p className="mt-4 max-w-[34ch] text-[14px] leading-relaxed opacity-80">
            Descreva seu problema e encaminharemos para a pessoa capacitada a te ajudar.
          </p>
        </div>

        <div className="relative mt-10 flex items-center gap-4 lg:mt-0">
          <button
            type="button"
            onClick={toggle}
            className="rounded-lg border border-white/25 px-3 py-1.5 text-[12px] font-medium hover:bg-white/10"
          >
            {theme === 'light' ? '◐ Tema escuro' : '◑ Tema claro'}
          </button>
          <Link to="/painel/chamados" className="text-[12px] font-medium underline decoration-white/40 hover:opacity-80">
            Acesso da equipe de TI
          </Link>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------ perguntas */}
      <div className="px-4 py-8 lg:flex lg:min-h-screen lg:items-start lg:px-10 lg:py-12">
        <div className="mx-auto w-full max-w-[620px]">
          {enviado ? (
            <div className="card p-7" ref={confirmacao} tabIndex={-1} role="status" aria-live="polite">
              <span
                aria-hidden
                className="grid size-11 place-items-center rounded-full text-[20px]"
                style={{ background: 'color-mix(in srgb, var(--good) 14%, var(--surface))', color: 'var(--good)' }}
              >
                ✓
              </span>
              <h2 className="mt-4 text-[19px] font-semibold">Solicitação registrada</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
                Seu chamado entrou na fila de triagem da equipe de TI. Você será procurado pelo responsável pelo
                atendimento. Chamados de urgência <strong>Alta</strong> são tratados primeiro.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setForm({ ...VAZIO, colaborador: form.colaborador, setor: form.setor, email: form.email })
                    setEnviado(false)
                  }}
                >
                  Abrir outro chamado
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={enviar} noValidate>
              <p className="mb-6 text-[12.5px] text-muted">
                {perguntas.length} perguntas · os campos com <span style={{ color: 'var(--critical)' }}>*</span> são
                obrigatórios
              </p>

              {falha && (
                <div className="mb-5">
                  <ErrorBanner message={`Não foi possível enviar: ${falha}`} />
                </div>
              )}

              <div className="grid gap-7">
                <Question numero={1} titulo="Quem está solicitando?" obrigatorio>
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <Field label="Nome completo" required error={erros.colaborador}>
                      <TextInput
                        value={form.colaborador}
                        onChange={(e) => set('colaborador', e.target.value)}
                        aria-invalid={Boolean(erros.colaborador)}
                        placeholder="Insira sua resposta"
                        autoComplete="name"
                      />
                    </Field>
                    <Field label="Setor">
                      <SelectInput
                        options={SETORES}
                        placeholder="Selecione"
                        value={form.setor}
                        onChange={(e) => set('setor', e.target.value)}
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="E-mail corporativo" hint="Opcional — usado para retorno do atendimento." error={erros.email}>
                        <TextInput
                          type="email"
                          value={form.email}
                          onChange={(e) => set('email', e.target.value)}
                          aria-invalid={Boolean(erros.email)}
                          placeholder="nome@rocharocha.adv.br"
                          autoComplete="email"
                        />
                      </Field>
                    </div>
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

                <Question numero={pedeEquipamento || pedeSistema ? 4 : 3} titulo="Descrição do problema" obrigatorio erro={erros.descricao}>
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
                    setForm(VAZIO)
                    setErros({})
                  }}
                >
                  Limpar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
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
