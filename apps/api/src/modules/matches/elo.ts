export interface EloChangeResult {
  newWinnerElo: number;
  newLoserElo: number;
  winnerChange: number;
  loserChange: number;
}

export function calculateEloPvP(
  winnerElo: number,
  loserElo: number,
  options?: { floor?: number; winBonus?: number; lossPenalty?: number }
): EloChangeResult {
  const floor = options?.floor ?? 800;
  const winnerChange = options?.winBonus ?? 25;
  const loserChange = options?.lossPenalty ?? -15;

  return {
    newWinnerElo: winnerElo + winnerChange,
    newLoserElo: Math.max(floor, loserElo + loserChange),
    winnerChange,
    loserChange,
  };
}
