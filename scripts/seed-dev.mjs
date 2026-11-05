// Adds the mockup people as @safar.local users so leader and staff pickers are not empty locally.
// Run with: pnpm db:seed-dev   They log in through scripts/dev-jubelio.mjs with DEV_LOGIN_PASSWORD.
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local", quiet: true });

const url = process.env.DATABASE_URL ?? "";
if (!/@(127\.0\.0\.1|localhost)[:/]/.test(url)) {
  throw new Error("seed-dev only runs against a local database");
}

const PEOPLE = ["Kartika", "Zarkasih", "Dimas", "Rudi"];

const client = new pg.Client({ connectionString: url });
await client.connect();
for (const name of PEOPLE) {
  const email = `${name.toLowerCase()}@safar.local`;
  await client.query(
    `INSERT INTO "User"(id, email, name) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name`,
    [`dev-${name.toLowerCase()}`, email, name],
  );
  console.log("seeded", email);
}
await client.end();
