import { describe, expect, it, vi } from 'vitest'
import type { CopyResult } from './clipboard'
import { createSnippetActions } from './snippet-actions'
import type { SnippetEditorLike } from './snippet-insert'

class R {
  constructor(..._a: number[]) {}
}

const makeEditor = () => {
  const executeEdits = vi.fn()
  const editor: SnippetEditorLike = {
    getModel: () => ({
      getLineContent: () => '',
      getLineCount: () => 1,
      getLineMaxColumn: () => 1,
    }),
    getSelection: () => ({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }),
    pushUndoStop: vi.fn(),
    executeEdits,
    revealPositionInCenterIfOutsideViewport: vi.fn(),
    focus: vi.fn(),
  }
  return { editor, executeEdits }
}

const setup = (opts: { visible?: boolean; focused?: boolean; copy?: CopyResult } = {}) => {
  const order: string[] = []
  const e = makeEditor()
  e.executeEdits.mockImplementation(() => order.push('insert'))
  const showPane = vi.fn(() => order.push('show'))
  const copy = vi.fn().mockResolvedValue(opts.copy ?? 'clipboard')
  const actions = createSnippetActions({
    editors: { html: e.editor, css: e.editor, javascript: e.editor },
    monaco: { Range: R, Selection: R },
    isPaneVisible: () => opts.visible ?? true,
    showPane,
    hasBeenFocused: () => opts.focused ?? true,
    copy,
  })
  return { actions, order, showPane, copy, ...e }
}

describe('createSnippetActions', () => {
  it('表示中のペインでは showPane を呼ばず挿入する', () => {
    const s = setup()
    expect(s.actions.insert('css-color')).toEqual({ ok: true, message: 'CSSエディタに挿入しました' })
    expect(s.showPane).not.toHaveBeenCalled()
  })

  it('非表示のペインは先に開いてから挿入する', () => {
    const s = setup({ visible: false })
    const r = s.actions.insert('css-color')
    expect(s.order).toEqual(['show', 'insert'])
    expect(r.message).toBe('CSSペインを開いて挿入しました')
  })

  it.each([
    [false, [2, 9, 2, 9]],
    [true, [1, 1, 1, 1]],
  ])('hasBeenFocused=%s の挿入位置', (focused, expected) => {
    const ranges: number[][] = []
    class Rec {
      constructor(...a: number[]) {
        ranges.push(a)
      }
    }
    const lines = ['<h1>a</h1>', '<p>b</p>']
    const editor: SnippetEditorLike = {
      getModel: () => ({
        getLineContent: (n) => lines[n - 1],
        getLineCount: () => lines.length,
        getLineMaxColumn: (n) => lines[n - 1].length + 1,
      }),
      getSelection: () => ({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }),
      pushUndoStop: vi.fn(),
      executeEdits: (_s, edits, computer) => {
        void edits
        computer?.()
      },
      revealPositionInCenterIfOutsideViewport: vi.fn(),
      focus: vi.fn(),
    }
    const actions = createSnippetActions({
      editors: { html: editor, css: editor, javascript: editor },
      monaco: { Range: Rec, Selection: R },
      isPaneVisible: () => true,
      showPane: vi.fn(),
      hasBeenFocused: () => focused,
      copy: vi.fn(),
    })
    actions.insert('html-heading-h1')
    expect(ranges[0]).toEqual(expected)
  })

  it('存在しない id は何もしない', () => {
    const s = setup({ visible: false })
    expect(s.actions.insert('nope')).toEqual({ ok: false, message: 'パーツが見つかりません' })
    expect(s.showPane).not.toHaveBeenCalled()
    expect(s.executeEdits).not.toHaveBeenCalled()
  })

  it('挿入に失敗したらエラーメッセージ', () => {
    const s = setup()
    const broken = { ...s.editor, getModel: () => null }
    const actions = createSnippetActions({
      editors: { html: broken, css: broken, javascript: broken },
      monaco: { Range: R, Selection: R },
      isPaneVisible: () => true,
      showPane: vi.fn(),
      hasBeenFocused: () => true,
      copy: vi.fn(),
    })
    expect(actions.insert('css-color')).toEqual({ ok: false, message: 'CSSエディタに挿入できませんでした' })
  })

  it('コピー成功', async () => {
    const s = setup({ visible: false })
    const r = await s.actions.copy('css-color')
    expect(r).toEqual({ result: 'clipboard', message: 'コピーしました' })
    expect(s.showPane).not.toHaveBeenCalled()
    expect(s.copy).toHaveBeenCalledOnce()
  })

  it('コピー失敗は手動コピーの案内', async () => {
    const s = setup({ copy: 'failed' })
    const r = await s.actions.copy('css-color')
    expect(r.result).toBe('failed')
    expect(r.message).toContain('Ctrl+C')
  })

  it('コピーでも存在しない id は not-found', async () => {
    const s = setup()
    expect((await s.actions.copy('nope')).result).toBe('not-found')
    expect(s.copy).not.toHaveBeenCalled()
  })
})
