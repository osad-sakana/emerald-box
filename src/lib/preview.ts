// iframe を用いたライブプレビューと、JS強制終了（破棄・再生成）の制御。
import { DEFAULT_PREVIEW_OPTIONS, type CodeState, type PreviewOptions } from './storage'

const TAILWIND_CDN = 'https://cdn.tailwindcss.com'

// 「Reset CSS」有効時に適用する最小限のブラウザデフォルトリセット。
// ユーザーCSSはbody末尾にあり常にこれより優先されるため、head内に置いてよい。
const RESET_CSS = `*, *::before, *::after { box-sizing: border-box; }
body, h1, h2, h3, h4, h5, h6, p, figure, blockquote, dl, dd { margin: 0; }
ul[role='list'], ol[role='list'] { list-style: none; padding: 0; }
body { min-height: 100vh; line-height: 1.5; }
img, picture { max-width: 100%; display: block; }
input, button, textarea, select { font: inherit; }`

// includeJs=false の間、HTML内の onclick 等から未定義関数を呼ぶと
// ReferenceError が素の Uncaught として出て分かりづらいため、
// 「▶ JS実行」を押すよう案内する警告に差し替える。
const LIVE_PREVIEW_GUARD = `<script>
window.addEventListener('error', function (e) {
  console.warn('JSはまだ実行されていません。「▶ JS実行」を押すとHTMLのonclickなどから呼び出す関数が有効になります。')
  e.preventDefault()
})
<\/script>`

// プレビュー用のHTMLドキュメントを組み立てる。
// includeJs=false のときは <script> を埋め込まない（HTML/CSSのみ反映）。
function buildDocument(state: CodeState, includeJs: boolean, options: PreviewOptions): string {
  const js = includeJs ? `<script>\n${state.javascript}\n<\/script>` : ''
  const guard = includeJs ? '' : LIVE_PREVIEW_GUARD
  const tailwindScript = options.tailwind ? `<script src="${TAILWIND_CDN}"><\/script>` : ''
  const resetStyle = options.resetCss ? `<style>${RESET_CSS}</style>` : ''
  // ユーザーCSSはbody末尾に置く: Tailwind CDNは実行後に自身の生成CSSを
  // <head>末尾へ追加するため、<head>内に置くと同じ詳細度のセレクタ（h1等）が
  // Preflightに上書きされてしまう。body末尾ならDOM順序で必ず後に来て勝つ。
  // ただし詳細度が同じ場合に限る。Tailwindのユーティリティクラス（例: text-xl）は
  // 要素セレクタより詳細度が高いため、順序に関係なく引き続き優先される。
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${tailwindScript}
  ${resetStyle}
  ${guard}
</head>
<body>
${state.html}
<style>${state.css}</style>
${js}
</body>
</html>`
}

export class PreviewController {
  private host: HTMLElement
  private frame: HTMLIFrameElement
  private options: PreviewOptions

  constructor(host: HTMLElement, options: PreviewOptions = DEFAULT_PREVIEW_OPTIONS) {
    this.host = host
    this.options = options
    this.frame = this.createFrame()
  }

  // reset CSS / Tailwind CDN の有効・無効を更新する。反映には renderMarkup 等の再呼び出しが必要。
  setOptions(options: PreviewOptions): void {
    this.options = options
  }

  // Tailwindクラスを動的に付与した新しいiframeを生成する。
  private createFrame(): HTMLIFrameElement {
    const frame = document.createElement('iframe')
    frame.className = 'h-full w-full bg-white'
    frame.setAttribute('title', 'プレビュー')
    // allow-scripts: JS実行を許可。allow-same-origin は付けない（安全側）。
    frame.setAttribute('sandbox', 'allow-scripts allow-modals')
    this.host.appendChild(frame)
    return frame
  }

  // HTML/CSS のみ反映（JSは実行しない）。ライブプレビュー用。
  renderMarkup(state: CodeState): void {
    this.frame.srcdoc = buildDocument(state, false, this.options)
  }

  // JSを含めて実行する。「▶ JS実行」ボタン用。
  runWithJs(state: CodeState): void {
    this.frame.srcdoc = buildDocument(state, true, this.options)
  }

  // 暴走スクリプトを止める。iframeをDOMから完全に削除し、再生成する。
  forceStop(state: CodeState): void {
    this.frame.remove()
    this.frame = this.createFrame()
    this.renderMarkup(state)
  }
}
