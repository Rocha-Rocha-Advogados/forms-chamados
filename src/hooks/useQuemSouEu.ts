import { useEffect, useState } from 'react'

const KEY = 'rr-suporte-quem'

/**
 * Quem está usando o painel. A conta do Supabase é compartilhada pela equipe,
 * então o app não tem como saber sozinho quem é — a pessoa se identifica uma
 * vez e a escolha fica no navegador dela. É isso que preenche o "Responsável
 * pelo atendimento" quando alguém marca um chamado como resolvido.
 */
export function useQuemSouEu() {
  const [quem, setQuem] = useState<string>(() => {
    try {
      return localStorage.getItem(KEY) ?? ''
    } catch {
      return ''
    }
  })

  useEffect(() => {
    try {
      if (quem) localStorage.setItem(KEY, quem)
      else localStorage.removeItem(KEY)
    } catch {
      /* modo privado / storage bloqueado */
    }
  }, [quem])

  return { quem, setQuem }
}
