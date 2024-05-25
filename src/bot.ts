import { Markup, SessionStore, Telegraf, session } from 'telegraf';
import { SQLite } from '@telegraf/session/sqlite';

import { MyContext, MySession } from './types';
import { SESSION_DB_FILE_NAME } from './consts';

const COLORS = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫️', '⚪️'];
const DELETE_BTN = '⬅️';

export const bot = new Telegraf<MyContext>(process.env.BOT_TOKEN);
const store: SessionStore<MySession> = SQLite({ filename: `${process.cwd()}/${SESSION_DB_FILE_NAME}` });

bot.use(session({ store }));

bot.start(async (ctx) => {
  await ctx.reply('HI');
});

bot.on('inline_query', async (ctx) => {
  const buttons = COLORS.map((color) => Markup.button.callback(color, color));
  const keyboard = Markup.inlineKeyboard([buttons, [Markup.button.callback(DELETE_BTN, DELETE_BTN)]]);

  await ctx.answerInlineQuery(
    [
      {
        type: 'article',
        id: '1',
        title: 'Start Game',
        input_message_content: {
          message_text: 'Почати Гру',
        },
        ...keyboard,
      },
    ],
    {
      cache_time: 0,
    }
  );
});

bot.catch(async (err, ctx) => {
  console.log(err);
});
