// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { copyText, readText } from './clipboard'

const makeDoc = (exec: () => boolean) =>
  ({
    createElement: document.createElement.bind(document),
    body: document.body,
    execCommand: vi.fn(exec),
  }) as unknown as Pick<Document, 'createElement' | 'body' | 'execCommand'>

describe('copyText', () => {
  it('secure context で clipboard 成功なら clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    const r = await copyText('a', { clipboard: { writeText }, isSecureContext: true, doc: makeDoc(() => true) })
    expect(r).toBe('clipboard')
    expect(writeText).toHaveBeenCalledWith('a')
  })

  it('clipboard が reject したら execCommand', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    const r = await copyText('a', { clipboard: { writeText }, isSecureContext: true, doc: makeDoc(() => true) })
    expect(r).toBe('exec-command')
  })

  it('非 secure context では clipboard を呼ばない', async () => {
    const writeText = vi.fn()
    const r = await copyText('a', { clipboard: { writeText }, isSecureContext: false, doc: makeDoc(() => true) })
    expect(r).toBe('exec-command')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('execCommand が false なら failed', async () => {
    const r = await copyText('a', { isSecureContext: false, doc: makeDoc(() => false) })
    expect(r).toBe('failed')
  })

  it('execCommand が例外でも failed で textarea は残らない', async () => {
    const r = await copyText('a', {
      isSecureContext: false,
      doc: makeDoc(() => {
        throw new Error('x')
      }),
    })
    expect(r).toBe('failed')
    expect(document.querySelector('textarea')).toBeNull()
  })
})

describe('readText', () => {
  it('テキストを返す', async () => {
    const r = await readText({ clipboard: { readText: async () => 'abc' }, isSecureContext: true })
    expect(r).toEqual({ result: 'ok', text: 'abc' })
  })
  it('空文字は empty', async () => {
    const r = await readText({ clipboard: { readText: async () => '' }, isSecureContext: true })
    expect(r).toEqual({ result: 'empty' })
  })
  it('非セキュアコンテキストや API なしは unsupported', async () => {
    expect(await readText({ clipboard: { readText: async () => 'a' }, isSecureContext: false })).toEqual({ result: 'unsupported' })
    expect(await readText({ isSecureContext: true })).toEqual({ result: 'unsupported' })
  })
  it('reject は denied', async () => {
    const r = await readText({
      clipboard: { readText: () => Promise.reject(new Error('x')) },
      isSecureContext: true,
    })
    expect(r).toEqual({ result: 'denied' })
  })
})
