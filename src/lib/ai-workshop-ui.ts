// AIワークショップモードの DOM 配線。依存は引数で受け取り、happy-dom で単体テストできるようにする。
import {
  AI_WORKSHOP_STATE_EVENT,
  buildAiWorkshopUrl,
  parseAiWorkshopParam,
  pasteButtonLabel,
} from './ai-workshop'
import type { ReadResult } from './clipboard'
import { replaceAll, type PasteEditorLike, type PasteMonacoLike } from './paste-replace'
import type { EditorLang } from './storage'

export interface AiWorkshopEditorLike extends PasteEditorLike {
  trigger(source: string, handlerId: string, payload: unknown): void
}

export interface AiWorkshopDeps {
  doc: Document
  location: Pick<Location, 'search' | 'href'>
  history: Pick<History, 'replaceState'>
  editors: Record<EditorLang, AiWorkshopEditorLike>
  models: Record<EditorLang, { getValue(): string }>
  monaco: PasteMonacoLike
  readClipboard: () => Promise<ReadResult>
  isMac: boolean
}

const LANGS: readonly EditorLang[] = ['html', 'css', 'javascript']
const isLang = (v: string | undefined): v is EditorLang => LANGS.includes(v as EditorLang)

export const attachAiWorkshop = (deps: AiWorkshopDeps) => {
  const { doc, editors, models } = deps
  const root = doc.documentElement
  const btnMenu = doc.getElementById('btn-ai-workshop')!
  const status = doc.getElementById('paste-status')!
  const pasteButtons = Array.from(doc.querySelectorAll<HTMLButtonElement>('.paste-replace'))
  let enabled = parseAiWorkshopParam(deps.location.search)

  const syncLabel = (lang: EditorLang) => {
    for (const btn of pasteButtons) {
      if (btn.dataset.lang === lang) btn.textContent = pasteButtonLabel(models[lang].getValue())
    }
  }
  const syncAllLabels = () => LANGS.forEach(syncLabel)

  const syncUi = () => {
    if (enabled) root.setAttribute('data-ai-workshop', 'true')
    else root.removeAttribute('data-ai-workshop')
    btnMenu.setAttribute('aria-pressed', String(enabled))
    btnMenu.classList.toggle('bg-emerald-600', enabled)
    btnMenu.classList.toggle('text-white', enabled)
    btnMenu.classList.toggle('text-slate-400', !enabled)
    btnMenu.classList.toggle('hover:text-emerald-400', !enabled)
    if (!enabled) status.textContent = ''
    else syncAllLabels()
    doc.dispatchEvent(new CustomEvent(AI_WORKSHOP_STATE_EVENT, { detail: enabled }))
  }

  btnMenu.addEventListener('click', () => {
    enabled = !enabled
    deps.history.replaceState(null, '', buildAiWorkshopUrl(deps.location.href, enabled))
    syncUi()
  })

  const pasteInto = async (lang: EditorLang) => {
    const res = await deps.readClipboard()
    if (res.result === 'ok') {
      if (!replaceAll(editors[lang], deps.monaco, res.text)) {
        status.textContent = '貼り付けできませんでした'
        return
      }
      status.textContent = ''
    } else if (res.result === 'empty') {
      status.textContent = 'クリップボードが空です'
    } else {
      // 読み取れない環境: 内容は消さず、全選択して手動貼り付けを案内する。
      editors[lang].focus()
      editors[lang].trigger('paste-replace', 'editor.action.selectAll', null)
      status.textContent = `全選択しました。${deps.isMac ? '⌘+V' : 'Ctrl+V'} で貼り付けてください`
    }
  }

  for (const btn of pasteButtons) {
    btn.disabled = false
    btn.addEventListener('click', async () => {
      const lang = btn.dataset.lang
      if (!isLang(lang) || btn.disabled) return
      btn.disabled = true // 連打による二重置換を防ぐ
      try {
        await pasteInto(lang)
      } finally {
        btn.disabled = false
      }
    })
  }

  syncUi()

  return {
    isEnabled: () => enabled,
    /** 内容変更時に呼ぶ。ON のときだけラベルを更新し、残っている案内を消す。 */
    onContentChange: (lang: EditorLang) => {
      if (!enabled) return
      syncLabel(lang)
      status.textContent = ''
    },
  }
}
