import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** Caminho do site no GitHub Pages: rocha-rocha-advogados.github.io/forms-chamados/ */
const BASE_PAGES = '/forms-chamados/'

/**
 * O Pages serve arquivos estáticos: /interno/chamados não existe em disco e
 * cai no 404. Como o Pages entrega o 404.html para qualquer caminho
 * desconhecido, uma cópia do index.html ali faz o roteador assumir a rota.
 */
const spaFallback = (): Plugin => {
  let outDir = 'dist'
  return {
    name: 'spa-404',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

export default defineConfig(({ command }) => ({
  // em desenvolvimento o site fica na raiz; no build, no subcaminho do Pages
  base: command === 'build' ? BASE_PAGES : '/',
  plugins: [react(), tailwindcss(), spaFallback()],
  server: { port: 5173, host: true },
}))
