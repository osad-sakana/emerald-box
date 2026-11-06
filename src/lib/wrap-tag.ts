// 選択範囲をタグで囲む（ラッピング）ロジック。純関数 + EditorLike 越しの Monaco 操作。
import {
  computeEndPosition,
  getLineIndent,
  type Position,
  type RangeLike,
  type SnippetEditorLike,
  type SnippetMonacoLike,
} from './snippet-insert'

export const WRAP_EDIT_SOURCE = 'wrap-tag'
const INDENT_UNIT = '  '

const VOID_ELEMENTS: readonly string[] = [
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'source', 'track', 'wbr',
]

export interface WrapTag {
  readonly open: string
  readonly close: string
}

export type ParseResult =
  | { readonly ok: true; readonly tag: WrapTag }
  | { readonly ok: false; readonly message: string }

/**
 * 入力（`div` / `<div>` / `div class="box"` など）を開始・終了タグに変換する。
 * 空要素（img など）や不正な入力はエラーメッセージを返す。
 */
export const parseWrapInput = (input: string): ParseResult => {
  const stripped = input.trim().replace(/^</, '').replace(/>$/, '').trim()
  if (stripped === '') return { ok: false, message: 'タグ名を入力してください' }
  const match = /^([a-zA-Z][a-zA-Z0-9-]*)(\s+[^<>]*)?$/.exec(stripped)
  if (!match) return { ok: false, message: 'タグ名が正しくありません（例: div / section class="box"）' }
  const name = match[1]
  if (VOID_ELEMENTS.includes(name.toLowerCase())) {
    return { ok: false, message: `<${name}> は中身を持てないため囲めません` }
  }
  const attrs = (match[2] ?? '').trimEnd()
  return { ok: true, tag: { open: `<${name}${attrs}>`, close: `</${name}>` } }
}

/**
 * 選択テキストをタグで囲んだ文字列を作る。
 * 複数行の場合は開始/終了タグを別行にし、中身を1段インデントする。
 * caretOffset は選択が空のときにカーソルを置く位置（開始タグ直後）。
 */
export const buildWrappedText = (
  selected: string,
  tag: WrapTag,
  indent: string,
): { text: string; caretOffset: number } => {
  if (!selected.includes('\n')) {
    return { text: tag.open + selected + tag.close, caretOffset: tag.open.length }
  }
  const lines = selected.split('\n')
  const body = lines
    .map((line, i) => {
      if (i === 0) return indent + INDENT_UNIT + line.trimStart()
      return line === '' ? line : INDENT_UNIT + line
    })
    .join('\n')
  const text = `${tag.open}\n${body}\n${indent}${tag.close}`
  return { text, caretOffset: text.length }
}

/** 選択範囲をタグで囲む。囲めたら true。選択が空ならタグだけ挿入し、カーソルを中へ置く。 */
export const wrapSelection = (
  editor: SnippetEditorLike & { getValueInRange(range: unknown): string },
  monaco: SnippetMonacoLike,
  tag: WrapTag,
  range?: RangeLike,
): boolean => {
  const model = editor.getModel()
  const sel = range ?? editor.getSelection()
  if (!model || !sel) return false

  const monacoRange = new monaco.Range(
    sel.startLineNumber, sel.startColumn, sel.endLineNumber, sel.endColumn,
  )
  const selected = editor.getValueInRange(monacoRange)
  const indent = getLineIndent(model.getLineContent(sel.startLineNumber), sel.startColumn)
  const { text, caretOffset } = buildWrappedText(selected, tag, indent)

  const start: Position = { lineNumber: sel.startLineNumber, column: sel.startColumn }
  const caret = computeEndPosition(start, text.slice(0, selected === '' ? caretOffset : text.length))

  editor.pushUndoStop()
  editor.executeEdits(
    WRAP_EDIT_SOURCE,
    [{ range: monacoRange, text, forceMoveMarkers: true }],
    () => [new monaco.Selection(caret.lineNumber, caret.column, caret.lineNumber, caret.column)],
  )
  editor.pushUndoStop()
  editor.revealPositionInCenterIfOutsideViewport(caret)
  editor.focus()
  return true
}
