/**
 * Tela cheia que confirma o envio do chamado. Fica por cima de tudo, então
 * não importa em que altura da página a pessoa apertou "Enviar" — o retorno
 * aparece no lugar onde ela está olhando.
 */
export function ConfirmacaoEnvio({
  onVerChamados,
  onNovoChamado,
}: {
  onVerChamados: () => void
  onNovoChamado: () => void
}) {
  return (
    <div className="rr-confirmacao" role="status" aria-live="assertive">
      <div className="max-w-[420px]">
        <div className="rr-selo relative mx-auto grid size-24 place-items-center rounded-full border-2 border-white/70">
          <span aria-hidden className="rr-pulso" />
          <svg viewBox="0 0 48 48" className="size-12" fill="none" aria-hidden>
            <path
              className="rr-risco"
              d="M13 24.5 21 32 35 17"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className="rr-sobe mt-7 text-[27px] leading-tight font-semibold tracking-tight">
          Chamado registrado
        </h2>
        <p className="rr-sobe-2 mx-auto mt-3 max-w-[36ch] text-[14px] leading-relaxed opacity-85">
          Já entrou na fila de triagem da equipe. Você acompanha o andamento em
          “Meus chamados”.
        </p>

        <div className="rr-sobe-3 mt-7 flex flex-wrap justify-center gap-2.5">
          <button
            type="button"
            onClick={onVerChamados}
            className="btn"
            style={{ background: 'var(--brand-ink)', color: 'var(--brand)' }}
          >
            Ver meus chamados
          </button>
          <button
            type="button"
            onClick={onNovoChamado}
            className="btn border-white/40 text-[var(--brand-ink)] hover:bg-white/10"
          >
            Abrir outro chamado
          </button>
        </div>
      </div>
    </div>
  )
}
