import { Markup, SessionStore, Telegraf, session } from 'telegraf';
import { SQLite } from '@telegraf/session/sqlite';

import { MyContext, MySession } from './types';
import { CODE_LENGTH, COLORS, EMOJI_SIZE, SESSION_DB_FILE_NAME } from './consts';
import { Game } from './models/Game';
import { createColorsButtons } from './helpers';

const DELETE_BTN = '⬅️';
const START_BTN = '✅';
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
          message_text: 'Загадайте код',
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

bot.action(COLORS, async (ctx) => {
  const { inline_message_id, from } = ctx.update.callback_query;
  const selectedColor = ctx.match[0];
  const { currentGame } = ctx;

  if (!currentGame) {
    return await ctx.answerCbQuery('Помилка гри, спробуйте створити нову гру');
  }

  if (currentGame.fromId === from.id && currentGame.started) {
    return await ctx.answerCbQuery('Гру вже розпочато. Опонент вже в процесі розгадки Вашого коду');
  }

  if (currentGame.code.length >= CODE_LENGTH * EMOJI_SIZE) {
    return await ctx.answerCbQuery(`Код має містити ${CODE_LENGTH} кольорів. Ваш код: ${currentGame.code}`);
  }

  await currentGame.update({
    code: currentGame.code + selectedColor,
  });

  console.log('LENGTH: ', currentGame.code.length);

  await ctx.answerCbQuery(`Ваш код: ${currentGame.code}`);
});

bot.action(START_BTN, async (ctx) => {
  const { from } = ctx.update.callback_query;
  const { currentGame } = ctx;

  if (!currentGame) return await ctx.answerCbQuery('Помилка старту гри ❗️');
  if (currentGame.fromId !== from.id) return await ctx.answerCbQuery('Ви не можете почати чужу гру ❗️');
  if (currentGame.code.length < CODE_LENGTH * EMOJI_SIZE)
    return await ctx.answerCbQuery('Код має складатись з 5 кольорів ❗️');

  await currentGame.update({
    started: true,
  });

  await ctx.answerCbQuery(`Гру розпочато ✅`);
});

bot.action(DELETE_BTN, async (ctx) => {
  const { currentGame } = ctx;

  if (!currentGame) {
    return await ctx.answerCbQuery('Помилка гри, спробуйте створити нову гру');
  }

  if (currentGame.code.length === 0) return ctx.answerCbQuery(`Код повністю стертий`);

  await currentGame.update({
    code: currentGame.code.slice(0, -1 * EMOJI_SIZE),
  });

  await ctx.answerCbQuery(`Ваш код: ${currentGame.code}`);
});

bot.action(JOIN_BTN, async (ctx) => {
  const { inlineMessageId } = ctx;

  if (!inlineMessageId) return await ctx.answerCbQuery('Помилка прийняття гри ❗️');

  const neededGame = await Game.findOne({
    where: {
      inlineMessageId,
    },
  });

  if (!neededGame) return await ctx.answerCbQuery('Даної гри не існує, будь ласка, створіть нову гру ❗️');
  if (ctx.from.id === neededGame.fromId) return await ctx.answerCbQuery('Ви не можете прийняти свою ж гру ❗️');

  await neededGame.update({
    toId: ctx.from.id,
  });

  ctx.answerCbQuery('Ви прийняли гру ✅');

  const buttons = COLORS.map((color) => Markup.button.callback(color, color));
  const keyboard = Markup.inlineKeyboard([
    buttons,
    [Markup.button.callback(DELETE_BTN, DELETE_BTN), Markup.button.callback(START_BTN, START_BTN)],
  ]);

  ctx.editMessageText(`Гру прийнято ✅`, {
    ...keyboard,
  });
});

bot.catch(async (err, ctx) => {
  console.log(err);
});
