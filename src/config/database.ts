import { Sequelize } from 'sequelize';
import { config } from './index.js';
import { logger } from '../shared/utils/logger.js';

const sequelize = new Sequelize({
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  dialect: config.database.dialect,
  logging: (msg: string) => logger.debug(msg),
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    timezone: 'UTC',
    ...(config.database.ssl && { ssl: config.database.ssl })
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

export const syncDatabase = async (): Promise<void> => {
  try {
    await sequelize.sync({ alter: true });
    logger.info('Database models synchronized successfully.');
  } catch (error) {
    logger.error('Error synchronizing database models:', error);
    process.exit(1);
  }
};

export { sequelize };
export default sequelize; 