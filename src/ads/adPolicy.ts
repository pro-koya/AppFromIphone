// デイリー: 全問クリア後（DailyCompleteScreen 遷移前）に1回だけインタースティシャルを表示。
export function shouldShowDailyCompleteInterstitial(
  totalPuzzles: number,
): boolean {
  return totalPuzzles >= 2;
}

// パズル間インタースティシャル: パズル1完了→パズル2開始前に表示
// 最初のパズル完了後のみ。最後のパズルはdailyComplete用を使う。
export function shouldShowInterPuzzleInterstitial(
  completedPuzzleIndex: number,
  totalPuzzles: number,
): boolean {
  // Show after completing puzzle 0 (first puzzle) when there are 3+ puzzles
  return completedPuzzleIndex === 0 && totalPuzzles >= 3;
}

// エンドレス: インタースティシャルは表示しない。
// 収益化はゲームオーバー時のリワード広告（復活）+ ヒント/アンドゥのリワード広告。
