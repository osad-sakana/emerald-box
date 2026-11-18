// AIワークショップモードの純関数。状態はクエリパラメータだけで決め、localStorage には保存しない。
export const AI_WORKSHOP_PARAM = 'ai-workshop'
export const AI_WORKSHOP_STATE_EVENT = 'ai-workshop:state'

export const parseAiWorkshopParam = (search: string): boolean =>
  new URLSearchParams(search).get(AI_WORKSHOP_PARAM) === 'true'

/** 他のクエリとハッシュを保ったまま、ai-workshop パラメータを付け外しした URL を返す。 */
export const buildAiWorkshopUrl = (href: string, enabled: boolean): string => {
  const url = new URL(href)
  if (enabled) url.searchParams.set(AI_WORKSHOP_PARAM, 'true')
  else url.searchParams.delete(AI_WORKSHOP_PARAM)
  return url.toString()
}

export type PasteButtonLabel = '貼り付け' | 'すべて消して貼り付け'

export const pasteButtonLabel = (value: string): PasteButtonLabel =>
  value.trim() === '' ? '貼り付け' : 'すべて消して貼り付け'
