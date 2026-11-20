"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AvatarMenu } from "@/components/avatar-menu";
import { BrandLockup } from "@/components/brand-lockup";
import { Icon } from "@/components/icon";
import type { IconName } from "@/components/icons";
import { RoleLabel } from "@/components/role-label";
import type { Viewer } from "@/server/services/viewer";

type NavItem = { href: string; label: string; icon: IconName; count?: number; match: (path: string) => boolean };

// Desktop navigation (1024 px and wider; CSS hides it on phones). It lists the same places as the
// Beranda menu cards (CHANGELOG 26), with the same counts, so no page needs Beranda to be reached.
export function AppSidebar({
  viewer,
  newReports,
  myTodos,
}: {
  viewer: Pick<Viewer, "name" | "initials" | "isOwner" | "teamRoles">;
  newReports: number;
  myTodos: number;
}) {
  const pathname = usePathname();
  const work: NavItem[] = [
    {
      href: "/penugasan/program",
      label: "Tugas",
      icon: "list",
      count: myTodos,
      match: (path) => /^\/penugasan\/(program|tugas|template)/.test(path),
    },
    {
      href: "/penugasan/laporan",
      label: "Laporan",
      icon: "chat",
      count: newReports,
      match: (path) => path.startsWith("/penugasan/laporan"),
    },
    // V1.0: the team chart stays owner-only, like its Beranda card.
    ...(viewer.isOwner
      ? [{ href: "/penugasan/tim", label: "Tim", icon: "users" as const, match: (path: string) => path.startsWith("/penugasan/tim") }]
      : []),
  ];

  const link = (item: NavItem) => {
    const active = item.match(pathname);
    return (
      <Link key={item.href} href={item.href} className={`sb-link ${active ? "is-current" : ""}`} aria-current={active ? "page" : undefined}>
        <Icon name={item.icon} size={18} />
        <span>{item.label}</span>
        {item.count ? <span className="sb-count">{item.count}</span> : null}
      </Link>
    );
  };

  return (
    <aside className="sidebar" aria-label="Navigasi">
      <Link href="/" className="sb-brand">
        <BrandLockup />
      </Link>
      <nav className="sb-nav">
        {link({ href: "/", label: "Beranda", icon: "home", match: (path) => path === "/" })}
        <div className="sb-section">Pekerjaan</div>
        {work.map(link)}
      </nav>
      <AvatarMenu initials={viewer.initials} name={viewer.name} className="sb-user">
        <span className="sb-ava">{viewer.initials}</span>
        <span className="sb-who">
          <b>{viewer.name}</b>
          <small>
            <RoleLabel viewer={viewer} />
          </small>
        </span>
        <Icon name="out" size={18} />
      </AvatarMenu>
    </aside>
  );
}
