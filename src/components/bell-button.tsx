"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";

import { Icon } from "@/components/icon";
import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { useTRPC } from "@/lib/trpc-client";
import type { NotificationItem } from "@/server/services/notification-inbox";

const UNDO_MS = 2500;
// Mockup bindSwipes: a touch this close to either edge belongs to the phone's back gesture.
const EDGE_PX = 24;

const GROUPS = [
  { category: "REPORT", title: "LAPORAN" },
  { category: "ASSIGNMENT", title: "PENUGASAN" },
] as const;

// Mockup nfrow with bindSwipes: swipe a third of the width either way to mark read; tap to open.
function SwipeRow({
  item,
  onRead,
  onOpen,
}: {
  item: NotificationItem;
  onRead: () => void;
  onOpen: () => void;
}) {
  const row = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const gesture = useRef({ active: false, x: 0, y: 0, dx: 0, lock: null as "h" | "v" | null, moved: false });

  function down(event: PointerEvent) {
    const app = document.getElementById("app")?.getBoundingClientRect();
    const g = gesture.current;
    g.moved = false;
    if (app && (event.clientX - app.left < EDGE_PX || app.right - event.clientX < EDGE_PX)) {
      g.active = false;
      return;
    }
    Object.assign(g, { active: true, x: event.clientX, y: event.clientY, dx: 0, lock: null });
    if (inner.current) inner.current.style.transition = "none";
  }

  function move(event: PointerEvent) {
    const g = gesture.current;
    if (!g.active || !inner.current || !row.current) return;
    const x = event.clientX - g.x;
    const y = event.clientY - g.y;
    if (g.lock === null && (Math.abs(x) > 8 || Math.abs(y) > 8)) {
      g.lock = Math.abs(x) > Math.abs(y) ? "h" : "v";
      if (g.lock === "h") row.current.setPointerCapture(event.pointerId);
    }
    if (g.lock !== "h") return;
    g.moved = true;
    g.dx = x;
    inner.current.style.transform = `translateX(${x}px)`;
    row.current.classList.toggle("l", x < 0);
  }

  function end() {
    const g = gesture.current;
    if (!g.active || !inner.current || !row.current) return;
    g.active = false;
    inner.current.style.transition = "transform .18s";
    if (g.lock === "h" && Math.abs(g.dx) > row.current.offsetWidth / 3) {
      inner.current.style.transform = `translateX(${g.dx > 0 ? 110 : -110}%)`;
      setTimeout(onRead, 170);
    } else {
      inner.current.style.transform = "";
    }
    // The click that follows this pointerup is dispatched in the same task; clear the flag after it,
    // so a swipe never swallows a later tap even when that click landed on the row instead.
    setTimeout(() => {
      gesture.current.moved = false;
    }, 0);
  }

  return (
    <div ref={row} className="nfrow" onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
      <div className="bg">
        <Icon name="check" size={16} />
        &nbsp;Dibaca
      </div>
      <div
        ref={inner}
        className="nfin"
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!gesture.current.moved) onOpen();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") onOpen();
        }}
      >
        <b>{item.text}</b>
        {item.isCc && <span className="cc">CC</span>}
        <small>{item.age}</small>
      </div>
    </div>
  );
}

// Mockup bell, openNotif, swipeRead, undoNotif and notifGo (FR-NTF-01 to 05).
export function BellButton({ count, small = false }: { count: number; small?: boolean }) {
  const [dialog, setDialog] = useState<"list" | "clear" | null>(null);
  const [undoId, setUndoId] = useState<string | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const toast = useToast();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const listKey = trpc.notification.list.queryKey();

  // K-T42: no polling. It loads with the page and again when the app regains focus.
  const { data } = useQuery(trpc.notification.list.queryOptions());
  const items = data ?? [];
  // The server count shows until the list arrives, so the badge never starts empty.
  const shown = data ? data.length : count;

  const removeLocally = (id: string) =>
    queryClient.setQueryData(listKey, (current) => current?.filter((item) => item.id !== id));
  const refetch = () => queryClient.invalidateQueries({ queryKey: listKey });

  const markRead = useMutation(trpc.notification.markRead.mutationOptions({ onError: refetch }));
  const undo = useMutation(trpc.notification.undo.mutationOptions({ onSettled: refetch }));
  const clearAll = useMutation(
    trpc.notification.clearAll.mutationOptions({
      onSuccess: () => {
        queryClient.setQueryData(listKey, []);
        toast("Notifikasi dibersihkan.");
      },
      onSettled: refetch,
    }),
  );
  const openTarget = useMutation(
    trpc.notification.open.mutationOptions({
      onSuccess: (result) => {
        if ("href" in result) router.push(result.href);
        else toast(result.denied);
      },
      onSettled: refetch,
    }),
  );

  useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    },
    [],
  );

  function swipeRead(id: string) {
    removeLocally(id);
    markRead.mutate({ id });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoId(id);
    undoTimer.current = setTimeout(() => setUndoId(null), UNDO_MS);
  }

  function undoRead() {
    if (!undoId) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undo.mutate({ id: undoId });
    setUndoId(null);
  }

  function openItem(id: string) {
    removeLocally(id);
    setDialog(null);
    openTarget.mutate({ id });
  }

  const groups = GROUPS.map((group) => ({ ...group, items: items.filter((item) => item.category === group.category) })).filter(
    (group) => group.items.length > 0,
  );
  const root = typeof document === "undefined" ? null : document.getElementById("app");

  return (
    <>
      <button className={small ? "bell sm" : "bell"} onClick={() => setDialog("list")} aria-label="Notifikasi">
        <Icon name="bell" size={small ? 19 : 20} />
        {shown > 0 && <span className="cnt">{shown}</span>}
      </button>

      {dialog === "list" && (
        <Sheet
          title="Notifikasi"
          onClose={() => setDialog(null)}
          actions={items.length ? [{ label: "Bersihkan semua", variant: "sec", onClick: () => setDialog("clear") }] : []}
        >
          {items.length > 0 ? (
            <>
              <div className="small muted" style={{ marginBottom: 2 }}>
                Geser ke kanan atau kiri untuk menandai dibaca. Ketuk untuk membuka.
              </div>
              {groups.map((group) => (
                <div key={group.category}>
                  <div className="nfh">
                    <span>
                      {group.title} ({group.items.length})
                    </span>
                  </div>
                  {group.items.map((item) => (
                    <SwipeRow
                      key={item.id}
                      item={item}
                      onRead={() => swipeRead(item.id)}
                      onOpen={() => openItem(item.id)}
                    />
                  ))}
                </div>
              ))}
            </>
          ) : (
            <div className="empty">Tidak ada notifikasi.</div>
          )}
        </Sheet>
      )}

      {dialog === "clear" && (
        <Sheet
          title="Bersihkan semua notifikasi?"
          onClose={() => setDialog(null)}
          actions={[
            { label: "Batal", variant: "sec", onClick: () => setDialog(null) },
            {
              label: "Bersihkan",
              onClick: () => {
                setDialog(null);
                clearAll.mutate();
              },
            },
          ]}
        >
          <p className="small" style={{ lineHeight: 1.5, margin: 0 }}>
            Semua notifikasi dianggap sudah dibaca dan hilang dari daftar.
          </p>
        </Sheet>
      )}

      {undoId &&
        root &&
        createPortal(
          <div className="toast undo" role="status">
            <span>Notifikasi ditandai dibaca.</span>
            <button onClick={undoRead}>Batalkan</button>
          </div>,
          root,
        )}
    </>
  );
}
