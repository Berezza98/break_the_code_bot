import { Game } from '../models/Game';
import { CHECK_CODE_DIVIDER } from '../consts';

export const getCheckCombinations = (currentGame: Game): string => {
  if (!currentGame.checkCombinations) return '';

  console.log(currentGame.checkCombinations);

  return currentGame.checkCombinations
    .split(CHECK_CODE_DIVIDER)
    .map((el, i) => `${i + 1}. ${el}\n`)
    .join('');
};
