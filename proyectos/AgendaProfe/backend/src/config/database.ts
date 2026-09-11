import { Sequelize } from 'sequelize';
import { Umzug, SequelizeStorage } from 'umzug';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5433;
const dbName = process.env.DB_NAME || 'agenda_profe_db';
const dbUser = process.env.DB_USER || 'agendaprofe_user';
const dbPassword = process.env.DB_PASSWORD || '';

export const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'postgres',
  logging: false, // Set to console.log to see SQL queries if needed
});

export const umzug = new Umzug({
  migrations: { glob: path.join(__dirname, '../migrations/*.ts') },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

export async function checkDbConnection(): Promise<boolean> {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error);
    return false;
  }
}
