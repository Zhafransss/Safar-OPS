"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { PhotoThumbs, photoUrl } from "@/components/photo-thumbs";
import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { UserPicker } from "@/components/user-picker";
import { formatError } from "@/config/error-codes";
import { errorText } from "@/lib/error-text";
import { PHOTO_ERROR, preparePhoto, uploadPhotos, withoutPhoto, type PendingPhoto } from "@/lib/photo-upload";
import { isClosed, MAX_PHOTOS, STATUS_BADGE, STATUS_LABEL } from "@/lib/report-rules";
import { useTRPC } from "@/lib/trpc-client";
import type { ReportDetailData } from "@/server/services/report";
import type { PickerUser } from "@/server/services/team";

type Dialog = "reject" | "finish" | "forward" | "cc" | null;

function Message({ message }: { message: ReportDetailData["messages"][number] }) {
  if (message.isSystem) {
    return (
      <div className="sysmsg">
        {message.body} · {message.date}
      </div>
    );
  }
  const { receipt } = message;
  return (
    <div className={`msg ${message.mine ? "me" : ""}`}>
      {!message.mine && <div className="who">{message.senderName}</div>}
      {message.body}
      {message.photoIds.length > 0 && <PhotoThumbs sources={message.photoIds.map(photoUrl)} />}
      <div className="foot">
        {message.date}{" "}
        {receipt && (
          <>
            <span className={`tick ${receipt.allRead ? "read" : ""}`} title={receipt.title}>
              <Icon name="tick" size={14} />
            </span>
            {receipt.initials.length > 0 && (
              <span className={`rdby ${receipt.allRead ? "all" : ""}`}>{receipt.initials.join(" ")}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Mockup vLapDetail.
export function ReportDetail({
  report,
  users,
  unreadCount,
}: {
  report: ReportDetailData;
  users: PickerUser[];
  unreadCount: number;
}) {
  const [messageText, setMessageText] = useState("");
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [sending, setSending] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const toast = useToast();
  const trpc = useTRPC();
  const { number, actions, status } = report;
  const closed = isClosed(status);

  const { mutate: markOpened } = useMutation(trpc.report.markOpened.mutationOptions());
  const messageCount = report.messages.length;

  useEffect(() => {
    markOpened({ number });
  }, [markOpened, number, messageCount]);

  // Mockup render: a report opens at the newest message. The frame lets ScrollReset run first.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const scroller = document.getElementById("scr");
      scroller?.scrollTo(0, scroller.scrollHeight);
    });
    return () => cancelAnimationFrame(frame);
  }, [messageCount]);

  function done(message?: string) {
    setDialog(null);
    if (message) toast(message);
    router.refresh();
  }
  const onError = (e: { message: string }) => {
    setDialog(null);
    setError(errorText(e.message));
  };

  const start = useMutation(
    trpc.report.start.mutationOptions({ onSuccess: () => done(`Status: ${STATUS_LABEL.IN_PROGRESS}.`), onError }),
  );
  const reject = useMutation(
    trpc.report.reject.mutationOptions({
      onSuccess: () => done("Laporan ditolak."),
      onError: (e) => {
        if (e.message.startsWith("PNG-LAP-07")) setReasonError(e.message);
        else onError(e);
      },
    }),
  );
  const finish = useMutation(trpc.report.finish.mutationOptions({ onSuccess: () => done("Laporan selesai."), onError }));
  const forward = useMutation(
    trpc.report.forward.mutationOptions({ onSuccess: ({ message }) => done(message), onError }),
  );
  const addCc = useMutation(trpc.report.addCc.mutationOptions({ onSuccess: ({ message }) => done(message), onError }));
  const sendMessage = useMutation(trpc.report.sendMessage.mutationOptions());

  async function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (photos.length + files.length > MAX_PHOTOS) return setError(formatError("PNG-LAP-06"));
    try {
      const prepared = await Promise.all(files.map(preparePhoto));
      setPhotos((current) => [...current, ...prepared]);
      setError("");
    } catch {
      setError(PHOTO_ERROR);
    }
  }

  async function send() {
    if (!messageText.trim() && photos.length === 0) return setError(formatError("PNG-LAP-08"));
    setSending(true);
    try {
      const photoKeys = await uploadPhotos(photos);
      await sendMessage.mutateAsync({ number, body: messageText, photoKeys });
      setMessageText("");
      setPhotos([]);
      setError("");
      router.refresh();
    } catch (e) {
      setError(errorText(e instanceof Error ? e.message : ""));
    } finally {
      setSending(false);
    }
  }

  function openReject() {
    setReason("");
    setReasonError("");
    setDialog("reject");
  }

  function confirmReject() {
    if (!reason.trim()) return setReasonError(formatError("PNG-LAP-07"));
    reject.mutate({ number, reason });
  }

  return (
    <>
      <PageHeader
        title={number}
        subtitle={report.typeLabel}
        backHref="/penugasan/laporan"
        unreadCount={unreadCount}
        right={
          <button
            className="bk"
            onClick={() => {
              router.refresh();
              toast("Diperbarui. Pesan baru muncul setelah refresh.");
            }}
            aria-label="Refresh"
          >
            <Icon name="refresh" size={18} />
          </button>
        }
      />
      <div className="pad" style={{ paddingBottom: 4 }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
            <b style={{ fontSize: 15, lineHeight: 1.3 }}>{report.title}</b>
            <span className={`badge ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: "8px 0 0" }}>{report.body}</p>
          {report.photoIds.length > 0 && <PhotoThumbs sources={report.photoIds.map(photoUrl)} />}
          <div className="mt">
            <div className="row">
              <span>Pelapor</span>
              <span>{report.fromName}</span>
            </div>
            <div className="row">
              <span>Penerima</span>
              <span>{report.toName}</span>
            </div>
            {report.ccNames.length > 0 && (
              <div className="row">
                <span>CC</span>
                <span>{report.ccNames.join(", ")}</span>
              </div>
            )}
            <div className="row">
              <span>Dibuat</span>
              <span>{report.created}</span>
            </div>
            {report.taskNames.length > 0 && (
              <div className="row">
                <span>Tugas</span>
                <span style={{ whiteSpace: "pre-line" }}>{report.taskNames.join("\n")}</span>
              </div>
            )}
          </div>
          {(actions.canStart || actions.canReject || actions.canFinish || actions.canForward || actions.canAddCc) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {actions.canStart && (
                <button className="btn sm" onClick={() => start.mutate({ number })} disabled={start.isPending}>
                  Tindak lanjuti
                </button>
              )}
              {actions.canReject && (
                <button className="btn sm warn" onClick={openReject}>
                  Tolak
                </button>
              )}
              {actions.canFinish && (
                <button className="btn sm" onClick={() => setDialog("finish")}>
                  Tandai selesai
                </button>
              )}
              {actions.canForward && (
                <button className="btn sm sec" onClick={() => setDialog("forward")}>
                  <Icon name="fwd" size={15} /> Teruskan
                </button>
              )}
              {actions.canAddCc && (
                <button className="btn sm sec" onClick={() => setDialog("cc")}>
                  <Icon name="plus" size={15} /> CC
                </button>
              )}
            </div>
          )}
          {actions.viewsAsLeader && <div className="alert info mt small">Dilihat sebagai leader {report.toName}.</div>}
        </div>
        <details className="box">
          <summary>Riwayat ({report.logs.length})</summary>
          {report.logs.map((log) => (
            <div key={log.id} className="log">
              {log.text}
            </div>
          ))}
        </details>
      </div>

      <div className="chat">
        {report.messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {report.messages.length === 0 && <div className="sysmsg">Belum ada balasan.</div>}
      </div>

      {closed ? (
        <div className="pad">
          <div className="lock-note">
            <Icon name="lock" size={14} /> Laporan sudah {STATUS_LABEL[status].toLowerCase()} dan tidak bisa dibuka
            kembali. Buat laporan baru jika masalah muncul lagi.
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="pad" style={{ paddingBottom: 0 }}>
              <div className="alert err">{error}</div>
            </div>
          )}
          {photos.length > 0 && (
            <div className="fcount">
              {photos.length}/{MAX_PHOTOS} foto siap dikirim
              <PhotoThumbs
                sources={photos.map((photo) => photo.url)}
                onRemove={(index) => setPhotos((current) => withoutPhoto(current, index))}
              />
            </div>
          )}
          <div className="composer">
            <button className="icbtn" onClick={() => fileInput.current?.click()} aria-label="Tambah foto">
              <Icon name="cam" />
            </button>
            <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={addPhotos} />
            <textarea
              id="msgIn"
              placeholder="Tulis pesan"
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
            />
            <button className="send" onClick={send} disabled={sending} aria-label="Kirim">
              <Icon name="send" size={18} />
            </button>
          </div>
        </>
      )}

      {dialog === "reject" && (
        <Sheet
          title="Tolak laporan"
          onClose={() => setDialog(null)}
          actions={[
            { label: "Batal", variant: "sec", onClick: () => setDialog(null) },
            { label: "Tolak", variant: "warn", onClick: confirmReject, disabled: reject.isPending },
          ]}
        >
          <label className="lab" htmlFor="tlk">
            Alasan penolakan
          </label>
          <textarea
            id="tlk"
            className="inp"
            placeholder="Wajib diisi"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          {reasonError && <div className="alert err mt">{reasonError}</div>}
        </Sheet>
      )}
      {dialog === "finish" && (
        <Sheet
          title="Tandai selesai?"
          onClose={() => setDialog(null)}
          actions={[
            { label: "Batal", variant: "sec", onClick: () => setDialog(null) },
            { label: "Tandai selesai", onClick: () => finish.mutate({ number }), disabled: finish.isPending },
          ]}
        >
          <p className="small" style={{ lineHeight: 1.5, margin: 0 }}>
            Laporan yang sudah selesai tidak bisa dibuka kembali.
          </p>
        </Sheet>
      )}
      {dialog === "forward" && (
        <UserPicker
          title="Teruskan ke"
          placeholder="Cari nama"
          users={users}
          exclude={[report.toId, report.fromId]}
          onClose={() => setDialog(null)}
          onPick={(toId) => forward.mutate({ number, toId })}
        />
      )}
      {dialog === "cc" && (
        <UserPicker
          title="Tambah CC"
          placeholder="Cari nama"
          users={users}
          exclude={[report.toId, report.fromId, ...report.ccIds]}
          onClose={() => setDialog(null)}
          onPick={(userId) => addCc.mutate({ number, userId })}
        />
      )}
    </>
  );
}
