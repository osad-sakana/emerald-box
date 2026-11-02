// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import {
  DRAWER_CLOSE_EVENT,
  DRAWER_ESC_WHEN,
  DRAWER_STATE_EVENT,
  attachDrawerEscape,
} from './snippet-drawer-keybinding'

const makeEditor = () => {
  const key = { set: vi.fn() }
  const commands: { code: number; run: () => void; when?: string }[] = []
  return {
    key,
    commands,
    editor: {
      createContextKey: vi.fn(() => key),
      addCommand: (code: number, run: () => void, when?: string) => {
        commands.push({ code, run, when })
      },
    },
  }
}

describe('DRAWER_ESC_WHEN', () => {
  it('ドロワー開放を必須とし、標準の Esc 操作が使う状態を除外する', () => {
    const terms = DRAWER_ESC_WHEN.split(' && ')
    expect(terms[0]).toBe('snippetDrawerOpen')
    for (const t of [
      '!suggestWidgetVisible',
      '!findWidgetVisible',
      '!parameterHintsVisible',
      '!renameInputVisible',
      '!inSnippetMode',
      '!editorHasMultipleSelections',
      '!editorHasSelection',
    ]) {
      expect(terms).toContain(t)
    }
  })
})

describe('attachDrawerEscape', () => {
  it('各エディタに条件付きで Esc コマンドを登録する', () => {
    const a = makeEditor()
    const b = makeEditor()
    attachDrawerEscape([a.editor, b.editor], 9, document)
    for (const f of [a, b]) {
      expect(f.commands).toHaveLength(1)
      expect(f.commands[0].code).toBe(9)
      expect(f.commands[0].when).toBe(DRAWER_ESC_WHEN)
    }
  })

  it('initialOpen を渡すとコンテキストキーの初期値になる', () => {
    const a = makeEditor()
    attachDrawerEscape([a.editor], 9, document, true)
    expect(a.editor.createContextKey).toHaveBeenCalledWith('snippetDrawerOpen', true)
  })

  it('コマンド実行でクローズイベントを発火する', () => {
    const a = makeEditor()
    attachDrawerEscape([a.editor], 9, document)
    const onClose = vi.fn()
    document.addEventListener(DRAWER_CLOSE_EVENT, onClose)
    a.commands[0].run()
    expect(onClose).toHaveBeenCalledOnce()
    document.removeEventListener(DRAWER_CLOSE_EVENT, onClose)
  })

  it('状態イベントでコンテキストキーが更新される', () => {
    const a = makeEditor()
    const b = makeEditor()
    attachDrawerEscape([a.editor, b.editor], 9, document)
    document.dispatchEvent(new CustomEvent(DRAWER_STATE_EVENT, { detail: true }))
    expect(a.key.set).toHaveBeenLastCalledWith(true)
    expect(b.key.set).toHaveBeenLastCalledWith(true)
    document.dispatchEvent(new CustomEvent(DRAWER_STATE_EVENT, { detail: false }))
    expect(a.key.set).toHaveBeenLastCalledWith(false)
  })
})
