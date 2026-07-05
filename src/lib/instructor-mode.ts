// 講師モードのMonaco配線（文字拡大・スナップショット基準の差分ハイライト）をまとめたコントローラ。
import type { EditorLang } from './storage'
import { diffLines } from './diff'

const NORMAL_FONT_SIZE = 14
const LARGE_FONT_SIZE = 20
const LANGS: EditorLang[] = ['html', 'css', 'javascript']

interface DecorationOptionsLike {
  isWholeLine?: boolean
  className?: string
  linesDecorationsClassName?: string
}

interface DecorationLike {
  range: unknown
  options: DecorationOptionsLike
}

interface DecorationsCollectionLike {
  set(decorations: DecorationLike[]): void
  clear(): void
}

interface RangeCtor {
  new (startLine: number, startColumn: number, endLine: number, endColumn: number): unknown
}

interface MonacoLike {
  Range: RangeCtor
}

interface EditorLike {
  updateOptions(options: { fontSize: number }): void
  layout(): void
  createDecorationsCollection(decorations?: DecorationLike[]): DecorationsCollectionLike
}

interface ModelLike {
  getValue(): string
  getLineCount(): number
}

export interface InstructorController {
  isEnabled(): boolean
  setEnabled(enabled: boolean): void
  hasBaseline(): boolean
  captureBaseline(): void
  refreshDecorations(): void
  dispose(): void
}

interface CreateInstructorControllerParams<
  TEditor extends EditorLike,
  TModel extends ModelLike,
  TMonaco extends MonacoLike,
> {
  editors: Record<EditorLang, TEditor>
  models: Record<EditorLang, TModel>
  monaco: TMonaco
}

export function createInstructorController<
  TEditor extends EditorLike,
  TModel extends ModelLike,
  TMonaco extends MonacoLike,
>({
  editors,
  models,
  monaco,
}: CreateInstructorControllerParams<TEditor, TModel, TMonaco>): InstructorController {
  let enabled = false
  let baseline: Record<EditorLang, string> | null = null
  const collections: Record<EditorLang, DecorationsCollectionLike> = {
    html: editors.html.createDecorationsCollection(),
    css: editors.css.createDecorationsCollection(),
    javascript: editors.javascript.createDecorationsCollection(),
  }

  const clearDecorations = () => {
    for (const lang of LANGS) collections[lang].clear()
  }

  const updateFontSize = () => {
    const fontSize = enabled ? LARGE_FONT_SIZE : NORMAL_FONT_SIZE
    for (const lang of LANGS) {
      editors[lang].updateOptions({ fontSize })
      editors[lang].layout()
    }
  }

  const refreshDecorations = () => {
    if (!enabled || !baseline) {
      clearDecorations()
      return
    }
    for (const lang of LANGS) {
      const model = models[lang]
      const changes = diffLines(baseline[lang], model.getValue())
      const lineCount = Math.max(model.getLineCount(), 1)
      const decorations: DecorationLike[] = changes.map((change) => {
        const line = Math.min(change.line, lineCount)
        return {
          range: new monaco.Range(line, 1, line, 1),
          options:
            change.kind === 'deletedAt'
              ? { linesDecorationsClassName: 'eb-diff-deleted-gutter' }
              : {
                  isWholeLine: true,
                  className: 'eb-diff-line',
                  linesDecorationsClassName: 'eb-diff-gutter',
                },
        }
      })
      collections[lang].set(decorations)
    }
  }

  return {
    isEnabled: () => enabled,
    setEnabled: (next: boolean) => {
      enabled = next
      updateFontSize()
      if (!enabled) {
        baseline = null
        clearDecorations()
      } else {
        refreshDecorations()
      }
    },
    hasBaseline: () => baseline !== null,
    captureBaseline: () => {
      baseline = {
        html: models.html.getValue(),
        css: models.css.getValue(),
        javascript: models.javascript.getValue(),
      }
      refreshDecorations()
    },
    refreshDecorations,
    dispose: () => {
      clearDecorations()
    },
  }
}
