// K-T79: first letter of up to two words. On a clash, both users show the first two letters of the name.
export function baseInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  const first = words[0] ?? "";
  const second = words[1];
  return (second ? `${first.charAt(0)}${second.charAt(0)}` : first.charAt(0)).toUpperCase();
}

export function initials(name: string, otherNames: readonly string[]): string {
  const base = baseInitials(name);
  if (!otherNames.some((other) => baseInitials(other) === base)) return base;
  const trimmed = name.trim();
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.charAt(1).toLowerCase()}`;
}
