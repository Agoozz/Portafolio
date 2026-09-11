import { umzug } from '../config/database';

async function run() {
  const action = process.argv[2];
  try {
    if (action === 'up') {
      await umzug.up();
      console.log('Migraciones aplicadas con éxito.');
    } else if (action === 'down') {
      await umzug.down();
      console.log('Migración revertida con éxito.');
    } else {
      console.log('Acción inválida. Usa "up" o "down".');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  }
}

run();
