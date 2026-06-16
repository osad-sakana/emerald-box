// LocalStorage への自動保存・復元ユーティリティ。
import type { EditorLang } from './snippets'

const STORAGE_KEY = 'emerald-box:code:v1'

export interface CodeState {
  html: string
  css: string
  javascript: string
}

export const DEFAULT_CODE: CodeState = {
  html: `<main class="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
  <h1 class="text-3xl font-bold text-emerald-600">Emerald Box へようこそ</h1>
  <p class="text-slate-500">左のスニペットや上のタブを使ってコードを編集しましょう。</p>
</main>`,
  css: `/* ここに CSS を記述します（Tailwind と併用可能） */`,
  javascript: `// ここに JavaScript を記述します。
// 上部の「▶ JS実行」ボタンで実行されます。
console.log('Emerald Box の準備ができました')`,
}

// immutableに状態を読み込む。壊れたデータはデフォルトにフォールバック。
export function loadCode(): CodeState {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_CODE }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_CODE }
    const parsed = JSON.parse(raw) as Partial<CodeState>
    return {
      html: typeof parsed.html === 'string' ? parsed.html : DEFAULT_CODE.html,
      css: typeof parsed.css === 'string' ? parsed.css : DEFAULT_CODE.css,
      javascript:
        typeof parsed.javascript === 'string'
          ? parsed.javascript
          : DEFAULT_CODE.javascript,
    }
  } catch (error) {
    console.error('保存データの読み込みに失敗しました:', error)
    return { ...DEFAULT_CODE }
  }
}

export function saveCode(state: CodeState): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('保存に失敗しました:', error)
  }
}

export function clearCode(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('リセットに失敗しました:', error)
  }
}

// 500ms デバウンス。タイピング停止後にまとめて保存する。
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  delay: number
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args: A) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export type { EditorLang }
