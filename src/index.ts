import 'dotenv/config';

import { sequelize } from './db';
import { bot } from './bot';

async function main() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    bot.launch();
  } catch (e) {
    console.log(e);
  }
}

main();
