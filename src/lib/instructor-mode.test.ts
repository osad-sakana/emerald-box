import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createInstructorController } from './instructor-mode'
import type { FontSizes } from './storage'

class FakeDecorationsCollection {
  set = vi.fn()
  clear = vi.fn()
}

class FakeEditor {
  updateOptions = vi.fn()
  layout = vi.fn()
  collection = new FakeDecorationsCollection()
  createDecorationsCollection = vi.fn(() => this.collection)
}

class FakeModel {
  private value: string

  constructor(initialValue: string) {
    this.value = initialValue
  }

  getValue = vi.fn(() => this.value)
  getLineCount = vi.fn(() => (this.value === '' ? 1 : this.value.split('\n').length))

  setValue(next: string) {
    this.value = next
  }
}

class FakeRange {
  startLine: number
  startColumn: number
  endLine: number
  endColumn: number

  constructor(startLine: number, startColumn: number, endLine: number, endColumn: number) {
    this.startLine = startLine
    this.startColumn = startColumn
    this.endLine = endLine
    this.endColumn = endColumn
  }
}

class FakeMonaco {
  Range = FakeRange
}

const FONT_SIZES: FontSizes = { normal: 14, instructor: 20 }

function setup() {
  const editors = {
    html: new FakeEditor(),
    css: new FakeEditor(),
    javascript: new FakeEditor(),
  }
  const models = {
    html: new FakeModel('<div></div>'),
    css: new FakeModel('body {}'),
    javascript: new FakeModel('const a = 1'),
  }
  const monaco = new FakeMonaco()
  const controller = createInstructorController({
    editors,
    models,
    monaco,
    initialFontSizes: FONT_SIZES,
  })
  return { editors, models, monaco, controller }
}

describe('createInstructorController', () => {
  let ctx: ReturnType<typeof setup>

  beforeEach(() => {
    ctx = setup()
  })

  it('初期状態では isEnabled() が false を返す', () => {
    expect(ctx.controller.isEnabled()).toBe(false)
  })

  it('setEnabled(true) でフォントサイズが instructor サイズに変更される', () => {
    ctx.controller.setEnabled(true)
    for (const lang of ['html', 'css', 'javascript'] as const) {
      expect(ctx.editors[lang].updateOptions).toHaveBeenCalledWith({ fontSize: 20 })
      expect(ctx.editors[lang].layout).toHaveBeenCalled()
    }
    expect(ctx.controller.isEnabled()).toBe(true)
  })

  it('setEnabled(false) でフォントサイズが normal サイズに戻る', () => {
    ctx.controller.setEnabled(true)
    ctx.controller.setEnabled(false)
    for (const lang of ['html', 'css', 'javascript'] as const) {
      expect(ctx.editors[lang].updateOptions).toHaveBeenLastCalledWith({ fontSize: 14 })
    }
  })

  it('setEnabled(false) で baseline がクリアされデコレーションも clear される', () => {
    ctx.controller.setEnabled(true)
    ctx.controller.captureBaseline()
    expect(ctx.controller.hasBaseline()).toBe(true)

    for (const lang of ['html', 'css', 'javascript'] as const) {
      ctx.editors[lang].collection.clear.mockClear()
    }

    ctx.controller.setEnabled(false)

    expect(ctx.controller.hasBaseline()).toBe(false)
    for (const lang of ['html', 'css', 'javascript'] as const) {
      expect(ctx.editors[lang].collection.clear).toHaveBeenCalled()
    }
  })

  it('getCurrentFontSize() は enabled の状態に応じたサイズを返す', () => {
    expect(ctx.controller.getCurrentFontSize()).toBe(14)
    ctx.controller.setEnabled(true)
    expect(ctx.controller.getCurrentFontSize()).toBe(20)
    ctx.controller.setEnabled(false)
    expect(ctx.controller.getCurrentFontSize()).toBe(14)
  })

  it('setFontSizes() で全エディタに新しいサイズが適用される', () => {
    ctx.controller.setFontSizes({ normal: 16, instructor: 24 })
    for (const lang of ['html', 'css', 'javascript'] as const) {
      expect(ctx.editors[lang].updateOptions).toHaveBeenCalledWith({ fontSize: 16 })
    }
    expect(ctx.controller.getCurrentFontSize()).toBe(16)

    ctx.controller.setEnabled(true)
    ctx.controller.setFontSizes({ normal: 16, instructor: 28 })
    for (const lang of ['html', 'css', 'javascript'] as const) {
      expect(ctx.editors[lang].updateOptions).toHaveBeenCalledWith({ fontSize: 28 })
    }
    expect(ctx.controller.getCurrentFontSize()).toBe(28)
  })

  it('hasBaseline() は captureBaseline 前は false、後は true を返す', () => {
    expect(ctx.controller.hasBaseline()).toBe(false)
    ctx.controller.captureBaseline()
    expect(ctx.controller.hasBaseline()).toBe(true)
  })

  it('captureBaseline() は各モデルの getValue() を呼び baseline を記録する', () => {
    ctx.controller.captureBaseline()
    expect(ctx.models.html.getValue).toHaveBeenCalled()
    expect(ctx.models.css.getValue).toHaveBeenCalled()
    expect(ctx.models.javascript.getValue).toHaveBeenCalled()
    expect(ctx.controller.hasBaseline()).toBe(true)
  })

  it('refreshDecorations() は enabled=false のときデコレーションをクリアする', () => {
    ctx.controller.refreshDecorations()
    for (const lang of ['html', 'css', 'javascript'] as const) {
      expect(ctx.editors[lang].collection.clear).toHaveBeenCalled()
      expect(ctx.editors[lang].collection.set).not.toHaveBeenCalled()
    }
  })

  it('refreshDecorations() は enabled=true かつ baseline があれば diff 結果に基づきデコレーションを設定する', () => {
    ctx.controller.captureBaseline()
    ctx.controller.setEnabled(true)
    ctx.models.html.setValue('<div>changed</div>')

    ctx.editors.html.collection.set.mockClear()
    ctx.controller.refreshDecorations()

    expect(ctx.editors.html.collection.set).toHaveBeenCalled()
    const decorations = ctx.editors.html.collection.set.mock.calls[0][0]
    expect(decorations.length).toBeGreaterThan(0)
  })

  it('refreshDecorations() で行追加時のデコレーションが設定される', () => {
    ctx.controller.captureBaseline()
    ctx.controller.setEnabled(true)
    ctx.models.css.setValue('body {}\n.new { color: red; }')

    ctx.editors.css.collection.set.mockClear()
    ctx.controller.refreshDecorations()

    const decorations = ctx.editors.css.collection.set.mock.calls[0][0]
    const addedDecoration = decorations.find(
      (d: { options: { linesDecorationsClassName?: string } }) =>
        d.options.linesDecorationsClassName === 'eb-diff-gutter',
    )
    expect(addedDecoration).toBeDefined()
    expect(addedDecoration.options.className).toBe('eb-diff-line')
  })

  it('refreshDecorations() で行変更時のインラインデコレーションが設定される', () => {
    ctx.controller.captureBaseline()
    ctx.controller.setEnabled(true)
    ctx.models.javascript.setValue('const a = 2')

    ctx.editors.javascript.collection.set.mockClear()
    ctx.controller.refreshDecorations()

    const decorations = ctx.editors.javascript.collection.set.mock.calls[0][0]
    const inlineDecoration = decorations.find(
      (d: { options: { inlineClassName?: string } }) => d.options.inlineClassName === 'eb-diff-inline',
    )
    expect(inlineDecoration).toBeDefined()
  })

  it('refreshDecorations() で行削除時のデコレーションが設定される', () => {
    ctx.models.html.setValue('<div></div>\n<span></span>')
    ctx.controller.captureBaseline()
    ctx.controller.setEnabled(true)
    ctx.models.html.setValue('<div></div>')

    ctx.editors.html.collection.set.mockClear()
    ctx.controller.refreshDecorations()

    const decorations = ctx.editors.html.collection.set.mock.calls[0][0]
    const deletedDecoration = decorations.find(
      (d: { options: { linesDecorationsClassName?: string } }) =>
        d.options.linesDecorationsClassName === 'eb-diff-deleted-gutter',
    )
    expect(deletedDecoration).toBeDefined()
  })

  it('dispose() で全デコレーションがクリアされる', () => {
    ctx.controller.captureBaseline()
    ctx.controller.setEnabled(true)

    for (const lang of ['html', 'css', 'javascript'] as const) {
      ctx.editors[lang].collection.clear.mockClear()
    }

    ctx.controller.dispose()

    for (const lang of ['html', 'css', 'javascript'] as const) {
      expect(ctx.editors[lang].collection.clear).toHaveBeenCalled()
    }
  })

  it('setEnabled(true) で baseline がなくてもエラーにならずデコレーションは設定されない', () => {
    expect(() => ctx.controller.setEnabled(true)).not.toThrow()
    expect(ctx.controller.hasBaseline()).toBe(false)
    for (const lang of ['html', 'css', 'javascript'] as const) {
      expect(ctx.editors[lang].collection.set).not.toHaveBeenCalled()
    }
  })
})
