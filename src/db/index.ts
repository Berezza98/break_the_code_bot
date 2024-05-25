import { Sequelize } from 'sequelize';
import { GAMES_DB_FILE_NAME } from '../consts';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: `${process.cwd()}/${GAMES_DB_FILE_NAME}`,
});
