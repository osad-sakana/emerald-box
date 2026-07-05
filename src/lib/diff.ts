// 基準（baseline）と現在（current）の行内容を比較する、依存なしの純粋な行diff。
// LCS（最長共通部分列）に基づく標準的な行差分アルゴリズム。

export type LineChangeKind = 'added' | 'modified' | 'deletedAt'

// line は 1始まりで current 側の行番号。
// deletedAt は「この行の直前で行が削除された」ことを示す（削除自体は現在の行として存在しないため）。
export interface LineAdded {
  kind: 'added'
  line: number
}

export interface LineDeletedAt {
  kind: 'deletedAt'
  line: number
}

// modified はペアになった旧行（baselineText）・新行（currentText）の内容も保持する。
// 文字単位diff（diffInline）の入力として使う。
export interface LineModified {
  kind: 'modified'
  line: number
  baselineText: string
  currentText: string
}

export type LineChange = LineAdded | LineDeletedAt | LineModified

// 巨大な入力での計算量爆発を避けるための安全弁（O(n*m)のDPテーブルサイズ上限）。
// 超過時は意図的にハイライトなし（空配列）として安全側に倒す。
const MAX_CELLS = 4_000_000

// 変更行1行あたりの文字単位diffの計算量上限（O(len(a)*len(b))）。
// 超過時は行全体を1つの変更範囲として返す（安全側フォールバック）。
const MAX_INLINE_CELLS = 200_000

function splitLines(text: string): string[] {
  return text === '' ? [] : text.split('\n')
}

// mergeModified が deletedAt/added をペアリングする際に旧新テキストを参照できるよう、
// diffLines 内部でのみ使う raw 要素（各行のテキストを保持）。
interface RawChange {
  kind: LineChangeKind
  line: number
  text: string
}

// 隣接する「削除直後の追加」を1つの「変更」としてまとめる。
function mergeModified(raw: RawChange[]): LineChange[] {
  const merged: LineChange[] = []
  let i = 0
  while (i < raw.length) {
    const current = raw[i]
    const next = raw[i + 1]
    if (current.kind === 'deletedAt' && next?.kind === 'added' && next.line === current.line) {
      merged.push({
        kind: 'modified',
        line: next.line,
        baselineText: current.text,
        currentText: next.text,
      })
      i += 2
    } else if (current.kind === 'added' || current.kind === 'deletedAt') {
      merged.push({ kind: current.kind, line: current.line })
      i += 1
    } else {
      i += 1
    }
  }
  return merged
}

export function diffLines(baseline: string, current: string): LineChange[] {
  const a = splitLines(baseline)
  const b = splitLines(current)
  const n = a.length
  const m = b.length

  if (n * m > MAX_CELLS) return []

  // dp[i][j] = a[i..) と b[j..) の LCS 長。
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const raw: RawChange[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      raw.push({ kind: 'deletedAt', line: j + 1, text: a[i] })
      i++
    } else {
      raw.push({ kind: 'added', line: j + 1, text: b[j] })
      j++
    }
  }
  while (i < n) {
    raw.push({ kind: 'deletedAt', line: j + 1, text: a[i] })
    i++
  }
  while (j < m) {
    raw.push({ kind: 'added', line: j + 1, text: b[j] })
    j++
  }

  return mergeModified(raw)
}

// 文字単位の変更範囲。startColumn/endColumn は Monaco の列規約（1始まり、endColumnは排他）に従う。
// current 側の文字列（表示中のテキスト）を基準とする範囲のみを返す。
export interface InlineRange {
  startColumn: number
  endColumn: number
}

// baseline と current の1行を文字単位でLCS diffし、current 側で実際に変化した
// （baseline に無かった、または baseline と異なる）連続範囲を返す。
// 純粋な削除（current側に対応する文字が無い変更）は範囲として表現できないため対象外。
export function diffInline(baseline: string, current: string): InlineRange[] {
  const n = baseline.length
  const m = current.length

  if (n * m > MAX_INLINE_CELLS) {
    return m > 0 ? [{ startColumn: 1, endColumn: m + 1 }] : []
  }

  // dp[i][j] = baseline[i..) と current[j..) の LCS 長。
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        baseline[i] === current[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const changed = new Array<boolean>(m).fill(false)
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (baseline[i] === current[j]) {
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++
    } else {
      changed[j] = true
      j++
    }
  }
  while (j < m) {
    changed[j] = true
    j++
  }

  const ranges: InlineRange[] = []
  let start = -1
  for (let k = 0; k <= m; k++) {
    const isChanged = k < m && changed[k]
    if (isChanged && start === -1) {
      start = k
    } else if (!isChanged && start !== -1) {
      ranges.push({ startColumn: start + 1, endColumn: k + 1 })
      start = -1
    }
  }
  return ranges
}
