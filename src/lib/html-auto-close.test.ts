import { describe, expect, it, vi } from 'vitest'
import { attachHtmlAutoClose } from './html-auto-close'

type Listener = (e: {
  changes: { rangeOffset: number; text: string }[]
  isUndoing: boolean
  isRedoing: boolean
  isFlush: boolean
}) => void

const toPosition = (value: string, offset: number) => {
  const lines = value.slice(0, offset).split('\n')
  return { lineNumber: lines.length, column: lines[lines.length - 1].length + 1 }
}

class FakeRange {
  constructor(
    readonly startLineNumber: number,
    readonly startColumn: number,
    readonly endLineNumber: number,
    readonly endColumn: number,
  ) {}
}

class FakeSelection extends FakeRange {}

const setup = (value: string, selectionCount = 1) => {
  let listener: Listener | null = null
  const dispose = vi.fn()
  const calls: string[] = []
  const executeEdits = vi.fn((_source: string, _edits: unknown[], _computer?: () => unknown[]) => {
    calls.push('executeEdits')
    return true
  })
  const editor = {
    onDidChangeModelContent: (l: Listener) => {
      listener = l
      return { dispose }
    },
    getModel: () => ({
      getValue: () => value,
      getPositionAt: (offset: number) => toPosition(value, offset),
    }),
    getSelections: () => Array.from({ length: selectionCount }, () => ({})),
    pushUndoStop: vi.fn(() => {
      calls.push('pushUndoStop')
      return true
    }),
    executeEdits,
  }
  const monaco = { Range: FakeRange, Selection: FakeSelection }
  const handle = attachHtmlAutoClose(editor, monaco)
  const fire = (overrides: Partial<Parameters<Listener>[0]> = {}) =>
    listener!({
      changes: [{ rangeOffset: value.length - 1, text: '>' }],
      isUndoing: false,
      isRedoing: false,
      isFlush: false,
      ...overrides,
    })
  return { editor, handle, fire, dispose, executeEdits, calls }
}

describe('attachHtmlAutoClose', () => {
  it('開始タグの > 入力で閉じタグを > の直後に挿入し、カーソルを閉じタグの手前に残す', () => {
    const { fire, executeEdits } = setup('<div>')
    fire()
    expect(executeEdits).toHaveBeenCalledTimes(1)
    const [source, edits, computer] = executeEdits.mock.calls[0]
    expect(source).toBe('auto-close-tag')
    expect(edits).toEqual([{ range: new FakeRange(1, 6, 1, 6), text: '</div>' }])
    expect(computer!()).toEqual([new FakeSelection(1, 6, 1, 6)])
  })

  it('複数行でも正しい行・桁に挿入する', () => {
    const { fire, executeEdits } = setup('<ul>\n  <li>')
    fire()
    const [, edits] = executeEdits.mock.calls[0]
    expect(edits).toEqual([{ range: new FakeRange(2, 7, 2, 7), text: '</li>' }])
  })

  it('挿入の前後に undo stop を置く', () => {
    const { fire, calls } = setup('<div>')
    fire()
    expect(calls).toEqual(['pushUndoStop', 'executeEdits', 'pushUndoStop'])
  })

  it.each([
    ['undo 中', { isUndoing: true }],
    ['redo 中', { isRedoing: true }],
    ['setValue / リセット', { isFlush: true }],
    ['変更が複数件', { changes: [{ rangeOffset: 4, text: '>' }, { rangeOffset: 0, text: 'x' }] }],
    ['変更が0件', { changes: [] }],
    ['貼り付け（複数文字）', { changes: [{ rangeOffset: 4, text: '>>' }] }],
    ['全角 ＞ の確定', { changes: [{ rangeOffset: 4, text: '＞' }] }],
    ['> 以外の入力', { changes: [{ rangeOffset: 4, text: 'x' }] }],
  ])('%s では挿入しない', (_name, overrides) => {
    const { fire, executeEdits } = setup('<div>')
    fire(overrides)
    expect(executeEdits).not.toHaveBeenCalled()
  })

  it('複数カーソルでは挿入しない', () => {
    const { fire, executeEdits } = setup('<div>', 2)
    fire()
    expect(executeEdits).not.toHaveBeenCalled()
  })

  it('変更位置の文字が > でなければ挿入しない', () => {
    const { fire, executeEdits } = setup('<div>')
    fire({ changes: [{ rangeOffset: 0, text: '>' }] })
    expect(executeEdits).not.toHaveBeenCalled()
  })

  it('閉じるべきでない場合（void 要素・タグ外）は挿入しない', () => {
    const br = setup('<br>')
    br.fire()
    expect(br.executeEdits).not.toHaveBeenCalled()

    const outside = setup('a >')
    outside.fire()
    expect(outside.executeEdits).not.toHaveBeenCalled()
  })

  it('カーソル直後に同名の閉じタグがあれば挿入しない', () => {
    const { fire, executeEdits } = setup('<div></div>')
    fire({ changes: [{ rangeOffset: 4, text: '>' }] })
    expect(executeEdits).not.toHaveBeenCalled()
  })

  it('モデルが無い場合は何もしない', () => {
    const { editor, fire, executeEdits } = setup('<div>')
    editor.getModel = () => null as never
    fire()
    expect(executeEdits).not.toHaveBeenCalled()
  })

  it('dispose で購読を解除する', () => {
    const { handle, dispose } = setup('<div>')
    handle.dispose()
    expect(dispose).toHaveBeenCalledTimes(1)
  })
})
