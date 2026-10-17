// HTML の開始タグ入力直後に、挿入すべき閉じタグ名を判定する純関数群。
export const VOID_ELEMENTS: ReadonlySet<string> = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
])

// 中身をタグとして解釈しない要素（誤作動を避けるため、閉じるまで内側では何もしない）。
export const RAW_TEXT_ELEMENTS: ReadonlySet<string> = new Set([
  'script',
  'style',
  'textarea',
  'title',
])

const TAG_NAME_PATTERN = /^[A-Za-z][\w:.-]*/

interface ScannedTag {
  name: string
  // 終端 `>` の位置
  end: number
  selfClosing: boolean
}

// `<` の位置から開始タグを読み、クォート内の `>` を無視して終端を探す。読めなければ null。
const scanStartTag = (text: string, start: number): ScannedTag | null => {
  const match = TAG_NAME_PATTERN.exec(text.slice(start + 1))
  if (!match) return null
  let quote: string | null = null
  for (let i = start + 1 + match[0].length; i < text.length; i++) {
    const ch = text[i]
    if (quote) {
      if (ch === quote) quote = null
    } else if (ch === '"' || ch === "'") {
      quote = ch
    } else if (ch === '>') {
      return { name: match[0], end: i, selfClosing: text[i - 1] === '/' }
    }
  }
  return null
}

// 閉じタグ・DOCTYPE・処理命令など、`<` の次が `/` `!` `?` の構文を読み飛ばした次の位置を返す。
const skipMarkup = (text: string, start: number): number => {
  if (text.startsWith('<!--', start)) {
    const close = text.indexOf('-->', start + 4)
    return close === -1 ? -1 : close + 3
  }
  const close = text.indexOf('>', start + 1)
  return close === -1 ? -1 : close + 1
}

// RAWTEXT 要素の中身を読み飛ばし、対応する閉じタグの位置を返す。閉じていなければ -1。
const findRawTextEnd = (text: string, from: number, name: string): number =>
  text.toLowerCase().indexOf(`</${name.toLowerCase()}`, from)

// 直前に確定した `>` が開始タグの終端なら、その要素情報を返す。それ以外（タグ外・コメント内など）は null。
const findTagEndingAtLast = (before: string): ScannedTag | null => {
  const last = before.length - 1
  let i = 0
  while (i <= last) {
    const lt = before.indexOf('<', i)
    if (lt === -1) return null
    const next = before[lt + 1]
    if (next === '/' || next === '!' || next === '?') {
      i = skipMarkup(before, lt)
      if (i === -1) return null
      continue
    }
    const tag = scanStartTag(before, lt)
    if (!tag) {
      i = lt + 1
      continue
    }
    if (tag.end === last) return tag
    if (tag.end > last) return null
    if (RAW_TEXT_ELEMENTS.has(tag.name.toLowerCase()) && !tag.selfClosing) {
      i = findRawTextEnd(before, tag.end + 1, tag.name)
      if (i === -1) return null
      continue
    }
    i = tag.end + 1
  }
  return null
}

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const startsWithClosingTag = (after: string, name: string): boolean =>
  new RegExp(`^</${escapeRegExp(name)}(?![\\w:.-])`, 'i').test(after)

/**
 * `before`（文書先頭からカーソルまで）が `>` で終わる時、その開始タグに対応する閉じタグ名を返す。
 * 閉じるべきでない場合（void 要素・自己閉じ・タグ外・コメント内など）は null。
 */
export const findTagToClose = (before: string, after: string): string | null => {
  if (!before.endsWith('>')) return null
  const tag = findTagEndingAtLast(before)
  if (!tag || tag.selfClosing) return null
  if (VOID_ELEMENTS.has(tag.name.toLowerCase())) return null
  if (startsWithClosingTag(after, tag.name)) return null
  return tag.name
}
