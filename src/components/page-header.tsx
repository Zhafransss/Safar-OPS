"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { BellButton } from "@/components/bell-button";
import { Icon } from "@/components/icon";

// Mockup hd(): orange sticky header with back, title, subtitle and bell.
export function PageHeader({
  title,
  subtitle,
  subtitleIsRoles = false,
  backHref,
  unreadCount,
}: {
  title: string;
  subtitle?: ReactNode;
  subtitleIsRoles?: boolean;
  backHref: string;
  unreadCount: number;
}) {
  const router = useRouter();
  return (
    <div className="hd">
      <button className="bk" onClick={() => router.push(backHref)} aria-label="Kembali">
        <Icon name="back" />
      </button>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="hd-t">{title}</div>
        {subtitle && <div className={`hd-s ${subtitleIsRoles ? "r" : ""}`}>{subtitle}</div>}
      </div>
      <BellButton count={unreadCount} small />
    </div>
  );
}
