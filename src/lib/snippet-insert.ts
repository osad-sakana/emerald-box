// パーツをエディタへ挿入するロジック。位置計算は純関数、Monaco 操作は EditorLike 越しに行う。
import type { Snippet } from './snippets'

export interface Position {
  readonly lineNumber: number
  readonly column: number
}

export interface RangeLike {
  readonly startLineNumber: number
  readonly startColumn: number
  readonly endLineNumber: number
  readonly endColumn: number
}

export interface SnippetModelLike {
  getLineContent(lineNumber: number): string
  getLineCount(): number
  getLineMaxColumn(lineNumber: number): number
}

export interface SnippetEditorLike {
  getModel(): SnippetModelLike | null
  getSelection(): RangeLike | null
  pushUndoStop(): unknown
  executeEdits(
    source: string,
    edits: { range: unknown; text: string; forceMoveMarkers?: boolean }[],
    cursorStateComputer?: () => unknown[],
  ): unknown
  revealPositionInCenterIfOutsideViewport(position: Position): void
  focus(): void
}

export interface SnippetMonacoLike {
  Range: new (a: number, b: number, c: number, d: number) => unknown
  Selection: new (a: number, b: number, c: number, d: number) => unknown
}

export const SNIPPET_EDIT_SOURCE = 'snippet-insert'

/** 行頭の空白のうち、カーソル（1始まりの column）より前にある部分を返す。 */
export const getLineIndent = (lineText: string, column: number): string => {
  const leading = /^[ \t]*/.exec(lineText)?.[0] ?? ''
  return leading.slice(0, Math.max(0, column - 1))
}

/** 2行目以降の先頭に indent を付ける。空行には付けない。 */
export const indentSnippet = (code: string, indent: string): string =>
  code
    .split('\n')
    .map((line, i) => (i === 0 || line === '' ? line : indent + line))
    .join('\n')

export const buildInsertionText = (
  snippet: Pick<Snippet, 'code' | 'block'>,
  ctx: { before: string; after: string; indent: string },
): string => {
  const body = indentSnippet(snippet.code, ctx.indent)
  if (!snippet.block) return body
  const head = ctx.before.trim() !== '' ? `\n${ctx.indent}` : ''
  const tail = ctx.after.trim() !== '' ? `\n${ctx.indent}` : ''
  return head + body + tail
}

/** start から text を挿入した後のカーソル位置（text の末尾）。 */
export const computeEndPosition = (start: Position, text: string): Position => {
  const lines = text.split('\n')
  if (lines.length === 1) {
    return { lineNumber: start.lineNumber, column: start.column + text.length }
  }
  return {
    lineNumber: start.lineNumber + lines.length - 1,
    column: lines[lines.length - 1].length + 1,
  }
}

/**
 * パーツをエディタへ挿入する。挿入できたら true。
 * preferEnd: まだ触っていないエディタ向けに文書末尾へ追記する。
 */
export const insertSnippet = (
  editor: SnippetEditorLike,
  monaco: SnippetMonacoLike,
  snippet: Snippet,
  opts: { preferEnd: boolean },
): boolean => {
  const model = editor.getModel()
  if (!model) return false

  let range: RangeLike
  if (opts.preferEnd) {
    const last = model.getLineCount()
    const col = model.getLineMaxColumn(last)
    range = { startLineNumber: last, startColumn: col, endLineNumber: last, endColumn: col }
  } else {
    const sel = editor.getSelection()
    if (!sel) return false
    range = sel
  }

  const startLine = model.getLineContent(range.startLineNumber)
  const endLine = model.getLineContent(range.endLineNumber)
  const before = startLine.slice(0, range.startColumn - 1)
  const after = endLine.slice(range.endColumn - 1)
  const indent = getLineIndent(startLine, range.startColumn)
  const text = buildInsertionText(snippet, { before, after, indent })

  const start: Position = { lineNumber: range.startLineNumber, column: range.startColumn }
  const end = computeEndPosition(start, text)

  editor.pushUndoStop()
  editor.executeEdits(
    SNIPPET_EDIT_SOURCE,
    [
      {
        range: new monaco.Range(
          range.startLineNumber,
          range.startColumn,
          range.endLineNumber,
          range.endColumn,
        ),
        text,
        forceMoveMarkers: true,
      },
    ],
    () => [new monaco.Selection(end.lineNumber, end.column, end.lineNumber, end.column)],
  )
  editor.pushUndoStop()
  editor.revealPositionInCenterIfOutsideViewport(end)
  editor.focus()
  return true
}
