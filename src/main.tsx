import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// tema aplicado antes da primeira pintura, para não piscar branco
try {
  const salvo = localStorage.getItem('rr-suporte-theme')
  document.documentElement.dataset.theme =
    salvo === 'dark' || salvo === 'light'
      ? salvo
      : window.matchMedia?.('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
} catch {
  document.documentElement.dataset.theme = 'light'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
