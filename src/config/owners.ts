// K-T72: four equal owner accounts, hardcoded by email. Owners cannot be leader or staff.
const PRODUCTION_OWNERS = [
  { name: "Chaesar 2", email: "sesar040301@gmail.com" },
  { name: "Wahyudin", email: "wahyudinst@gmail.com" },
  { name: "Nasuroh", email: "nasurohazzam@gmail.com" },
  { name: "Chaesar Syaefuddin", email: "saefulaskarcompany@gmail.com" },
] as const;

// Local development only, for developers without a Jubelio account (scripts/dev-jubelio.mjs).
const DEV_OWNER = { name: "Developer", email: "developer@safar.local" } as const;

export const OWNERS: readonly { name: string; email: string }[] =
  process.env.NODE_ENV === "development" ? [...PRODUCTION_OWNERS, DEV_OWNER] : PRODUCTION_OWNERS;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function findOwner(email: string) {
  const target = normalizeEmail(email);
  return OWNERS.find((owner) => owner.email === target);
}

export function isOwnerEmail(email: string): boolean {
  return findOwner(email) !== undefined;
}
