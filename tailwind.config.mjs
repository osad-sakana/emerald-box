/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // グリーンテーマのアクセント（plan.md デザインシステム準拠）
        brand: {
          DEFAULT: '#059669', // emerald-600
          accent: '#10b981', // emerald-500
          light: '#34d399', // emerald-400
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '游ゴシック',
          'Yu Gothic',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'Fira Code',
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
