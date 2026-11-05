import type { Viewer } from "@/server/services/viewer";

export function TeamChip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="tchip" style={{ color, background: `${color}1f` }}>
      <i />
      {children}
    </span>
  );
}

// Mockup roleHTML (K-T80).
export function RoleLabel({ viewer }: { viewer: Pick<Viewer, "isOwner" | "teamRoles"> }) {
  if (viewer.isOwner) return <>Pemilik</>;
  if (viewer.teamRoles.length === 0) return <>Belum masuk tim</>;
  return (
    <span className="roles">
      {viewer.teamRoles.map((r) => (
        <TeamChip key={`${r.role}-${r.teamName}`} color={r.color}>
          {r.role} · {r.teamName}
        </TeamChip>
      ))}
    </span>
  );
}
