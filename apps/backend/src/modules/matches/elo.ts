import { ELO_RULES } from './match.constants';

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
  const floor = options?.floor ?? ELO_RULES.FLOOR;
  const winnerChange = options?.winBonus ?? ELO_RULES.WIN_BONUS;
  const loserChange = options?.lossPenalty ?? -ELO_RULES.LOSS_PENALTY;

  return {
    newWinnerElo: winnerElo + winnerChange,
    newLoserElo: Math.max(floor, loserElo + loserChange),
    winnerChange,
    loserChange,
  };
}
