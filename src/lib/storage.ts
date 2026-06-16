// LocalStorage への自動保存・復元ユーティリティ。
export type EditorLang = 'html' | 'css' | 'javascript'

// 表示・サイズ管理の対象ペイン（エディタ3種 + プレビュー）。
export type PaneKey = EditorLang | 'preview'
export const PANE_KEYS: PaneKey[] = ['html', 'css', 'javascript', 'preview']

const STORAGE_KEY = 'emerald-box:code:v1'
const PANELS_KEY = 'emerald-box:panels:v1'
const SIZES_KEY = 'emerald-box:sizes:v1'

export interface CodeState {
  html: string
  css: string
  javascript: string
}

// 各ペインの表示状態（開いている=true）。
export type PanelState = Record<PaneKey, boolean>

// 各ペインの相対サイズ（flex-grow 値）。
export type PanelSizes = Record<PaneKey, number>

// 初期状態は空。ユーザーがゼロから記述する。
export const DEFAULT_CODE: CodeState = {
  html: '',
  css: '',
  javascript: '',
}

// 初期は HTML エディタとプレビューのみ表示。
export const DEFAULT_PANELS: PanelState = {
  html: true,
  css: false,
  javascript: false,
  preview: true,
}

// 初期サイズは均等。
export const DEFAULT_SIZES: PanelSizes = {
  html: 1,
  css: 1,
  javascript: 1,
  preview: 1,
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
    localStorage.removeItem(SIZES_KEY)
  } catch (error) {
    console.error('リセットに失敗しました:', error)
  }
}

// ペインの相対サイズの読み込み。正の数以外はデフォルトにフォールバック。
export function loadSizes(): PanelSizes {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_SIZES }
  const isPos = (v: unknown): v is number => typeof v === 'number' && v > 0
  try {
    const raw = localStorage.getItem(SIZES_KEY)
    if (!raw) return { ...DEFAULT_SIZES }
    const parsed = JSON.parse(raw) as Partial<PanelSizes>
    const pick = (k: PaneKey): number =>
      isPos(parsed[k]) ? (parsed[k] as number) : DEFAULT_SIZES[k]
    return {
      html: pick('html'),
      css: pick('css'),
      javascript: pick('javascript'),
      preview: pick('preview'),
    }
  } catch (error) {
    console.error('ペインサイズの読み込みに失敗しました:', error)
    return { ...DEFAULT_SIZES }
  }
}

export function saveSizes(state: PanelSizes): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(SIZES_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('ペインサイズの保存に失敗しました:', error)
  }
}

// ペイン表示状態の読み込み。壊れたデータはデフォルトにフォールバック。
export function loadPanels(): PanelState {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_PANELS }
  try {
    const raw = localStorage.getItem(PANELS_KEY)
    if (!raw) return { ...DEFAULT_PANELS }
    const parsed = JSON.parse(raw) as Partial<PanelState>
    const pick = (k: PaneKey): boolean =>
      typeof parsed[k] === 'boolean' ? (parsed[k] as boolean) : DEFAULT_PANELS[k]
    return {
      html: pick('html'),
      css: pick('css'),
      javascript: pick('javascript'),
      preview: pick('preview'),
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
