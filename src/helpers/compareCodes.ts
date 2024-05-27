import { splitEmoji } from './splitEmoji';

export type RightColorCount = number;
export type RightColorAndPositionCount = number;
export type CodeComparingResult = [RightColorCount, RightColorAndPositionCount];

export const compareCodes = (correctCode: string, codeToCheck: string): CodeComparingResult => {
  const correctCodeArr = splitEmoji(correctCode);
  const codeToCheckArr = splitEmoji(codeToCheck);

  const correctColorCount = codeToCheckArr.reduce<RightColorAndPositionCount>((acc, current, index) => {
    if (correctCodeArr.includes(current) && correctCodeArr[index] !== current) {
      return acc + 1;
    }

    return acc;
  }, 0);

  const correctColorAndPositionCount = codeToCheckArr.reduce<RightColorAndPositionCount>((acc, current, index) => {
    if (correctCodeArr[index] === current) {
      return acc + 1;
    }

    return acc;
  }, 0);

  return [correctColorCount, correctColorAndPositionCount];
};
