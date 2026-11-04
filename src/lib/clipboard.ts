// クリップボードへのコピー。navigator.clipboard → execCommand → 失敗（UI側で手動コピー案内）の順に試す。
export type CopyResult = 'clipboard' | 'exec-command' | 'failed'

export interface ClipboardDeps {
  clipboard?: { writeText(text: string): Promise<void> }
  isSecureContext: boolean
  doc: Pick<Document, 'createElement' | 'body' | 'execCommand'>
}

const copyWithExecCommand = (text: string, doc: ClipboardDeps['doc']): boolean => {
  const area = doc.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  doc.body.appendChild(area)
  try {
    area.select()
    return doc.execCommand('copy')
  } catch {
    return false
  } finally {
    area.remove()
  }
}

export const copyText = async (text: string, deps: ClipboardDeps): Promise<CopyResult> => {
  if (deps.isSecureContext && deps.clipboard) {
    try {
      await deps.clipboard.writeText(text)
      return 'clipboard'
    } catch {
      // 権限拒否などは execCommand にフォールバックする
    }
  }
  return copyWithExecCommand(text, deps.doc) ? 'exec-command' : 'failed'
}
