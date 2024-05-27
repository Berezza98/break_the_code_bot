import { Markup, SessionStore, Telegraf, session } from 'telegraf';
import { SQLite } from '@telegraf/session/sqlite';

import { MyContext, MySession } from './types';
import { CHECK_CODE_DIVIDER, CODE_LENGTH, COLORS, SESSION_DB_FILE_NAME } from './consts';
import { Game, GameStatus } from './models/Game';
import { createColorsButtons, splitEmoji } from './helpers';
import { translations } from './translations';

const DELETE_BTN = '⬅️';
const START_BTN = '✅';
const CHECK_CODE_BTN = '☑️';
const JOIN_BTN = 'Прийняти Гру';

export const bot = new Telegraf<MyContext>(process.env.BOT_TOKEN);
const store: SessionStore<MySession> = SQLite({ filename: `${process.cwd()}/${SESSION_DB_FILE_NAME}` });

bot.use(session({ store }));

bot.use(async (ctx, next) => {
  const { inlineMessageId } = ctx;

  if (!inlineMessageId) return await next();

  const game = await Game.findOne({
    where: {
      inlineMessageId,
    },
  });
  ctx.currentGame = game;

  await next();
});

bot.on('inline_query', async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    createColorsButtons([]),
    [Markup.button.callback(DELETE_BTN, DELETE_BTN), Markup.button.callback(START_BTN, START_BTN)],
  ]);

  await ctx.answerInlineQuery(
    [
      {
        type: 'article',
        id: '1',
        title: 'Почати',
        input_message_content: {
          message_text: translations.think_of_a_code,
        },
        ...keyboard,
      },
    ],
    {
      cache_time: 0,
    }
  );
});

bot.on('chosen_inline_result', async (ctx) => {
  const { from, inline_message_id } = ctx.update.chosen_inline_result;

  console.log('chosen_inline_result: ', from, inline_message_id);
  if (!from || !inline_message_id) return await ctx.reply('Неможливо створити гру');

  await Game.create({
    inlineMessageId: inline_message_id,
    fromId: from.id,
  });
});

// Логіка користувача, який створив гру
bot.action(COLORS, async (ctx, next) => {
  const { inline_message_id, from } = ctx.update.callback_query;
  const selectedColor = ctx.match[0];
  const { currentGame } = ctx;

  if (!currentGame) {
    return await ctx.answerCbQuery('Помилка гри, спробуйте створити нову гру');
  }

  if (currentGame.fromId !== from.id) return await next();

  if (currentGame.status === GameStatus.started) {
    return await ctx.answerCbQuery('Гру вже розпочато. Опонент вже в процесі розгадки Вашого коду');
  }

  if (splitEmoji(currentGame.code).length >= CODE_LENGTH) {
    return await ctx.answerCbQuery(`Код має містити ${CODE_LENGTH} кольорів. Ваш код: ${currentGame.code}`);
  }

  if (splitEmoji(currentGame.code).includes(selectedColor)) {
    return await ctx.answerCbQuery(`Код вже містить даний колір ${selectedColor}`);
  }

  await currentGame.update({
    code: currentGame.code + selectedColor,
  });

  console.log('LENGTH: ', splitEmoji(currentGame.code).length);

  await ctx.answerCbQuery(`Ваш код: ${currentGame.code}`);

  const keyboard = Markup.inlineKeyboard([
    createColorsButtons(splitEmoji(currentGame.code)),
    [Markup.button.callback(DELETE_BTN, DELETE_BTN), Markup.button.callback(START_BTN, START_BTN)],
  ]);

  await ctx.editMessageText(translations.think_of_a_code, {
    ...keyboard,
  });
});

// Логіка користувача, який приймає гру
bot.action(COLORS, async (ctx, next) => {
  const { inline_message_id, from } = ctx.update.callback_query;
  const selectedColor = ctx.match[0];
  const { currentGame } = ctx;

  if (!currentGame) {
    return await ctx.answerCbQuery('Помилка гри, спробуйте створити нову гру');
  }

  if (currentGame.fromId === from.id) return await next();

  if (currentGame.status !== GameStatus.started) {
    return await ctx.answerCbQuery(`Натисніть кнопку "${JOIN_BTN}", щоб розпочати гру`);
  }

  if (splitEmoji(currentGame.currentCheckCombination).length >= CODE_LENGTH) {
    return await ctx.answerCbQuery(
      `Код має містити ${CODE_LENGTH} кольорів. Ваш код: ${currentGame.currentCheckCombination}`
    );
  }

  await currentGame.update({
    currentCheckCombination: currentGame.currentCheckCombination + selectedColor,
  });

  console.log('LENGTH: ', splitEmoji(currentGame.currentCheckCombination).length);

  const keyboard = Markup.inlineKeyboard([
    createColorsButtons(splitEmoji(currentGame.currentCheckCombination)),
    [Markup.button.callback(DELETE_BTN, DELETE_BTN), Markup.button.callback(CHECK_CODE_BTN, CHECK_CODE_BTN)],
  ]);

  await ctx.editMessageText(translations.guessed_combinations, {
    ...keyboard,
  });
});

bot.action(START_BTN, async (ctx) => {
  const { from } = ctx.update.callback_query;
  const { currentGame } = ctx;

  if (!currentGame) return await ctx.answerCbQuery('Помилка старту гри ❗️');
  if (currentGame.fromId !== from.id) return await ctx.answerCbQuery('Ви не можете почати чужу гру ❗️');
  if (splitEmoji(currentGame.code).length < CODE_LENGTH)
    return await ctx.answerCbQuery('Код має складатись з 5 кольорів ❗️');

  await currentGame.update({
    status: GameStatus.started,
  });

  await ctx.answerCbQuery(`Гру розпочато ✅`);

  const keyboard = Markup.inlineKeyboard([
    createColorsButtons([]),
    [Markup.button.callback(DELETE_BTN, DELETE_BTN), Markup.button.callback(JOIN_BTN, JOIN_BTN)],
  ]);

  await ctx.editMessageText(translations.code_ready, {
    ...keyboard,
  });
});

// Стертя на етапі створення коду
bot.action(DELETE_BTN, async (ctx, next) => {
  const { currentGame, from } = ctx;

  if (!currentGame) {
    return await ctx.answerCbQuery('Помилка гри, спробуйте створити нову гру');
  }

  if (currentGame.status !== GameStatus.created) return await next();

  if (currentGame.fromId !== from.id) return ctx.answerCbQuery(`Ви не можете стирати чужий код ❗️`);
  if (currentGame.code.length === 0) return ctx.answerCbQuery(`Код повністю стертий`);

  await currentGame.update({
    code: splitEmoji(currentGame.code).slice(0, -1).join(''),
  });

  await ctx.answerCbQuery(`Ваш код: ${currentGame.code}`);

  const keyboard = Markup.inlineKeyboard([
    createColorsButtons(splitEmoji(currentGame.code)),
    [Markup.button.callback(DELETE_BTN, DELETE_BTN), Markup.button.callback(START_BTN, START_BTN)],
  ]);

  await ctx.editMessageText(translations.think_of_a_code, {
    ...keyboard,
  });
});

// Стертя на етапі відгадування коду
bot.action(DELETE_BTN, async (ctx, next) => {
  const { currentGame } = ctx;

  if (!currentGame) {
    return await ctx.answerCbQuery('Помилка гри, спробуйте створити нову гру');
  }

  if (currentGame.status !== GameStatus.started) return await next();

  if (currentGame.code.length === 0) return ctx.answerCbQuery(`Код повністю стертий`);

  await currentGame.update({
    currentCheckCombination: splitEmoji(currentGame.code).slice(0, -1).join(''),
  });

  await ctx.answerCbQuery(`Ваш код: ${currentGame.currentCheckCombination}`);

  const keyboard = Markup.inlineKeyboard([
    createColorsButtons(splitEmoji(currentGame.currentCheckCombination)),
    [Markup.button.callback(DELETE_BTN, DELETE_BTN), Markup.button.callback(START_BTN, START_BTN)],
  ]);

  await ctx.editMessageText(translations.code_ready, {
    ...keyboard,
  });
});

bot.action(JOIN_BTN, async (ctx) => {
  const { inlineMessageId, currentGame } = ctx;

  if (!inlineMessageId) return await ctx.answerCbQuery('Помилка прийняття гри ❗️');

  if (!currentGame) return await ctx.answerCbQuery('Даної гри не існує, будь ласка, створіть нову гру ❗️');
  if (currentGame.status !== GameStatus.started) return await ctx.answerCbQuery('Код ще не загаданий ❗️');
  if (ctx.from.id === currentGame.fromId) return await ctx.answerCbQuery('Ви не можете прийняти свою ж гру ❗️');

  await currentGame.update({
    toId: ctx.from.id,
  });

  ctx.answerCbQuery('Ви прийняли гру ✅');

  const keyboard = Markup.inlineKeyboard([
    createColorsButtons([]),
    [Markup.button.callback(DELETE_BTN, DELETE_BTN), Markup.button.callback(CHECK_CODE_BTN, CHECK_CODE_BTN)],
  ]);

  ctx.editMessageText(`Гру прийнято ✅`, {
    ...keyboard,
  });
});

bot.action(CHECK_CODE_BTN, async (ctx) => {
  const { inlineMessageId, currentGame, from } = ctx;

  if (!inlineMessageId) return await ctx.answerCbQuery('Помилка перевірки коду ❗️');
  if (!currentGame) return await ctx.answerCbQuery('Помилка гри, будь ласка, створіть нову гру ❗️');
  if (currentGame.fromId === from.id) return await ctx.answerCbQuery('Ви не можете перевіряти власний код ❗️');

  if (splitEmoji(currentGame.currentCheckCombination).length !== CODE_LENGTH) {
    return await ctx.answerCbQuery(`Комбінація має містити ${CODE_LENGTH} символів ❗️`);
  }

  await ctx.answerCbQuery('Перевірка коду...');

  await currentGame.update({
    checkCombinations: `${currentGame.checkCombinations}${CHECK_CODE_DIVIDER}${currentGame.currentCheckCombination}`,
    currentCheckCombination: '',
  });

  const keyboard = Markup.inlineKeyboard([
    createColorsButtons([]),
    [Markup.button.callback(DELETE_BTN, DELETE_BTN), Markup.button.callback(CHECK_CODE_BTN, CHECK_CODE_BTN)],
  ]);

  ctx.editMessageText(translations.guessed_combinations, {
    ...keyboard,
  });
});

bot.catch(async (err, ctx) => {
  console.log(err);
});
