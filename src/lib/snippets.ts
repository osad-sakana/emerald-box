// パーツ集のデータ定義（UIから分離）。追加・編集はこの配列を触るだけでよい。
// code のインデントは半角スペース2つ、末尾の改行は付けない。
import type { EditorLang } from './storage'

export interface Snippet {
  readonly id: string
  readonly lang: EditorLang
  readonly category: string
  readonly label: string
  readonly description: string
  readonly code: string
  // true: 行の途中に挿入するとき前後に改行を補う（インライン要素は false）
  readonly block: boolean
}

export const SNIPPET_LANG_LABELS: Readonly<Record<EditorLang, string>> = {
  html: 'HTML',
  css: 'CSS',
  javascript: 'JS',
}

const CSS_NOTE = '「}」の外側に入れてね。'
const JS_NOTE = 'HTMLのパーツを入れてから「▶ JS実行」を押すと動くよ。1回だけ入れてね。'

export const SNIPPETS: readonly Snippet[] = Object.freeze([
  {
    id: 'html-heading-h1',
    lang: 'html',
    category: '見出し',
    label: '大見出し h1',
    description: 'ページのいちばん大きなタイトル。',
    code: '<h1>はじめまして！〇〇です</h1>',
    block: true,
  },
  {
    id: 'html-heading-h2',
    lang: 'html',
    category: '見出し',
    label: '中見出し h2',
    description: 'ページの中の見出し。',
    code: '<h2>好きなこと</h2>',
    block: true,
  },
  {
    id: 'html-paragraph',
    lang: 'html',
    category: '段落',
    label: '文章 p',
    description: '自己紹介の文章を書く場所。',
    code: '<p>ここに自己紹介の文章を書きます。</p>',
    block: true,
  },
  {
    id: 'html-paragraph-message',
    lang: 'html',
    category: '段落',
    label: 'メッセージ欄 p（JS用）',
    description: 'JSのパーツで文字を書き換える場所。',
    code: '<p id="message">ボタンを押してみてね</p>',
    block: true,
  },
  {
    id: 'html-image',
    lang: 'html',
    category: '画像',
    label: '画像 img',
    description: 'src の中を画像のURLに書き換えよう。表示できないときは alt の文字が出るよ。',
    code: '<img src="ここに画像のURL" alt="わたしの写真" width="200">',
    block: true,
  },
  {
    id: 'html-list-ul',
    lang: 'html',
    category: 'リスト',
    label: '箇条書き ul',
    description: '好きなものを並べるときに使う。',
    code: '<ul>\n  <li>好きなもの1</li>\n  <li>好きなもの2</li>\n  <li>好きなもの3</li>\n</ul>',
    block: true,
  },
  {
    id: 'html-list-ol',
    lang: 'html',
    category: 'リスト',
    label: '番号つき ol（ランキング）',
    description: '順番をつけて並べるときに使う。',
    code: '<ol>\n  <li>1位の好きな食べ物</li>\n  <li>2位の好きな食べ物</li>\n  <li>3位の好きな食べ物</li>\n</ol>',
    block: true,
  },
  {
    id: 'html-link-inner',
    lang: 'html',
    category: 'リンク',
    label: 'ページ内リンク',
    description: 'セクションの id と同じ名前にすると、そこへジャンプするよ。',
    code: '<a href="#hobby">趣味の紹介へ</a>',
    block: false,
  },
  {
    id: 'html-link-outer',
    lang: 'html',
    category: 'リンク',
    label: '外部リンク',
    description: 'ほかのページへのリンク。プレビューの中では開けないことがあるよ。',
    code: '<a href="https://www.example.com">リンクの文字</a>',
    block: false,
  },
  {
    id: 'html-button',
    lang: 'html',
    category: 'ボタン',
    label: 'ボタン button',
    description: 'JSのパーツと組み合わせて使うボタン。',
    code: '<button id="color-button">色を変える</button>',
    block: true,
  },
  {
    id: 'html-section',
    lang: 'html',
    category: 'セクション',
    label: 'まとまり section',
    description: '見出しと文章をひとまとまりにする。',
    code: '<section id="hobby">\n  <h2>趣味</h2>\n  <p>わたしの趣味は〇〇です。</p>\n</section>',
    block: true,
  },
  {
    id: 'css-color',
    lang: 'css',
    category: '色',
    label: '文字色・背景色',
    description: `見出しの色を変える。${CSS_NOTE}`,
    code: 'h1 {\n  color: white;\n  background-color: teal;\n}',
    block: true,
  },
  {
    id: 'css-body-bg',
    lang: 'css',
    category: '色',
    label: 'ページ全体の背景色',
    description: `ページ全体の色を変える。${CSS_NOTE}`,
    code: 'body {\n  background-color: #fff8e7;\n}',
    block: true,
  },
  {
    id: 'css-font-size',
    lang: 'css',
    category: '文字',
    label: '文字の大きさ',
    description: `文章の大きさを変える。${CSS_NOTE}`,
    code: 'p {\n  font-size: 18px;\n}',
    block: true,
  },
  {
    id: 'css-text-center',
    lang: 'css',
    category: '文字',
    label: '真ん中寄せ',
    description: `見出しを真ん中に置く。${CSS_NOTE}`,
    code: 'h1 {\n  text-align: center;\n}',
    block: true,
  },
  {
    id: 'css-border',
    lang: 'css',
    category: '枠線',
    label: '枠線と角丸',
    description: `画像に枠をつけて丸くする。${CSS_NOTE}`,
    code: 'img {\n  border: 4px solid hotpink;\n  border-radius: 50%;\n}',
    block: true,
  },
  {
    id: 'css-spacing',
    lang: 'css',
    category: '余白',
    label: '余白（margin / padding）',
    description: `外側と内側にすき間をつくる。${CSS_NOTE}`,
    code: 'section {\n  margin: 16px;\n  padding: 16px;\n  border: 2px dashed gray;\n}',
    block: true,
  },
  {
    id: 'css-flex',
    lang: 'css',
    category: '並べ方',
    label: '横に並べる（flex）',
    description: `リストを横一列に並べる。${CSS_NOTE}`,
    code: 'ul {\n  display: flex;\n  gap: 12px;\n  list-style: none;\n}',
    block: true,
  },
  {
    id: 'css-hover',
    lang: 'css',
    category: '動き',
    label: 'マウスを乗せると色が変わる',
    description: `ボタンにマウスを乗せたときの色。${CSS_NOTE}`,
    code: 'button:hover {\n  background-color: orange;\n}',
    block: true,
  },
  {
    id: 'js-bg-change',
    lang: 'javascript',
    category: 'ボタン',
    label: '押すと背景色が変わる',
    description: `HTMLの「ボタン button」パーツと一緒に使う。${JS_NOTE}`,
    code:
      "const colorButton = document.querySelector('#color-button')\n" +
      "colorButton.addEventListener('click', () => {\n" +
      "  document.body.style.backgroundColor = 'lightblue'\n" +
      '})',
    block: true,
  },
  {
    id: 'js-text-change',
    lang: 'javascript',
    category: 'ボタン',
    label: '押すと文字が変わる',
    description: `HTMLの「ボタン button」「メッセージ欄 p」パーツと一緒に使う。${JS_NOTE}`,
    code:
      "const messageButton = document.querySelector('#color-button')\n" +
      "messageButton.addEventListener('click', () => {\n" +
      "  document.querySelector('#message').textContent = 'ようこそ！'\n" +
      '})',
    block: true,
  },
  {
    id: 'js-alert',
    lang: 'javascript',
    category: 'メッセージ',
    label: 'メッセージを出す',
    description: '「▶ JS実行」を押すとメッセージが出るよ。',
    code: "alert('ようこそ、わたしのページへ！')",
    block: true,
  },
])

export const findSnippet = (id: string): Snippet | undefined =>
  SNIPPETS.find((s) => s.id === id)

export const snippetsByLang = (lang: EditorLang): readonly Snippet[] =>
  SNIPPETS.filter((s) => s.lang === lang)
