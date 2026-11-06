import { describe, expect, it } from 'vitest'
import { buildWrappedText, parseWrapInput, wrapSelection } from './wrap-tag'

describe('parseWrapInput', () => {
  it('タグ名から開始・終了タグを作る', () => {
    expect(parseWrapInput('div')).toEqual({ ok: true, tag: { open: '<div>', close: '</div>' } })
  })
  it('山括弧付きでも受け付ける', () => {
    expect(parseWrapInput('<section>')).toEqual({
      ok: true,
      tag: { open: '<section>', close: '</section>' },
    })
  })
  it('属性を開始タグに残す', () => {
    expect(parseWrapInput(' div class="box" ')).toEqual({
      ok: true,
      tag: { open: '<div class="box">', close: '</div>' },
    })
  })
  it('空入力・不正入力・空要素はエラー', () => {
    expect(parseWrapInput('  ').ok).toBe(false)
    expect(parseWrapInput('1div').ok).toBe(false)
    expect(parseWrapInput('di<v').ok).toBe(false)
    expect(parseWrapInput('img').ok).toBe(false)
  })
})

describe('buildWrappedText', () => {
  const tag = { open: '<div>', close: '</div>' }
  it('単一行はそのまま囲む', () => {
    expect(buildWrappedText('hi', tag, '')).toEqual({ text: '<div>hi</div>', caretOffset: 5 })
  })
  it('空選択は開始タグ直後にカーソル', () => {
    expect(buildWrappedText('', tag, '')).toEqual({ text: '<div></div>', caretOffset: 5 })
  })
  it('複数行は別行にして中身を1段インデントする', () => {
    const { text } = buildWrappedText('<p>a</p>\n  <p>b</p>', tag, '  ')
    expect(text).toBe('<div>\n    <p>a</p>\n    <p>b</p>\n  </div>')
  })
  it('複数行内の空行にはインデントを付けない', () => {
    expect(buildWrappedText('a\n\nb', tag, '').text).toBe('<div>\n  a\n\n  b\n</div>')
  })
})

class FakeRange {
  constructor(public a: number, public b: number, public c: number, public d: number) {}
}
const monaco = { Range: FakeRange, Selection: FakeRange }

const makeEditor = (line: string, selected: string) => {
  const calls: { text: string; caret?: unknown }[] = []
  const editor = {
    getModel: () => ({
      getLineContent: () => line,
      getLineCount: () => 1,
      getLineMaxColumn: () => line.length + 1,
    }),
    getSelection: () => ({ startLineNumber: 1, startColumn: 3, endLineNumber: 1, endColumn: 3 + selected.length }),
    getValueInRange: () => selected,
    pushUndoStop: () => undefined,
    executeEdits: (_s: string, edits: { text: string }[], cb?: () => unknown[]) => {
      calls.push({ text: edits[0].text, caret: cb?.()[0] })
    },
    revealPositionInCenterIfOutsideViewport: () => undefined,
    focus: () => undefined,
  }
  return { editor, calls }
}

describe('wrapSelection', () => {
  it('選択範囲を囲んで編集を実行する', () => {
    const { editor, calls } = makeEditor('  hello', 'hello')
    expect(wrapSelection(editor, monaco, { open: '<b>', close: '</b>' })).toBe(true)
    expect(calls[0].text).toBe('<b>hello</b>')
  })
  it('空選択ではカーソルをタグの間へ置く', () => {
    const { editor, calls } = makeEditor('  ', '')
    wrapSelection(editor, monaco, { open: '<b>', close: '</b>' })
    expect(calls[0].text).toBe('<b></b>')
    expect(calls[0].caret).toMatchObject({ a: 1, b: 6, c: 1, d: 6 })
  })
  it('選択がなければ false', () => {
    const { editor } = makeEditor('x', '')
    expect(wrapSelection({ ...editor, getSelection: () => null }, monaco, { open: '<b>', close: '</b>' })).toBe(false)
  })
})
