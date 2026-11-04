// パーツ集の「挿入」「コピー」操作を統括する。DOM には依存せず、依存は外から渡す。
import type { CopyResult } from './clipboard'
import { insertSnippet, type SnippetEditorLike, type SnippetMonacoLike } from './snippet-insert'
import { SNIPPET_LANG_LABELS, findSnippet } from './snippets'
import type { EditorLang } from './storage'

export interface SnippetActionDeps {
  editors: Readonly<Record<EditorLang, SnippetEditorLike>>
  monaco: SnippetMonacoLike
  isPaneVisible: (lang: EditorLang) => boolean
  showPane: (lang: EditorLang) => void
  hasBeenFocused: (lang: EditorLang) => boolean
  copy: (text: string) => Promise<CopyResult>
}

export interface InsertOutcome {
  ok: boolean
  message: string
}

export interface CopyOutcome {
  result: CopyResult | 'not-found'
  message: string
}

const NOT_FOUND = 'パーツが見つかりません'

export const createSnippetActions = (deps: SnippetActionDeps) => ({
  insert(id: string): InsertOutcome {
    const snippet = findSnippet(id)
    if (!snippet) return { ok: false, message: NOT_FOUND }

    const label = SNIPPET_LANG_LABELS[snippet.lang]
    const wasHidden = !deps.isPaneVisible(snippet.lang)
    if (wasHidden) deps.showPane(snippet.lang)

    const ok = insertSnippet(deps.editors[snippet.lang], deps.monaco, snippet, {
      preferEnd: !deps.hasBeenFocused(snippet.lang),
    })
    if (!ok) return { ok: false, message: `${label}エディタに挿入できませんでした` }
    return {
      ok: true,
      message: wasHidden
        ? `${label}ペインを開いて挿入しました`
        : `${label}エディタに挿入しました`,
    }
  },

  async copy(id: string): Promise<CopyOutcome> {
    const snippet = findSnippet(id)
    if (!snippet) return { result: 'not-found', message: NOT_FOUND }
    const result = await deps.copy(snippet.code)
    return {
      result,
      message:
        result === 'failed'
          ? '自動でコピーできませんでした。選択された部分を Ctrl+C（Mac は ⌘+C）でコピーしてね'
          : 'コピーしました',
    }
  },
})
