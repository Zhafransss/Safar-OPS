// Real PostgreSQL for machines without Docker or a system install. Data lives in .pgdata/.
// Run with: pnpm db:local   Then use DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54330/postgres?sslmode=disable
// It is real PostgreSQL on purpose: row locks and simultaneous report numbers must behave as in production.
import fs from "node:fs";
import path from "node:path";

import EmbeddedPostgres from "embedded-postgres";

const PORT = 54330;
const dataDir = path.resolve(".pgdata");

const server = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port: PORT,
  persistent: true,
  // Without this, initdb takes the Windows code page (WIN1252) and rejects characters such as "→".
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

if (!fs.existsSync(path.join(dataDir, "PG_VERSION"))) await server.initialise();
await server.start();
console.log(`Local PostgreSQL listening on 127.0.0.1:${PORT}`);

async function shutdown() {
  await server.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
