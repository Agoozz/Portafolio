import app from './app';
import { checkDbConnection } from './config/database';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  const isDbConnected = await checkDbConnection();
  if (!isDbConnected) {
    console.error('Abortando inicio del servidor. No se pudo conectar a la base de datos.');
    process.exit(1);
  }

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Servidor iniciado en http://127.0.0.1:${PORT}`);
  });
}

startServer();
