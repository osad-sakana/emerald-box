// HTML エディタに閉じタグ自動生成を取り付ける Monaco 配線（判定は auto-close-tag.ts）。
import { findTagToClose } from './auto-close-tag'

interface ContentChangeEventLike {
  changes: readonly { rangeOffset: number; text: string }[]
  isUndoing: boolean
  isRedoing: boolean
  isFlush: boolean
}

interface ModelLike {
  getValue(): string
  getPositionAt(offset: number): { lineNumber: number; column: number }
}

interface EditorLike {
  onDidChangeModelContent(listener: (e: ContentChangeEventLike) => void): { dispose(): void }
  getModel(): ModelLike | null
  getSelections(): readonly unknown[] | null
  pushUndoStop(): unknown
  executeEdits(
    source: string,
    edits: { range: unknown; text: string }[],
    cursorStateComputer?: () => unknown[],
  ): unknown
}

interface RangeCtor {
  new (startLine: number, startColumn: number, endLine: number, endColumn: number): unknown
}

interface MonacoLike {
  Range: RangeCtor
  Selection: RangeCtor
}

const EDIT_SOURCE = 'auto-close-tag'

// 手入力された半角 `>` 1文字だけを対象にする（貼り付け・undo/redo・リセット・複数カーソル・IME 確定は除外）。
const isTypedGreaterThan = (e: ContentChangeEventLike, selectionCount: number): boolean =>
  e.changes.length === 1 &&
  e.changes[0].text === '>' &&
  !e.isUndoing &&
  !e.isRedoing &&
  !e.isFlush &&
  selectionCount === 1

export const attachHtmlAutoClose = (
  editor: EditorLike,
  monaco: MonacoLike,
): { dispose(): void } =>
  editor.onDidChangeModelContent((e) => {
    if (!isTypedGreaterThan(e, editor.getSelections()?.length ?? 0)) return
    const model = editor.getModel()
    if (!model) return

    const value = model.getValue()
    const { rangeOffset } = e.changes[0]
    if (value.charAt(rangeOffset) !== '>') return

    // 挿入位置は入力された `>` の直後。ここがカーソル位置にもなる。
    const offset = rangeOffset + 1
    const tag = findTagToClose(value.slice(0, offset), value.slice(offset))
    if (tag === null) return

    const { lineNumber, column } = model.getPositionAt(offset)
    // 前後に undo stop を置き、1回目の undo で閉じタグだけが消えるようにする。
    editor.pushUndoStop()
    editor.executeEdits(
      EDIT_SOURCE,
      [{ range: new monaco.Range(lineNumber, column, lineNumber, column), text: `</${tag}>` }],
      () => [new monaco.Selection(lineNumber, column, lineNumber, column)],
    )
    editor.pushUndoStop()
  })
