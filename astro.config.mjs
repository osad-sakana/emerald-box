import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'

// SSG（静的サイト生成）モード。完全クライアントサイド完結型。
export default defineConfig({
  output: 'static',
  integrations: [tailwind()],
})
