import { describe, expect, it } from 'vitest'
import { WIDE_SCREEN_MIN_WIDTH, resolveInitialDrawerOpen } from './snippet-drawer-initial'

describe('resolveInitialDrawerOpen', () => {
  it('保存値が true なら画面幅によらず開く', () =>
    expect(resolveInitialDrawerOpen(true, 800)).toBe(true))
  it('保存値が false なら広い画面でも閉じる', () =>
    expect(resolveInitialDrawerOpen(false, 1920)).toBe(false))
  it('未保存で広い画面なら開く', () =>
    expect(resolveInitialDrawerOpen(null, WIDE_SCREEN_MIN_WIDTH)).toBe(true))
  it('未保存で狭い画面なら閉じる', () =>
    expect(resolveInitialDrawerOpen(null, WIDE_SCREEN_MIN_WIDTH - 1)).toBe(false))
})
