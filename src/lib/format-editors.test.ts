import { describe, expect, it, vi } from 'vitest'
import { formatEditors } from './format-editors'

const ok = () => ({ getAction: () => ({ run: vi.fn().mockResolvedValue(undefined) }) })

describe('formatEditors', () => {
  it('全エディタの formatDocument を実行する', async () => {
    const run = vi.fn().mockResolvedValue(undefined)
    const getAction = vi.fn(() => ({ run }))
    const r = await formatEditors({ a: { getAction }, b: { getAction } })
    expect(getAction).toHaveBeenCalledWith('editor.action.formatDocument')
    expect(run).toHaveBeenCalledTimes(2)
    expect(r).toEqual({ formatted: 2, failed: 0 })
  })

  it('一部が失敗しても他は整形する', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const bad = { getAction: () => ({ run: vi.fn().mockRejectedValue(new Error('x')) }) }
    const r = await formatEditors({ a: ok(), b: bad })
    expect(r).toEqual({ formatted: 1, failed: 1 })
  })

  it('アクションが無ければ失敗扱い', async () => {
    const r = await formatEditors({ a: { getAction: () => null } })
    expect(r).toEqual({ formatted: 0, failed: 1 })
  })
})
