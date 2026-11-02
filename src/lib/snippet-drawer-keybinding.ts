// エディタ内の Esc でパーツ集ドロワーを閉じる Monaco 配線。
// addCommand は Monaco 標準の Esc 操作より優先されるため、ドロワーが開いているとき、かつ
// 標準の Esc 操作（ウィジェット・スニペット・複数カーソル・選択解除）が使われない状況に限定する。
export const DRAWER_STATE_EVENT = 'snippet-drawer:state'
export const DRAWER_CLOSE_EVENT = 'snippet-drawer:close'
const DRAWER_OPEN_KEY = 'snippetDrawerOpen'

export const DRAWER_ESC_WHEN = [
  DRAWER_OPEN_KEY,
  '!suggestWidgetVisible',
  '!findWidgetVisible',
  '!parameterHintsVisible',
  '!renameInputVisible',
  '!inSnippetMode',
  '!editorHasMultipleSelections',
  '!editorHasSelection',
].join(' && ')

interface ContextKeyLike {
  set(value: boolean): void
}

export interface DrawerEditorLike {
  createContextKey(key: string, defaultValue: boolean): ContextKeyLike
  addCommand(keybinding: number, handler: () => void, context?: string): unknown
}

export interface DrawerEventTarget {
  addEventListener(type: string, listener: (e: Event) => void): void
  dispatchEvent(e: Event): boolean
}

export const attachDrawerEscape = (
  editors: readonly DrawerEditorLike[],
  escapeKeyCode: number,
  target: DrawerEventTarget,
  initialOpen = false,
): void => {
  // Monaco 読み込み前にドロワーが開かれていても状態を取りこぼさないよう初期値を受け取る。
  const openKeys = editors.map((editor) => editor.createContextKey(DRAWER_OPEN_KEY, initialOpen))
  for (const editor of editors) {
    editor.addCommand(
      escapeKeyCode,
      () => void target.dispatchEvent(new CustomEvent(DRAWER_CLOSE_EVENT)),
      DRAWER_ESC_WHEN,
    )
  }
  target.addEventListener(DRAWER_STATE_EVENT, (e) => {
    const open = (e as CustomEvent<boolean>).detail === true
    for (const key of openKeys) key.set(open)
  })
}
