import { Markup } from 'telegraf';
import { COLORS } from '../consts';

export const createColorsButtons = (usedColors: string[]) => {
  const unusedColors = COLORS.filter((color) => !usedColors.includes(color));

  const buttons = unusedColors.map((color) => Markup.button.callback(color, color));

  return buttons;
};
