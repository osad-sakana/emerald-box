// パーツ集ドロワーの初期開閉を決める純関数。
// 保存値があればそれを優先。なければ、横幅が十分な画面でのみ開く（狭い画面ではエディタが窮屈になるため）。
export const WIDE_SCREEN_MIN_WIDTH = 1440

export const resolveInitialDrawerOpen = (saved: boolean | null, viewportWidth: number): boolean =>
  saved ?? viewportWidth >= WIDE_SCREEN_MIN_WIDTH
