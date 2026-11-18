// エディタの全内容をテキストで置き換える。setValue は undo 履歴を消すため使わない。
export interface PasteModelLike {
  getLineCount(): number
  getLineMaxColumn(lineNumber: number): number
}

export interface PasteEditorLike {
  getModel(): PasteModelLike | null
  pushUndoStop(): unknown
  executeEdits(source: string, edits: { range: unknown; text: string }[]): unknown
  focus(): void
}

export interface PasteMonacoLike {
  Range: new (a: number, b: number, c: number, d: number) => unknown
}

export const PASTE_EDIT_SOURCE = 'paste-replace'

export const replaceAll = (
  editor: PasteEditorLike,
  monaco: PasteMonacoLike,
  text: string,
): boolean => {
  const model = editor.getModel()
  if (!model) return false
  const last = model.getLineCount()
  const range = new monaco.Range(1, 1, last, model.getLineMaxColumn(last))
  editor.pushUndoStop()
  editor.executeEdits(PASTE_EDIT_SOURCE, [{ range, text }])
  editor.pushUndoStop()
  editor.focus()
  return true
}
