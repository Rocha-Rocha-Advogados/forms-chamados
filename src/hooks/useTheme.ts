import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
const KEY = 'rr-suporte-theme'

const inicial = (): Theme => {
  try {
    const salvo = localStorage.getItem(KEY)
    if (salvo === 'light' || salvo === 'dark') return salvo
  } catch {
    /* modo privado / storage bloqueado */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(inicial)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* ignora */
    }
  }, [theme])

  return { theme, toggle: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')) }
}
