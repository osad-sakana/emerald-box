import { describe, expect, it } from 'vitest'
import { SNIPPETS, SNIPPET_LANG_LABELS, findSnippet, snippetsByLang } from './snippets'

const LANGS = ['html', 'css', 'javascript'] as const

describe('SNIPPETS', () => {
  it('id がすべて一意', () => {
    const ids = SNIPPETS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('必須項目が空でなく、lang が有効', () => {
    for (const s of SNIPPETS) {
      expect(LANGS).toContain(s.lang)
      expect(s.category.trim()).not.toBe('')
      expect(s.label.trim()).not.toBe('')
      expect(s.description.trim()).not.toBe('')
      expect(s.code.trim()).not.toBe('')
    }
  })

  it('3言語それぞれに1件以上ある', () => {
    for (const lang of LANGS) expect(snippetsByLang(lang).length).toBeGreaterThan(0)
  })

  it('コードが2文字以上（閉じタグ自動生成の発火条件 ">" 単体に当たらない）', () => {
    for (const s of SNIPPETS) expect(s.code).not.toBe('>')
  })

  it('インデントは半角スペース2の倍数でタブなし、行末空白・末尾改行なし', () => {
    for (const s of SNIPPETS) {
      expect(s.code).not.toContain('\t')
      expect(s.code.endsWith('\n')).toBe(false)
      for (const line of s.code.split('\n')) {
        expect(line).toBe(line.trimEnd())
        const indent = line.length - line.trimStart().length
        expect(indent % 2).toBe(0)
      }
    }
  })

  it('HTML パーツに html/body/script タグを含まない', () => {
    for (const s of snippetsByLang('html')) {
      expect(s.code).not.toMatch(/<(html|body|script)/i)
    }
  })

  it('JS が参照する #id は HTML パーツのいずれかに存在する', () => {
    const htmlCode = snippetsByLang('html').map((s) => s.code).join('\n')
    for (const s of snippetsByLang('javascript')) {
      for (const m of s.code.matchAll(/querySelector\('#([\w-]+)'\)/g)) {
        expect(htmlCode).toContain(`id="${m[1]}"`)
      }
    }
  })

  it('JS パーツ同士で const の名前が重ならない', () => {
    const names = snippetsByLang('javascript').flatMap((s) =>
      [...s.code.matchAll(/\bconst\s+(\w+)/g)].map((m) => m[1]),
    )
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('findSnippet / snippetsByLang', () => {
  it('存在する id を返し、存在しなければ undefined', () => {
    expect(findSnippet('html-heading-h1')?.lang).toBe('html')
    expect(findSnippet('nothing')).toBeUndefined()
  })

  it('snippetsByLang は新しい配列を返し元を変えない', () => {
    const before = SNIPPETS.length
    const a = snippetsByLang('css')
    expect(a).not.toBe(SNIPPETS)
    expect(a.every((s) => s.lang === 'css')).toBe(true)
    expect(SNIPPETS.length).toBe(before)
  })

  it('言語ラベルが日本語UI用に定義されている', () => {
    expect(SNIPPET_LANG_LABELS).toEqual({ html: 'HTML', css: 'CSS', javascript: 'JS' })
  })
})
