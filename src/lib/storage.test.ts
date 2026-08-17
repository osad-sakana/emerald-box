// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  loadCode,
  saveCode,
  clearCode,
  loadPanels,
  savePanels,
  loadSizes,
  saveSizes,
  loadLayout,
  saveLayout,
  loadEditorGroupSize,
  saveEditorGroupSize,
  loadInstructorMode,
  saveInstructorMode,
  loadFontSizes,
  saveFontSizes,
  loadPreviewOptions,
  savePreviewOptions,
  debounce,
  DEFAULT_CODE,
  DEFAULT_PANELS,
  DEFAULT_SIZES,
  DEFAULT_LAYOUT,
  DEFAULT_EDITOR_GROUP_SIZE,
  DEFAULT_FONT_SIZES,
  DEFAULT_PREVIEW_OPTIONS,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
} from './storage'

describe('loadCode / saveCode', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('localStorageが空の場合デフォルト値を返す', () => {
    expect(loadCode()).toEqual(DEFAULT_CODE)
  })

  it('保存したデータを正しく復元する', () => {
    const state = { html: '<p>hi</p>', css: 'body{}', javascript: 'console.log(1)' }
    saveCode(state)
    expect(loadCode()).toEqual(state)
  })

  it('壊れたJSONの場合デフォルトにフォールバックする', () => {
    localStorage.setItem('emerald-box:code:v1', '{invalid json')
    expect(loadCode()).toEqual(DEFAULT_CODE)
  })

  it('フィールドの型が不正な場合はそのフィールドのみデフォルトにフォールバックする', () => {
    localStorage.setItem(
      'emerald-box:code:v1',
      JSON.stringify({ html: 123, css: 'ok', javascript: null })
    )
    expect(loadCode()).toEqual({
      html: DEFAULT_CODE.html,
      css: 'ok',
      javascript: DEFAULT_CODE.javascript,
    })
  })

  it('3言語すべてが正しく保存・復元される', () => {
    const state = { html: 'h', css: 'c', javascript: 'j' }
    saveCode(state)
    expect(loadCode()).toEqual(state)
  })

  it('一部フィールドが欠損している場合、欠損フィールドのみデフォルトになる', () => {
    localStorage.setItem('emerald-box:code:v1', JSON.stringify({ css: 'only-css' }))
    expect(loadCode()).toEqual({
      html: DEFAULT_CODE.html,
      css: 'only-css',
      javascript: DEFAULT_CODE.javascript,
    })
  })
})

describe('clearCode', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('全ストレージキーが削除される', () => {
    localStorage.setItem('emerald-box:code:v1', 'a')
    localStorage.setItem('emerald-box:panels:v1', 'b')
    localStorage.setItem('emerald-box:sizes:v1', 'c')
    localStorage.setItem('emerald-box:layout:v1', 'd')
    localStorage.setItem('emerald-box:editor-group-size:v1', 'e')
    localStorage.setItem('emerald-box:instructor:v1', 'f')
    localStorage.setItem('emerald-box:font-size:v1', 'g')
    localStorage.setItem('emerald-box:preview-options:v1', 'h')

    clearCode()

    expect(localStorage.getItem('emerald-box:code:v1')).toBeNull()
    expect(localStorage.getItem('emerald-box:panels:v1')).toBeNull()
    expect(localStorage.getItem('emerald-box:sizes:v1')).toBeNull()
    expect(localStorage.getItem('emerald-box:layout:v1')).toBeNull()
    expect(localStorage.getItem('emerald-box:editor-group-size:v1')).toBeNull()
    expect(localStorage.getItem('emerald-box:instructor:v1')).toBeNull()
    expect(localStorage.getItem('emerald-box:font-size:v1')).toBeNull()
    expect(localStorage.getItem('emerald-box:preview-options:v1')).toBeNull()
  })
})

describe('loadPanels / savePanels', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('localStorageが空の場合デフォルト値を返す', () => {
    expect(loadPanels()).toEqual(DEFAULT_PANELS)
  })

  it('保存したデータを正しく復元する', () => {
    const state = { html: false, css: true, javascript: true, preview: false }
    savePanels(state)
    expect(loadPanels()).toEqual(state)
  })

  it('壊れたJSONの場合デフォルトにフォールバックする', () => {
    localStorage.setItem('emerald-box:panels:v1', '{invalid json')
    expect(loadPanels()).toEqual(DEFAULT_PANELS)
  })

  it('フィールドの型が不正な場合はそのフィールドのみデフォルトにフォールバックする', () => {
    localStorage.setItem(
      'emerald-box:panels:v1',
      JSON.stringify({ html: 'yes', css: true, javascript: 1, preview: false })
    )
    expect(loadPanels()).toEqual({
      html: DEFAULT_PANELS.html,
      css: true,
      javascript: DEFAULT_PANELS.javascript,
      preview: false,
    })
  })
})

describe('loadSizes / saveSizes', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('localStorageが空の場合デフォルト値を返す', () => {
    expect(loadSizes()).toEqual(DEFAULT_SIZES)
  })

  it('保存したデータを正しく復元する', () => {
    const state = { html: 2, css: 3, javascript: 4, preview: 5 }
    saveSizes(state)
    expect(loadSizes()).toEqual(state)
  })

  it('壊れたJSONの場合デフォルトにフォールバックする', () => {
    localStorage.setItem('emerald-box:sizes:v1', '{invalid json')
    expect(loadSizes()).toEqual(DEFAULT_SIZES)
  })

  it('フィールドの型が不正な場合はそのフィールドのみデフォルトにフォールバックする', () => {
    localStorage.setItem(
      'emerald-box:sizes:v1',
      JSON.stringify({ html: '2', css: 3, javascript: null, preview: 5 })
    )
    expect(loadSizes()).toEqual({
      html: DEFAULT_SIZES.html,
      css: 3,
      javascript: DEFAULT_SIZES.javascript,
      preview: 5,
    })
  })

  it('0や負数、NaNなど正の数以外はデフォルトにフォールバックする', () => {
    localStorage.setItem(
      'emerald-box:sizes:v1',
      JSON.stringify({ html: 0, css: -1, javascript: NaN, preview: 5 })
    )
    expect(loadSizes()).toEqual({
      html: DEFAULT_SIZES.html,
      css: DEFAULT_SIZES.css,
      javascript: DEFAULT_SIZES.javascript,
      preview: 5,
    })
  })
})

describe('loadLayout / saveLayout', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('localStorageが空の場合デフォルト値を返す', () => {
    expect(loadLayout()).toBe(DEFAULT_LAYOUT)
  })

  it('保存したデータを正しく復元する', () => {
    saveLayout('horizontal')
    expect(loadLayout()).toBe('horizontal')
  })

  it('壊れたJSONの場合デフォルトにフォールバックする', () => {
    localStorage.setItem('emerald-box:layout:v1', '{invalid json')
    expect(loadLayout()).toBe(DEFAULT_LAYOUT)
  })

  it("'vertical'/'horizontal'以外の文字列の場合デフォルトにフォールバックする", () => {
    localStorage.setItem('emerald-box:layout:v1', 'diagonal')
    expect(loadLayout()).toBe(DEFAULT_LAYOUT)
  })
})

describe('loadEditorGroupSize / saveEditorGroupSize', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('localStorageが空の場合デフォルト値を返す', () => {
    expect(loadEditorGroupSize()).toBe(DEFAULT_EDITOR_GROUP_SIZE)
  })

  it('保存したデータを正しく復元する', () => {
    saveEditorGroupSize(2.5)
    expect(loadEditorGroupSize()).toBe(2.5)
  })

  it('壊れた値の場合デフォルトにフォールバックする', () => {
    localStorage.setItem('emerald-box:editor-group-size:v1', 'not-a-number')
    expect(loadEditorGroupSize()).toBe(DEFAULT_EDITOR_GROUP_SIZE)
  })

  it('0や負数、NaNなど正の数以外はデフォルトにフォールバックする', () => {
    localStorage.setItem('emerald-box:editor-group-size:v1', '0')
    expect(loadEditorGroupSize()).toBe(DEFAULT_EDITOR_GROUP_SIZE)

    localStorage.setItem('emerald-box:editor-group-size:v1', '-1')
    expect(loadEditorGroupSize()).toBe(DEFAULT_EDITOR_GROUP_SIZE)

    localStorage.setItem('emerald-box:editor-group-size:v1', 'NaN')
    expect(loadEditorGroupSize()).toBe(DEFAULT_EDITOR_GROUP_SIZE)
  })
})

describe('loadInstructorMode / saveInstructorMode', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('localStorageが空の場合falseを返す', () => {
    expect(loadInstructorMode()).toBe(false)
  })

  it('保存したデータを正しく復元する', () => {
    saveInstructorMode(true)
    expect(loadInstructorMode()).toBe(true)
  })

  it("'true'の場合trueを返す", () => {
    localStorage.setItem('emerald-box:instructor:v1', 'true')
    expect(loadInstructorMode()).toBe(true)
  })

  it("'true'以外の値の場合falseを返す", () => {
    localStorage.setItem('emerald-box:instructor:v1', 'false')
    expect(loadInstructorMode()).toBe(false)

    localStorage.setItem('emerald-box:instructor:v1', 'yes')
    expect(loadInstructorMode()).toBe(false)

    localStorage.setItem('emerald-box:instructor:v1', '1')
    expect(loadInstructorMode()).toBe(false)
  })
})

describe('loadFontSizes / saveFontSizes', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('localStorageが空の場合デフォルト値を返す', () => {
    expect(loadFontSizes()).toEqual(DEFAULT_FONT_SIZES)
  })

  it('保存したデータを正しく復元する', () => {
    const state = { normal: 16, instructor: 24 }
    saveFontSizes(state)
    expect(loadFontSizes()).toEqual(state)
  })

  it('壊れたJSONの場合デフォルトにフォールバックする', () => {
    localStorage.setItem('emerald-box:font-size:v1', '{invalid json')
    expect(loadFontSizes()).toEqual(DEFAULT_FONT_SIZES)
  })

  it('フィールドの型が不正な場合はそのフィールドのみデフォルトにフォールバックする', () => {
    localStorage.setItem(
      'emerald-box:font-size:v1',
      JSON.stringify({ normal: '16', instructor: 24 })
    )
    expect(loadFontSizes()).toEqual({
      normal: DEFAULT_FONT_SIZES.normal,
      instructor: 24,
    })
  })

  it('MIN_FONT_SIZE未満の場合MIN_FONT_SIZEにクランプされる', () => {
    localStorage.setItem(
      'emerald-box:font-size:v1',
      JSON.stringify({ normal: MIN_FONT_SIZE - 5, instructor: MIN_FONT_SIZE - 100 })
    )
    expect(loadFontSizes()).toEqual({
      normal: MIN_FONT_SIZE,
      instructor: MIN_FONT_SIZE,
    })
  })

  it('MAX_FONT_SIZE超過の場合MAX_FONT_SIZEにクランプされる', () => {
    localStorage.setItem(
      'emerald-box:font-size:v1',
      JSON.stringify({ normal: MAX_FONT_SIZE + 5, instructor: MAX_FONT_SIZE + 100 })
    )
    expect(loadFontSizes()).toEqual({
      normal: MAX_FONT_SIZE,
      instructor: MAX_FONT_SIZE,
    })
  })

  it('InfinityやNaNの場合デフォルトにフォールバックする', () => {
    localStorage.setItem(
      'emerald-box:font-size:v1',
      JSON.stringify({ normal: Infinity, instructor: null })
    )
    expect(loadFontSizes()).toEqual({
      normal: DEFAULT_FONT_SIZES.normal,
      instructor: DEFAULT_FONT_SIZES.instructor,
    })
  })
})

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('指定時間経過後に関数が呼ばれる', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 500)

    debounced()
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(499)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('連続呼び出しで最後の1回だけ実行される', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 500)

    debounced()
    vi.advanceTimersByTime(100)
    debounced()
    vi.advanceTimersByTime(100)
    debounced()
    vi.advanceTimersByTime(500)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('遅延前に呼び出すとタイマーがリセットされる', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 500)

    debounced()
    vi.advanceTimersByTime(400)
    expect(fn).not.toHaveBeenCalled()

    debounced()
    vi.advanceTimersByTime(400)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('引数が正しく伝播する', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 500)

    debounced('a', 1)
    vi.advanceTimersByTime(500)

    expect(fn).toHaveBeenCalledWith('a', 1)
  })
})

describe('イミュータビリティ検証', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loadCode()はDEFAULT_CODEと異なるオブジェクト参照を返す', () => {
    expect(loadCode()).not.toBe(DEFAULT_CODE)
  })

  it('loadPanels()はDEFAULT_PANELSと異なるオブジェクト参照を返す', () => {
    expect(loadPanels()).not.toBe(DEFAULT_PANELS)
  })

  it('loadSizes()はDEFAULT_SIZESと異なるオブジェクト参照を返す', () => {
    expect(loadSizes()).not.toBe(DEFAULT_SIZES)
  })

  it('loadFontSizes()はDEFAULT_FONT_SIZESと異なるオブジェクト参照を返す', () => {
    expect(loadFontSizes()).not.toBe(DEFAULT_FONT_SIZES)
  })

  it('返却オブジェクトを変更しても次回loadに影響しない', () => {
    const code = loadCode()
    code.html = '改変'
    expect(loadCode().html).toBe(DEFAULT_CODE.html)

    const panels = loadPanels()
    panels.html = !panels.html
    expect(loadPanels()).toEqual(DEFAULT_PANELS)

    const sizes = loadSizes()
    sizes.html = 999
    expect(loadSizes()).toEqual(DEFAULT_SIZES)

    const fontSizes = loadFontSizes()
    fontSizes.normal = 999
    expect(loadFontSizes()).toEqual(DEFAULT_FONT_SIZES)
  })
})

describe('loadPreviewOptions / savePreviewOptions', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('localStorageが空の場合デフォルト値を返す（tailwind: true, resetCss: false）', () => {
    expect(loadPreviewOptions()).toEqual(DEFAULT_PREVIEW_OPTIONS)
  })

  it('保存したデータを正しく復元する', () => {
    const options = { resetCss: true, tailwind: false }
    savePreviewOptions(options)
    expect(loadPreviewOptions()).toEqual(options)
  })

  it('壊れたJSONの場合デフォルトにフォールバックする', () => {
    localStorage.setItem('emerald-box:preview-options:v1', '{invalid json')
    expect(loadPreviewOptions()).toEqual(DEFAULT_PREVIEW_OPTIONS)
  })

  it('フィールドの型が不正な場合はそのフィールドのみデフォルトにフォールバックする', () => {
    localStorage.setItem(
      'emerald-box:preview-options:v1',
      JSON.stringify({ resetCss: 'yes', tailwind: false })
    )
    expect(loadPreviewOptions()).toEqual({
      resetCss: DEFAULT_PREVIEW_OPTIONS.resetCss,
      tailwind: false,
    })
  })

  it('返却オブジェクトを変更しても次回loadに影響しない', () => {
    const options = loadPreviewOptions()
    options.resetCss = true
    expect(loadPreviewOptions()).toEqual(DEFAULT_PREVIEW_OPTIONS)
  })
})
