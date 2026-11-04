import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'

// SSG（静的サイト生成）モード。完全クライアントサイド完結型。
// S3 + CloudFront の独自ドメイン直下（/）に配置する。
export default defineConfig({
  site: 'https://emerald-box.shisui.tokyo',
  output: 'static',
  integrations: [tailwind()],
})
