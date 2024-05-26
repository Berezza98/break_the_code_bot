import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../db';

export enum GameStatus {
  created = 'created',
  started = 'started',
  finished = 'finished',
}

export class Game extends Model<InferAttributes<Game>, InferCreationAttributes<Game>> {
  declare id: CreationOptional<number>;
  declare fromId: number;
  declare inlineMessageId: string;
  declare toId: CreationOptional<number>;
  declare code: CreationOptional<string>;
  declare status: CreationOptional<GameStatus>;
  declare currentCheckCombination: CreationOptional<string>;
  declare checkCombinations: CreationOptional<string>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Game.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fromId: {
      type: new DataTypes.NUMBER(),
      allowNull: false,
    },
    toId: {
      type: new DataTypes.NUMBER(),
      allowNull: true,
    },
    inlineMessageId: {
      type: new DataTypes.STRING(128),
      allowNull: false,
    },
    code: {
      type: new DataTypes.STRING(128),
      allowNull: false,
      defaultValue: '',
    },
    status: {
      type: new DataTypes.STRING(128),
      allowNull: false,
      defaultValue: GameStatus.created,
    },
    currentCheckCombination: {
      type: new DataTypes.STRING(128),
      allowNull: false,
      defaultValue: '',
    },
    checkCombinations: {
      type: new DataTypes.STRING(512),
      allowNull: false,
      defaultValue: '',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'games',
  }
);
