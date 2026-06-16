import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'

// SSG（静的サイト生成）モード。完全クライアントサイド完結型。
// GitHub Pages のプロジェクトページ（/emerald-box/）に配置する。
export default defineConfig({
  site: 'https://osad-sakana.github.io',
  base: '/emerald-box',
  output: 'static',
  integrations: [tailwind()],
})
