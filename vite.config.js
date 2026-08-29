import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serve um repositório de projeto num SUBCAMINHO
  // (sxcrifice1.github.io/portifolio/), não na raiz do domínio. Sem
  // isto o HTML pediria /assets/... e receberia 404 em tudo — a página
  // abriria em branco. Precisa bater com o nome do repositório.
  //
  // Fica só no build; o `npm run dev` continua servindo em "/". Se um
  // dia você apontar um domínio próprio para o site, troque por "/".
  base: process.env.NODE_ENV === 'production' ? '/portifolio/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
