import { useCallback, useEffect, useState } from 'react'

const KEY = 'rr-suporte-email'

export const DOMINIO = 'rocharocha.adv.br'
export const EMAIL_CORPORATIVO = new RegExp(`^[^\\s@]+@${DOMINIO.replace(/\./g, '\\.')}$`, 'i')

/**
 * Quem está usando a área pública. É identificação, não autenticação: a
 * pessoa diz qual é o e-mail dela e o app passa a mostrar os chamados
 * daquele endereço. Foi a escolha do escritório — quem digitar o endereço
 * de outra pessoa vê os chamados dela.
 */
export function useIdentificacao() {
  const [email, setEmail] = useState<string>(() => {
    try {
      return localStorage.getItem(KEY) ?? ''
    } catch {
      return ''
    }
  })

  useEffect(() => {
    try {
      if (email) localStorage.setItem(KEY, email)
      else localStorage.removeItem(KEY)
    } catch {
      /* modo privado / storage bloqueado */
    }
  }, [email])

  const identificar = useCallback((valor: string) => {
    const limpo = valor.trim().toLowerCase()
    if (!EMAIL_CORPORATIVO.test(limpo)) return false
    setEmail(limpo)
    return true
  }, [])

  return { email, identificar }
}
