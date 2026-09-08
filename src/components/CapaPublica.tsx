import type { ReactNode } from 'react'

/**
 * Moldura das telas públicas: a coluna da fachada à esquerda e o conteúdo à
 * direita. A foto é fundo de uma camada de altura fixa — se ficasse no
 * <aside>, que cresce com o conteúdo, o `cover` reescalaria a imagem a cada
 * pergunta que abre no formulário.
 */
export function CapaPublica({
  titulo,
  subtitulo,
  children,
}: {
  titulo: ReactNode
  subtitulo: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen lg:grid lg:min-h-screen lg:grid-cols-[minmax(360px,52%)_1fr] lg:gap-0">
      <aside
        className="relative lg:min-h-screen"
        style={{ background: 'var(--brand-degrade)', color: 'var(--brand-ink)' }}
      >
        <div
          className="flex min-h-full flex-col justify-between gap-10 px-7 py-9 lg:sticky lg:top-0 lg:h-screen lg:min-h-0 lg:gap-0 lg:px-10 lg:py-12"
          style={{
            backgroundImage: [
              // o degradê da marca com transparência: a foto atravessa como
              // textura e o branco mantém contraste bem acima de 4.5:1
              `linear-gradient(
                 color-mix(in srgb, var(--brand-2) 88%, transparent) 0%,
                 color-mix(in srgb, var(--brand) 95%, transparent) 100%)`,
              `url(${import.meta.env.BASE_URL}fachada.jpg)`,
            ].join(', '),
            backgroundSize: 'cover, cover',
            backgroundPosition: 'center, center 32%',
            backgroundRepeat: 'no-repeat, no-repeat',
          }}
        >
          <div className="relative">
            <p className="text-[12px] font-semibold tracking-[0.18em] uppercase opacity-80">Rocha &amp; Rocha</p>
            <p className="text-[11px] tracking-[0.3em] uppercase opacity-50">Advogados</p>
          </div>

          <div className="relative mt-10 lg:mt-0">
            <h1 className="text-[30px] leading-[1.15] font-semibold tracking-tight lg:text-[38px]">{titulo}</h1>
            <p className="mt-4 max-w-[34ch] text-[14px] leading-relaxed opacity-80">{subtitulo}</p>
          </div>

          {/* espaçador: o justify-between desta coluna usa três blocos, e é
              ele que mantém o título na altura do meio. */}
          <div aria-hidden />
        </div>
      </aside>

      <div className="px-4 py-8 lg:flex lg:min-h-screen lg:items-start lg:px-10 lg:py-12">
        <div className="mx-auto w-full max-w-[620px]">{children}</div>
      </div>
    </div>
  )
}
