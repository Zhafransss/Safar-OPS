import { parseLocalAccounts } from "@/config/local-accounts";

export type OwnerAccount = { email: string; name?: string };

// K-T72: equal owner accounts, known by email. Owners cannot be leader or staff. Three since
// sesar040301@gmail.com stopped being an owner (CHANGELOG 50); that account is now a regular user.
// U-01: their names come from Jubelio at login like everyone else's. A name written here is fixed
// instead: Jubelio's name is ignored for that account (CHANGELOG 49).
const PRODUCTION_OWNERS: readonly OwnerAccount[] = [
  { email: "wahyudinst@gmail.com" },
  { email: "nasurohazzam@gmail.com" },
  { email: "saefulaskarcompany@gmail.com", name: "Chaesar Syaefuddin" },
];

// Local development only, for developers without a Jubelio account (scripts/dev-jubelio.mjs).
// It never reaches Jubelio, so its name is set here.
const DEV_OWNER: OwnerAccount = { name: "Developer", email: "developer@safar.local" };

// Test owners from LOCAL_ACCOUNTS (owner: true) exist only while that variable is set. They skip
// Jubelio too, so they keep the name given in the variable.
const LOCAL_OWNERS: OwnerAccount[] = parseLocalAccounts(process.env.LOCAL_ACCOUNTS)
  .filter((account) => account.owner)
  .map(({ name, email }) => ({ name, email }));

export const OWNERS: readonly OwnerAccount[] = [
  ...PRODUCTION_OWNERS,
  ...(process.env.NODE_ENV === "development" ? [DEV_OWNER] : []),
  ...LOCAL_OWNERS,
];

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// The name shown before an account's first login gives Jubelio's name: the fixed name if any,
// otherwise the part of the email before "@".
export function placeholderName(account: OwnerAccount): string {
  return account.name ?? account.email.split("@")[0] ?? account.email;
}

export function findOwner(email: string) {
  const target = normalizeEmail(email);
  return OWNERS.find((owner) => owner.email === target);
}

export function isOwnerEmail(email: string): boolean {
  return findOwner(email) !== undefined;
}
