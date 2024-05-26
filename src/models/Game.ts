import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../db';

export class Game extends Model<InferAttributes<Game>, InferCreationAttributes<Game>> {
  declare id: CreationOptional<number>;
  declare fromId: number;
  declare inlineMessageId: string;
  declare toId: CreationOptional<number>;
  declare code: CreationOptional<string>;
  declare started: CreationOptional<boolean>;

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
    started: {
      type: new DataTypes.BOOLEAN(),
      allowNull: false,
      defaultValue: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'games',
  }
);
