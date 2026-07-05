// 基準（baseline）と現在（current）の行内容を比較する、依存なしの純粋な行diff。
// LCS（最長共通部分列）に基づく標準的な行差分アルゴリズム。

export type LineChangeKind = 'added' | 'modified' | 'deletedAt'

// line は 1始まりで current 側の行番号。
// deletedAt は「この行の直前で行が削除された」ことを示す（削除自体は現在の行として存在しないため）。
export interface LineChange {
  kind: LineChangeKind
  line: number
}

// 巨大な入力での計算量爆発を避けるための安全弁（O(n*m)のDPテーブルサイズ上限）。
// 超過時は意図的にハイライトなし（空配列）として安全側に倒す。
const MAX_CELLS = 4_000_000

function splitLines(text: string): string[] {
  return text === '' ? [] : text.split('\n')
}

// 隣接する「削除直後の追加」を1つの「変更」としてまとめる。
function mergeModified(raw: LineChange[]): LineChange[] {
  const merged: LineChange[] = []
  let i = 0
  while (i < raw.length) {
    const current = raw[i]
    const next = raw[i + 1]
    if (current.kind === 'deletedAt' && next?.kind === 'added' && next.line === current.line) {
      merged.push({ kind: 'modified', line: next.line })
      i += 2
    } else {
      merged.push(current)
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

  const raw: LineChange[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      raw.push({ kind: 'deletedAt', line: j + 1 })
      i++
    } else {
      raw.push({ kind: 'added', line: j + 1 })
      j++
    }
  }
  while (i < n) {
    raw.push({ kind: 'deletedAt', line: j + 1 })
    i++
  }
  while (j < m) {
    raw.push({ kind: 'added', line: j + 1 })
    j++
  }

  return mergeModified(raw)
}
