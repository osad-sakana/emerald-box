import { describe, expect, it, vi } from 'vitest'
import { replaceAll, type PasteEditorLike } from './paste-replace'

class Range {
  constructor(
    public a: number,
    public b: number,
    public c: number,
    public d: number,
  ) {}
}

const makeEditor = (model: PasteEditorLike['getModel'] extends () => infer M ? M : never) => {
  const calls: string[] = []
  const editor: PasteEditorLike = {
    getModel: () => model,
    pushUndoStop: vi.fn(() => calls.push('undo')),
    executeEdits: vi.fn(() => calls.push('edit')),
    focus: vi.fn(() => calls.push('focus')),
  }
  return { editor, calls }
}

describe('replaceAll', () => {
  it('モデル全体を undo stop で挟んで置き換える', () => {
    const { editor, calls } = makeEditor({
      getLineCount: () => 3,
      getLineMaxColumn: () => 5,
    })
    expect(replaceAll(editor, { Range }, 'new')).toBe(true)
    expect(calls).toEqual(['undo', 'edit', 'undo', 'focus'])
    const [source, edits] = (editor.executeEdits as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(source).toBe('paste-replace')
    expect(edits[0].text).toBe('new')
    expect(edits[0].range).toEqual(new Range(1, 1, 3, 5))
  })
  it('モデルがなければ false', () => {
    const { editor } = makeEditor(null)
    expect(replaceAll(editor, { Range }, 'x')).toBe(false)
  })
})
