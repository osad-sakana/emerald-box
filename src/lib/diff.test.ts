import { describe, it, expect } from 'vitest'
import { diffLines, diffInline } from './diff'

describe('diffLines', () => {
  it('同一テキストの場合は変更なしを返す', () => {
    expect(diffLines('a\nb', 'a\nb')).toEqual([])
  })

  it('空文字列同士の場合は変更なしを返す', () => {
    expect(diffLines('', '')).toEqual([])
  })

  it('空文字列からテキストが追加された場合はaddedを返す', () => {
    expect(diffLines('', 'line1')).toEqual([{ kind: 'added', line: 1 }])
  })

  it('テキストが空文字列になった場合は全行deletedAtを返す', () => {
    expect(diffLines('line1\nline2', '')).toEqual([
      { kind: 'deletedAt', line: 1 },
      { kind: 'deletedAt', line: 1 },
    ])
  })

  it('末尾に1行追加された場合はaddedを返す', () => {
    expect(diffLines('a\nb', 'a\nb\nc')).toEqual([{ kind: 'added', line: 3 }])
  })

  it('先頭の1行が削除された場合はdeletedAtを返す', () => {
    expect(diffLines('a\nb', 'b')).toEqual([{ kind: 'deletedAt', line: 1 }])
  })

  it('1行が変更された場合はmodifiedを返す', () => {
    expect(diffLines('a\nb\nc', 'a\nX\nc')).toEqual([
      { kind: 'modified', line: 2, baselineText: 'b', currentText: 'X' },
    ])
  })

  it('追加・削除・変更が混在する場合はそれぞれの変更を返す', () => {
    expect(diffLines('a\nb\nc\nd', 'a\nX\nc\nd\ne')).toEqual([
      { kind: 'modified', line: 2, baselineText: 'b', currentText: 'X' },
      { kind: 'added', line: 5 },
    ])
  })

  it('MAX_CELLSを超える行数の場合は空配列を返す', () => {
    const baseline = Array.from({ length: 2001 }, (_, i) => `l${i}`).join('\n')
    const current = Array.from({ length: 2001 }, (_, i) => `m${i}`).join('\n')
    expect(diffLines(baseline, current)).toEqual([])
  })

  it('行内容は同一だが順序が異なる場合は削除と追加を返す', () => {
    expect(diffLines('a\nb\nc', 'c\nb\na')).toEqual([
      { kind: 'deletedAt', line: 1 },
      { kind: 'deletedAt', line: 1 },
      { kind: 'added', line: 2 },
      { kind: 'added', line: 3 },
    ])
  })
})

describe('diffInline', () => {
  it('同一文字列の場合は変更なしを返す', () => {
    expect(diffInline('abc', 'abc')).toEqual([])
  })

  it('空文字列同士の場合は変更なしを返す', () => {
    expect(diffInline('', '')).toEqual([])
  })

  it('完全に異なる文字列の場合は全体をchangedとして返す', () => {
    expect(diffInline('abc', 'xyz')).toEqual([{ kind: 'changed', startColumn: 1, endColumn: 4 }])
  })

  it('先頭に文字が挿入された場合は先頭をchangedとして返す', () => {
    expect(diffInline('bar', 'foobar')).toEqual([
      { kind: 'changed', startColumn: 1, endColumn: 4 },
    ])
  })

  it('末尾に文字が挿入された場合は末尾をchangedとして返す', () => {
    expect(diffInline('foo', 'foobar')).toEqual([
      { kind: 'changed', startColumn: 4, endColumn: 7 },
    ])
  })

  it('中間の文字が変更された場合は該当範囲をchangedとして返す', () => {
    expect(diffInline('foobar', 'foXbar')).toEqual([
      { kind: 'changed', startColumn: 3, endColumn: 4 },
    ])
  })

  it('純粋な削除の場合はdeletionMarkerを返す', () => {
    expect(diffInline('foobar', 'foo')).toEqual([
      { kind: 'deletionMarker', startColumn: 4, endColumn: 4 },
    ])
  })

  it('全文字が削除された場合はdeletionMarkerを返す', () => {
    expect(diffInline('abc', '')).toEqual([
      { kind: 'deletionMarker', startColumn: 1, endColumn: 1 },
    ])
  })

  it('MAX_INLINE_CELLSを超える場合は行全体を1範囲として返す', () => {
    const baseline = 'a'.repeat(448)
    const current = 'b'.repeat(448)
    expect(diffInline(baseline, current)).toEqual([
      { kind: 'changed', startColumn: 1, endColumn: 449 },
    ])
  })

  it('複数の非連続な変更がある場合はそれぞれ独立した範囲を返す', () => {
    expect(diffInline('abcdefgh', 'aXcdeYgh')).toEqual([
      { kind: 'changed', startColumn: 2, endColumn: 3 },
      { kind: 'changed', startColumn: 6, endColumn: 7 },
    ])
  })

  it('絵文字（サロゲートペア）の後に文字が変更された場合はUTF-16オフセットで範囲を返す', () => {
    expect(diffInline('😀abc', '😀aXc')).toEqual([
      { kind: 'changed', startColumn: 4, endColumn: 5 },
    ])
  })

  it('絵文字自体が別の絵文字に変更された場合は2コードユニット分の範囲を返す', () => {
    expect(diffInline('abc😀def', 'abc🎉def')).toEqual([
      { kind: 'changed', startColumn: 4, endColumn: 6 },
    ])
  })

  it('絵文字の前後に変更がある場合はそれぞれ独立した範囲をUTF-16オフセットで返す', () => {
    expect(diffInline('1a😀b2', '9a😀b8')).toEqual([
      { kind: 'changed', startColumn: 1, endColumn: 2 },
      { kind: 'changed', startColumn: 6, endColumn: 7 },
    ])
  })

  it('絵文字の後で文字が純粋に削除された場合はUTF-16オフセットでdeletionMarkerを返す', () => {
    expect(diffInline('😀abc', '😀a')).toEqual([
      { kind: 'deletionMarker', startColumn: 4, endColumn: 4 },
    ])
  })
})
