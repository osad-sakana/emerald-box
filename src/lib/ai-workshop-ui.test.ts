// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { attachAiWorkshop, type AiWorkshopEditorLike } from './ai-workshop-ui'
import type { ReadResult } from './clipboard'

class Range {
  constructor(public a: number, public b: number, public c: number, public d: number) {}
}

const setup = (search: string, read: ReadResult, values = { html: '', css: 'a{}', javascript: '' }) => {
  document.documentElement.removeAttribute('data-ai-workshop')
  document.body.innerHTML = `
    <button id="btn-ai-workshop" aria-pressed="false"></button>
    <span id="paste-status"></span>
    <button class="paste-replace" data-lang="html" disabled></button>
    <button class="paste-replace" data-lang="css" disabled></button>
    <button class="paste-replace" data-lang="javascript" disabled></button>`
  const make = (): AiWorkshopEditorLike => ({
    getModel: () => ({ getLineCount: () => 1, getLineMaxColumn: () => 1 }),
    pushUndoStop: vi.fn(),
    executeEdits: vi.fn(),
    focus: vi.fn(),
    trigger: vi.fn(),
  })
  const editors = { html: make(), css: make(), javascript: make() }
  const current = { ...values }
  const history = { replaceState: vi.fn() }
  const events: boolean[] = []
  document.addEventListener('ai-workshop:state', (e) => events.push((e as CustomEvent).detail))
  const api = attachAiWorkshop({
    doc: document,
    location: { search, href: `https://x.test/${search}` },
    history,
    editors,
    models: {
      html: { getValue: () => current.html },
      css: { getValue: () => current.css },
      javascript: { getValue: () => current.javascript },
    },
    monaco: { Range },
    readClipboard: async () => read,
    isMac: false,
  })
  return { api, editors, history, events, current }
}

const btn = (lang: string) => document.querySelector<HTMLButtonElement>(`.paste-replace[data-lang="${lang}"]`)!
const status = () => document.getElementById('paste-status')!.textContent

describe('attachAiWorkshop', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('クエリなしは通常モードで、状態イベントを false で送る', () => {
    const { api, events } = setup('', { result: 'empty' })
    expect(api.isEnabled()).toBe(false)
    expect(document.documentElement.hasAttribute('data-ai-workshop')).toBe(false)
    expect(events).toEqual([false])
  })

  it('クエリ true で ON、ラベルは内容で決まる', () => {
    const { events } = setup('?ai-workshop=true', { result: 'empty' })
    expect(document.documentElement.getAttribute('data-ai-workshop')).toBe('true')
    expect(events).toEqual([true])
    expect(btn('html').textContent).toBe('貼り付け')
    expect(btn('css').textContent).toBe('すべて消して貼り付け')
    expect(btn('html').disabled).toBe(false)
  })

  it('メニュー切替で URL を更新し、OFF で案内を消す', () => {
    const { history } = setup('?ai-workshop=true', { result: 'empty' })
    document.getElementById('btn-ai-workshop')!.click()
    expect(history.replaceState).toHaveBeenCalledWith(null, '', 'https://x.test/')
    expect(document.documentElement.hasAttribute('data-ai-workshop')).toBe(false)
    expect(document.getElementById('btn-ai-workshop')!.getAttribute('aria-pressed')).toBe('false')
  })

  it('クリップボードの内容で全置換する', async () => {
    const { editors } = setup('?ai-workshop=true', { result: 'ok', text: 'new' })
    btn('css').click()
    await vi.waitFor(() => expect(editors.css.executeEdits).toHaveBeenCalled())
    expect(status()).toBe('')
  })

  it('空のクリップボードでは置換せず案内する', async () => {
    const { editors } = setup('?ai-workshop=true', { result: 'empty' })
    btn('css').click()
    await vi.waitFor(() => expect(status()).toBe('クリップボードが空です'))
    expect(editors.css.executeEdits).not.toHaveBeenCalled()
  })

  it('読み取れない場合は全選択して手動貼り付けを案内する', async () => {
    const { editors } = setup('?ai-workshop=true', { result: 'denied' })
    btn('html').click()
    await vi.waitFor(() => expect(status()).toContain('Ctrl+V'))
    expect(editors.html.trigger).toHaveBeenCalledWith('paste-replace', 'editor.action.selectAll', null)
    expect(editors.html.executeEdits).not.toHaveBeenCalled()
  })

  it('内容変更でラベルを更新し案内を消す（OFF のときは何もしない）', () => {
    const { api, current } = setup('?ai-workshop=true', { result: 'denied' })
    document.getElementById('paste-status')!.textContent = '案内'
    current.html = '<p>x</p>'
    api.onContentChange('html')
    expect(btn('html').textContent).toBe('すべて消して貼り付け')
    expect(status()).toBe('')

    const off = setup('', { result: 'denied' })
    off.current.html = 'x'
    off.api.onContentChange('html')
    expect(btn('html').textContent).toBe('')
  })
})
