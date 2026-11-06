// 全エディタを Monaco 標準の「ドキュメント整形」で整形する（判定ロジックを持たない薄い配線）。
const FORMAT_ACTION_ID = 'editor.action.formatDocument'

interface FormattableEditor {
  getAction(id: string): { isSupported(): boolean; run(): Promise<void> } | null
}

export interface FormatResult {
  readonly formatted: number
  readonly failed: number
}

// 整形に失敗したエディタがあっても他のエディタの整形は続ける。
export async function formatEditors(
  editors: Readonly<Record<string, FormattableEditor>>
): Promise<FormatResult> {
  const results = await Promise.all(
    Object.values(editors).map(async (editor) => {
      try {
        const action = editor.getAction(FORMAT_ACTION_ID)
        if (!action || !action.isSupported()) return false
        await action.run()
        return true
      } catch (error) {
        console.error('整形に失敗しました:', error)
        return false
      }
    })
  )
  const formatted = results.filter(Boolean).length
  return { formatted, failed: results.length - formatted }
}
