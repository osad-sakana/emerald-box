// LocalStorage への自動保存・復元ユーティリティ。
export type EditorLang = 'html' | 'css' | 'javascript'

const STORAGE_KEY = 'emerald-box:code:v1'
const PANELS_KEY = 'emerald-box:panels:v1'

export interface CodeState {
  html: string
  css: string
  javascript: string
}

// 各エディタペインの表示状態（開いている=true）。
export type PanelState = Record<EditorLang, boolean>

// 初期状態は空。ユーザーがゼロから記述する。
export const DEFAULT_CODE: CodeState = {
  html: '',
  css: '',
  javascript: '',
}

// 初期は3ペインとも表示。
export const DEFAULT_PANELS: PanelState = {
  html: true,
  css: true,
  javascript: true,
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
    localStorage.removeItem(PANELS_KEY)
  } catch (error) {
    console.error('リセットに失敗しました:', error)
  }
}

// ペイン表示状態の読み込み。壊れたデータはデフォルトにフォールバック。
export function loadPanels(): PanelState {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_PANELS }
  try {
    const raw = localStorage.getItem(PANELS_KEY)
    if (!raw) return { ...DEFAULT_PANELS }
    const parsed = JSON.parse(raw) as Partial<PanelState>
    return {
      html:
        typeof parsed.html === 'boolean' ? parsed.html : DEFAULT_PANELS.html,
      css: typeof parsed.css === 'boolean' ? parsed.css : DEFAULT_PANELS.css,
      javascript:
        typeof parsed.javascript === 'boolean'
          ? parsed.javascript
          : DEFAULT_PANELS.javascript,
    }
  } catch (error) {
    console.error('ペイン状態の読み込みに失敗しました:', error)
    return { ...DEFAULT_PANELS }
  }
}

export function savePanels(state: PanelState): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(PANELS_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('ペイン状態の保存に失敗しました:', error)
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
