import { describe, it, expect } from 'vitest'
import {
  LICENSES,
  MIT_LICENSE_TEXT,
  OFL_NOTICE_TEXT,
  CC_BY_NOTICE_TEXT,
  PUBLIC_DOMAIN_NOTICE_TEXT,
} from './licenses'

describe('LICENSES', () => {
  it('空でないこと', () => {
    expect(LICENSES.length).toBeGreaterThan(0)
  })

  it('全エントリがname, license, copyright, urlを持つこと', () => {
    for (const entry of LICENSES) {
      expect(typeof entry.name).toBe('string')
      expect(entry.name.length).toBeGreaterThan(0)
      expect(typeof entry.license).toBe('string')
      expect(entry.license.length).toBeGreaterThan(0)
      expect(typeof entry.copyright).toBe('string')
      expect(entry.copyright.length).toBeGreaterThan(0)
      expect(typeof entry.url).toBe('string')
      expect(entry.url.length).toBeGreaterThan(0)
    }
  })

  it('versionを持つエントリは文字列型であること', () => {
    for (const entry of LICENSES) {
      if (entry.version !== undefined) {
        expect(typeof entry.version).toBe('string')
      }
    }
  })
})

describe('ライセンステキスト定数', () => {
  it('MIT_LICENSE_TEXTが空でないこと', () => {
    expect(MIT_LICENSE_TEXT.length).toBeGreaterThan(0)
  })

  it('OFL_NOTICE_TEXTが空でないこと', () => {
    expect(OFL_NOTICE_TEXT.length).toBeGreaterThan(0)
  })

  it('CC_BY_NOTICE_TEXTが空でないこと', () => {
    expect(CC_BY_NOTICE_TEXT.length).toBeGreaterThan(0)
  })

  it('PUBLIC_DOMAIN_NOTICE_TEXTが空でないこと', () => {
    expect(PUBLIC_DOMAIN_NOTICE_TEXT.length).toBeGreaterThan(0)
  })
})
