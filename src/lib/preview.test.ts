// @vitest-environment happy-dom
import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import { PreviewController } from './preview'
import type { CodeState } from './storage'

describe('PreviewController', () => {
  let host: HTMLDivElement
  let controller: PreviewController

  beforeEach(() => {
    host = document.createElement('div')
    document.body.appendChild(host)
    controller = new PreviewController(host)
  })

  afterEach(() => {
    host.remove()
  })

  const state: CodeState = {
    html: '<h1 id="marker">見出し</h1>',
    css: '#marker { color: red; }',
    javascript: 'window.__markerJs = true',
  }

  describe('コンストラクタ', () => {
    it('host に iframe が追加される', () => {
      const frame = host.querySelector('iframe')
      expect(frame).not.toBeNull()
    })

    it('iframe の sandbox 属性が allow-scripts allow-modals で allow-same-origin を含まない', () => {
      const frame = host.querySelector('iframe') as HTMLIFrameElement
      expect(frame.getAttribute('sandbox')).toBe('allow-scripts allow-modals')
      expect(frame.getAttribute('sandbox')).not.toContain('allow-same-origin')
    })

    it('iframe の title 属性が プレビュー になる', () => {
      const frame = host.querySelector('iframe') as HTMLIFrameElement
      expect(frame.getAttribute('title')).toBe('プレビュー')
    })
  })

  describe('renderMarkup', () => {
    it('frame.srcdoc に HTML/CSS が含まれる', () => {
      controller.renderMarkup(state)
      const frame = host.querySelector('iframe') as HTMLIFrameElement
      expect(frame.srcdoc).toContain(state.html)
      expect(frame.srcdoc).toContain(state.css)
    })

    it('frame.srcdoc にユーザーの JavaScript が含まれない', () => {
      controller.renderMarkup(state)
      const frame = host.querySelector('iframe') as HTMLIFrameElement
      expect(frame.srcdoc).not.toContain(state.javascript)
    })
  })

  describe('runWithJs', () => {
    it('frame.srcdoc にユーザーの JavaScript が含まれる', () => {
      controller.runWithJs(state)
      const frame = host.querySelector('iframe') as HTMLIFrameElement
      expect(frame.srcdoc).toContain(state.javascript)
    })
  })

  describe('プレビューオプション（reset CSS / Tailwind）', () => {
    it('デフォルトでは Tailwind CDN の script タグが含まれない', () => {
      controller.renderMarkup(state)
      const frame = host.querySelector('iframe') as HTMLIFrameElement
      expect(frame.srcdoc).not.toContain('cdn.tailwindcss.com')
    })

    it('デフォルトでは reset CSS は含まれない', () => {
      controller.renderMarkup(state)
      const frame = host.querySelector('iframe') as HTMLIFrameElement
      expect(frame.srcdoc).not.toContain('box-sizing: border-box')
    })

    it('tailwind: true にすると Tailwind CDN の script タグが含まれる', () => {
      controller.setOptions({ resetCss: false, tailwind: true })
      controller.renderMarkup(state)
      const frame = host.querySelector('iframe') as HTMLIFrameElement
      expect(frame.srcdoc).toContain('cdn.tailwindcss.com')
    })

    it('resetCss: true にすると reset CSS が含まれる', () => {
      controller.setOptions({ resetCss: true, tailwind: true })
      controller.renderMarkup(state)
      const frame = host.querySelector('iframe') as HTMLIFrameElement
      expect(frame.srcdoc).toContain('box-sizing: border-box')
    })

    it('resetCss/tailwind を両方有効にすると両方が含まれる', () => {
      controller.setOptions({ resetCss: true, tailwind: true })
      controller.renderMarkup(state)
      const frame = host.querySelector('iframe') as HTMLIFrameElement
      expect(frame.srcdoc).toContain('cdn.tailwindcss.com')
      expect(frame.srcdoc).toContain('box-sizing: border-box')
    })

    it('reset CSS は <head> 内（<body> より前）に置かれる', () => {
      controller.setOptions({ resetCss: true, tailwind: true })
      controller.renderMarkup(state)
      const frame = host.querySelector('iframe') as HTMLIFrameElement
      const resetIndex = frame.srcdoc.indexOf('box-sizing: border-box')
      const headCloseIndex = frame.srcdoc.indexOf('</head>')
      const bodyIndex = frame.srcdoc.indexOf('<body>')
      expect(resetIndex).toBeGreaterThan(-1)
      expect(resetIndex).toBeLessThan(headCloseIndex)
      expect(resetIndex).toBeLessThan(bodyIndex)
    })

    it('runWithJs でも設定したオプションが反映される', () => {
      controller.setOptions({ resetCss: false, tailwind: false })
      controller.runWithJs(state)
      const frame = host.querySelector('iframe') as HTMLIFrameElement
      expect(frame.srcdoc).not.toContain('cdn.tailwindcss.com')
    })

    it('コンストラクタで渡した初期オプションが反映される', () => {
      const customHost = document.createElement('div')
      document.body.appendChild(customHost)
      const customController = new PreviewController(customHost, {
        resetCss: true,
        tailwind: false,
      })
      customController.renderMarkup(state)
      const frame = customHost.querySelector('iframe') as HTMLIFrameElement
      expect(frame.srcdoc).not.toContain('cdn.tailwindcss.com')
      expect(frame.srcdoc).toContain('box-sizing: border-box')
      customHost.remove()
    })

    it('setOptions に渡したオブジェクトを後から変更しても反映に影響しない', () => {
      const options = { resetCss: false, tailwind: true }
      controller.setOptions(options)
      options.tailwind = false
      controller.renderMarkup(state)
      const frame = host.querySelector('iframe') as HTMLIFrameElement
      expect(frame.srcdoc).toContain('cdn.tailwindcss.com')
    })
  })

  describe('forceStop', () => {
    it('元の iframe が DOM から削除される', () => {
      const originalFrame = host.querySelector('iframe') as HTMLIFrameElement
      controller.forceStop(state)
      expect(originalFrame.isConnected).toBe(false)
    })

    it('新しい iframe が host に追加される', () => {
      const originalFrame = host.querySelector('iframe') as HTMLIFrameElement
      controller.forceStop(state)
      const frames = host.querySelectorAll('iframe')
      expect(frames.length).toBe(1)
      expect(frames[0]).not.toBe(originalFrame)
    })

    it('新しい iframe にも sandbox 属性が正しく設定される', () => {
      controller.forceStop(state)
      const frame = host.querySelector('iframe') as HTMLIFrameElement
      expect(frame.getAttribute('sandbox')).toBe('allow-scripts allow-modals')
    })

    it('呼出後は renderMarkup の結果（JS なし）で再描画される', () => {
      controller.forceStop(state)
      const frame = host.querySelector('iframe') as HTMLIFrameElement
      expect(frame.srcdoc).toContain(state.html)
      expect(frame.srcdoc).not.toContain(state.javascript)
    })
  })
})
