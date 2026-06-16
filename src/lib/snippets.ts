// スニペット定義。各スニペットは対象タブ（html/css/js）と挿入コードを持つ。
export type EditorLang = 'html' | 'css' | 'javascript'

export interface Snippet {
  id: string
  label: string
  description: string
  target: EditorLang
  code: string
}

export const SNIPPETS: Snippet[] = [
  {
    id: 'html5-template',
    label: 'HTML5 テンプレート',
    description: '基本的なHTML5の骨組み',
    target: 'html',
    code: `<main class="min-h-screen flex items-center justify-center bg-slate-50">
  <div class="text-center">
    <h1 class="text-3xl font-bold text-slate-800">こんにちは、世界</h1>
    <p class="mt-2 text-slate-500">Emerald Box で自由に編集してください。</p>
  </div>
</main>`,
  },
  {
    id: 'tailwind-button',
    label: 'Tailwind ボタン',
    description: 'グリーンのモダンなボタン',
    target: 'html',
    code: `<div class="p-8">
  <button class="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow transition hover:bg-emerald-500 active:scale-95">
    クリックしてください
  </button>
</div>`,
  },
  {
    id: 'grid-layout',
    label: 'グリッドレイアウト',
    description: 'レスポンシブなカードグリッド',
    target: 'html',
    code: `<section class="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
  <article class="rounded-xl border border-slate-200 p-5 shadow-sm">
    <h2 class="font-bold text-slate-800">カード 1</h2>
    <p class="mt-1 text-sm text-slate-500">内容をここに記述します。</p>
  </article>
  <article class="rounded-xl border border-slate-200 p-5 shadow-sm">
    <h2 class="font-bold text-slate-800">カード 2</h2>
    <p class="mt-1 text-sm text-slate-500">内容をここに記述します。</p>
  </article>
  <article class="rounded-xl border border-slate-200 p-5 shadow-sm">
    <h2 class="font-bold text-slate-800">カード 3</h2>
    <p class="mt-1 text-sm text-slate-500">内容をここに記述します。</p>
  </article>
</section>`,
  },
  {
    id: 'flexbox-center',
    label: 'Flexbox 中央寄せ',
    description: '縦横中央配置のレイアウト',
    target: 'html',
    code: `<div class="flex min-h-screen items-center justify-center gap-4 bg-slate-100">
  <div class="rounded-lg bg-white p-6 shadow">左</div>
  <div class="rounded-lg bg-white p-6 shadow">右</div>
</div>`,
  },
  {
    id: 'css-gradient',
    label: 'CSS グラデーション',
    description: '背景グラデーションのサンプル',
    target: 'css',
    code: `body {
  margin: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #059669, #0f172a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: sans-serif;
  color: #ecfdf5;
}`,
  },
  {
    id: 'fetch-api',
    label: 'Fetch API',
    description: '非同期データ取得のテンプレート',
    target: 'javascript',
    code: `async function loadData() {
  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/todos/1')
    if (!res.ok) throw new Error('リクエスト失敗: ' + res.status)
    const data = await res.json()
    console.log('取得したデータ:', data)
    document.body.insertAdjacentHTML(
      'beforeend',
      '<pre>' + JSON.stringify(data, null, 2) + '</pre>'
    )
  } catch (error) {
    console.error('データ取得に失敗しました:', error)
  }
}

loadData()`,
  },
  {
    id: 'dom-event',
    label: 'DOM イベント',
    description: 'ボタンクリックのイベント処理',
    target: 'javascript',
    code: `document.body.insertAdjacentHTML(
  'beforeend',
  '<button id="btn" style="padding:8px 16px">押す</button>'
)

const btn = document.getElementById('btn')
let count = 0
btn?.addEventListener('click', () => {
  count += 1
  btn.textContent = count + ' 回クリックされました'
})`,
  },
]
