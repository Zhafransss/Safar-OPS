// Local PostgreSQL for machines without Docker or a Postgres install. Data lives in .pglite/.
// Run with: pnpm db:local   Then use DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54330/postgres?sslmode=disable
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const PORT = 54330;

const db = await PGlite.create(process.env.PGLITE_DIR ?? ".pglite");
const server = new PGLiteSocketServer({ db, port: PORT, host: "127.0.0.1", maxConnections: 10 });
await server.start();
console.log(`Local PostgreSQL listening on 127.0.0.1:${PORT}`);

async function shutdown() {
  await server.stop();
  await db.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
