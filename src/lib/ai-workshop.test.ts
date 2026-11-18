import { describe, expect, it } from 'vitest'
import { buildAiWorkshopUrl, parseAiWorkshopParam, pasteButtonLabel } from './ai-workshop'

describe('parseAiWorkshopParam', () => {
  it.each([
    ['?ai-workshop=true', true],
    ['?a=1&ai-workshop=true', true],
    ['?ai-workshop=true&ai-workshop=false', true],
    ['?ai-workshop=TRUE', false],
    ['?ai-workshop=1', false],
    ['?ai-workshop=false', false],
    ['?ai-workshop=', false],
    ['?ai-workshop', false],
    ['?other=true', false],
    ['', false],
  ])('%s -> %s', (search, expected) => {
    expect(parseAiWorkshopParam(search)).toBe(expected)
  })
})

describe('buildAiWorkshopUrl', () => {
  it('ON でパラメータを付ける（他のクエリとハッシュは保持）', () => {
    expect(buildAiWorkshopUrl('https://x.test/?a=1#h', true)).toBe(
      'https://x.test/?a=1&ai-workshop=true#h',
    )
  })
  it('既にある場合は二重にならない', () => {
    expect(buildAiWorkshopUrl('https://x.test/?ai-workshop=true', true)).toBe(
      'https://x.test/?ai-workshop=true',
    )
  })
  it('他のクエリは URLSearchParams の形式に再シリアライズされる（仕様として許容）', () => {
    expect(buildAiWorkshopUrl('https://x.test/?q=a%20b', true)).toBe(
      'https://x.test/?q=a+b&ai-workshop=true',
    )
  })
  it('OFF でパラメータを削除する', () => {
    expect(buildAiWorkshopUrl('https://x.test/?a=1&ai-workshop=true#h', false)).toBe(
      'https://x.test/?a=1#h',
    )
    expect(buildAiWorkshopUrl('https://x.test/?ai-workshop=true', false)).toBe('https://x.test/')
  })
})

describe('pasteButtonLabel', () => {
  it.each([
    ['', '貼り付け'],
    ['  \n\t', '貼り付け'],
    ['<p>a</p>', 'すべて消して貼り付け'],
  ])('%j -> %s', (value, expected) => {
    expect(pasteButtonLabel(value)).toBe(expected)
  })
})
