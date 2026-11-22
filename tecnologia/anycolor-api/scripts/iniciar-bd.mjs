// Crea las tablas y carga los datos de prueba.
// Uso: npm run db:iniciar
import { readFileSync } from 'node:fs';
import pg from 'pg';

try {
  process.loadEnvFile('.env');
} catch {
  // sin archivo .env: se usan las variables del entorno (Docker, CI)
}
const cliente = new pg.Client({ connectionString: process.env.DATABASE_URL });

await cliente.connect();
for (const archivo of ['db/01-esquema.sql', 'db/02-datos.sql']) {
  await cliente.query(readFileSync(archivo, 'utf8'));
  console.log('✔ ejecutado', archivo);
}
await cliente.end();
console.log('Base de datos lista.');
