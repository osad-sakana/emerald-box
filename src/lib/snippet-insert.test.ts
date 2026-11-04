import { describe, expect, it } from 'vitest'
import {
  buildInsertionText,
  computeCaretOffset,
  computeEndPosition,
  getLineIndent,
  indentSnippet,
  insertSnippet,
  type RangeLike,
  type SnippetEditorLike,
} from './snippet-insert'
import type { Snippet } from './snippets'

class FakeRange {
  constructor(
    public a: number,
    public b: number,
    public c: number,
    public d: number,
  ) {}
}
class FakeSelection extends FakeRange {}
const monaco = { Range: FakeRange, Selection: FakeSelection }

const snip = (code: string, block = true): Snippet => ({
  id: 'x',
  lang: 'html',
  category: 'c',
  label: 'l',
  description: 'd',
  code,
  block,
})

const makeEditor = (lines: string[], selection: RangeLike | null) => {
  const calls: string[] = []
  const edits: { source: string; text: string; range: unknown; forceMoveMarkers?: boolean }[] = []
  let cursor: unknown[] = []
  let revealed: unknown = null
  const editor: SnippetEditorLike = {
    getModel: () => ({
      getLineContent: (n) => lines[n - 1],
      getLineCount: () => lines.length,
      getLineMaxColumn: (n) => lines[n - 1].length + 1,
    }),
    getSelection: () => selection,
    pushUndoStop: () => void calls.push('undo'),
    executeEdits: (source, e, computer) => {
      calls.push('edit')
      edits.push({ source, ...e[0] })
      cursor = computer ? computer() : []
    },
    revealPositionInCenterIfOutsideViewport: (p) => {
      calls.push('reveal')
      revealed = p
    },
    focus: () => void calls.push('focus'),
  }
  return { editor, calls, edits, getCursor: () => cursor, getRevealed: () => revealed }
}

const caret = (line: number, col: number): RangeLike => ({
  startLineNumber: line,
  startColumn: col,
  endLineNumber: line,
  endColumn: col,
})

describe('getLineIndent', () => {
  it('空行は空文字', () => expect(getLineIndent('', 1)).toBe(''))
  it('空白のみの行はカーソルまでの空白', () => expect(getLineIndent('    ', 3)).toBe('  '))
  it('先頭の空白だけを返す', () => expect(getLineIndent('  <p>a</p>', 8)).toBe('  '))
  it('カーソルが空白の途中なら手前まで', () => expect(getLineIndent('    x', 3)).toBe('  '))
})

describe('indentSnippet', () => {
  it('1行は変化なし', () => expect(indentSnippet('a', '  ')).toBe('a'))
  it('2行目以降に indent を付ける', () => expect(indentSnippet('a\nb\nc', '  ')).toBe('a\n  b\n  c'))
  it('空行には付けない', () => expect(indentSnippet('a\n\nb', '  ')).toBe('a\n\n  b'))
})

describe('buildInsertionText', () => {
  const s = { code: 'a\nb', block: true }
  it('前後が空白なら改行を補わない', () =>
    expect(buildInsertionText(s, { before: '  ', after: '', indent: '  ' })).toBe('a\n  b'))
  it('前に文字があれば先頭に改行と indent', () =>
    expect(buildInsertionText(s, { before: 'x', after: '', indent: '  ' })).toBe('\n  a\n  b'))
  it('後ろに文字があれば末尾に改行と indent', () =>
    expect(buildInsertionText(s, { before: '', after: 'y', indent: '' })).toBe('a\nb\n'))
  it('インラインは補わない', () =>
    expect(buildInsertionText({ code: 'a', block: false }, { before: 'x', after: 'y', indent: '' })).toBe('a'))
})

describe('computeEndPosition', () => {
  it('1行: 開始列 + 長さ', () =>
    expect(computeEndPosition({ lineNumber: 2, column: 3 }, 'abc')).toEqual({ lineNumber: 2, column: 6 }))
  it('複数行: 最終行の長さ + 1', () =>
    expect(computeEndPosition({ lineNumber: 2, column: 3 }, 'a\n  bc')).toEqual({ lineNumber: 3, column: 5 }))
})

describe('computeCaretOffset', () => {
  it('空要素なら開始タグと閉じタグの間', () =>
    expect(computeCaretOffset('<h1></h1>')).toBe(4))
  it('複数行なら最初の空要素の間', () =>
    expect(computeCaretOffset('<ul>\n  <li></li>\n</ul>')).toBe(11))
  it('属性があっても開始タグの直後', () =>
    expect(computeCaretOffset('<a href="#x"></a>')).toBe(13))
  it('空要素がなければ最初の空の属性値の中', () =>
    expect(computeCaretOffset('<img src="" alt="">')).toBe(10))
  it('どちらもなければ末尾', () => expect(computeCaretOffset('abc')).toBe(3))
})

describe('insertSnippet', () => {
  it('カーソル位置に挿入し、undo 区切り→編集→区切り→reveal→focus の順', () => {
    const f = makeEditor([''], caret(1, 1))
    expect(insertSnippet(f.editor, monaco, snip('<p>a</p>'), { preferEnd: false })).toBe(true)
    expect(f.calls).toEqual(['undo', 'edit', 'undo', 'reveal', 'focus'])
    expect(f.edits[0].source).toBe('snippet-insert')
    expect(f.edits[0].text).toBe('<p>a</p>')
    expect(f.edits[0].forceMoveMarkers).toBe(true)
  })

  it('カーソルは挿入テキストの末尾に置かれる', () => {
    const f = makeEditor([''], caret(1, 1))
    insertSnippet(f.editor, monaco, snip('a\nbc'), { preferEnd: false })
    expect(f.getCursor()).toEqual([new FakeSelection(2, 3, 2, 3)])
    expect(f.getRevealed()).toEqual({ lineNumber: 2, column: 3 })
  })

  it('空要素のパーツはタグの間にカーソルを置く', () => {
    const f = makeEditor([''], caret(1, 1))
    insertSnippet(f.editor, monaco, snip('<h1></h1>'), { preferEnd: false })
    expect(f.getCursor()).toEqual([new FakeSelection(1, 5, 1, 5)])
    expect(f.getRevealed()).toEqual({ lineNumber: 1, column: 5 })
  })

  it('インデント付き複数行でも最初の空要素の間に置く', () => {
    const f = makeEditor(['  '], caret(1, 3))
    insertSnippet(f.editor, monaco, snip('<ul>\n  <li></li>\n</ul>'), { preferEnd: false })
    expect(f.getCursor()).toEqual([new FakeSelection(2, 9, 2, 9)])
  })

  it('HTML 以外は末尾にカーソルを置く', () => {
    const f = makeEditor([''], caret(1, 1))
    insertSnippet(f.editor, monaco, { ...snip('a="">'), lang: 'css' }, { preferEnd: false })
    expect(f.getCursor()).toEqual([new FakeSelection(1, 6, 1, 6)])
  })

  it('選択範囲は置き換えられる', () => {
    const f = makeEditor(['hello'], {
      startLineNumber: 1,
      startColumn: 2,
      endLineNumber: 1,
      endColumn: 4,
    })
    insertSnippet(f.editor, monaco, snip('X', false), { preferEnd: false })
    expect(f.edits[0].range).toEqual(new FakeRange(1, 2, 1, 4))
  })

  it('preferEnd なら文書末尾に追記し、末尾行が空でなければ改行を補う', () => {
    const f = makeEditor(['<h1>a</h1>'], caret(1, 1))
    insertSnippet(f.editor, monaco, snip('<p>b</p>'), { preferEnd: true })
    expect(f.edits[0].range).toEqual(new FakeRange(1, 11, 1, 11))
    expect(f.edits[0].text).toBe('\n<p>b</p>')
  })

  it('インデント付きの行へ挿入すると2行目以降が揃う', () => {
    const f = makeEditor(['  '], caret(1, 3))
    insertSnippet(f.editor, monaco, snip('<ul>\n  <li>a</li>\n</ul>'), { preferEnd: false })
    expect(f.edits[0].text).toBe('<ul>\n    <li>a</li>\n  </ul>')
  })

  it('複数行にまたがる選択の置換は前後を別々の行から取る', () => {
    const f = makeEditor(['ab', 'cd'], {
      startLineNumber: 1,
      startColumn: 2,
      endLineNumber: 2,
      endColumn: 2,
    })
    insertSnippet(f.editor, monaco, snip('X'), { preferEnd: false })
    expect(f.edits[0].range).toEqual(new FakeRange(1, 2, 2, 2))
    expect(f.edits[0].text).toBe('\nX\n')
  })

  it('行の途中へのブロック挿入は前後に改行と indent を補う', () => {
    const f = makeEditor(['  ab'], caret(1, 4))
    insertSnippet(f.editor, monaco, snip('X'), { preferEnd: false })
    expect(f.edits[0].text).toBe('\n  X\n  ')
  })

  it('model が null なら false で編集しない', () => {
    const f = makeEditor([''], caret(1, 1))
    const editor = { ...f.editor, getModel: () => null }
    expect(insertSnippet(editor, monaco, snip('a'), { preferEnd: false })).toBe(false)
    expect(f.edits).toHaveLength(0)
  })

  it('選択がなければ false', () => {
    const f = makeEditor([''], null)
    expect(insertSnippet(f.editor, monaco, snip('a'), { preferEnd: false })).toBe(false)
    expect(f.edits).toHaveLength(0)
  })
})
