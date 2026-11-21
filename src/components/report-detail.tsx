"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type PointerEvent } from "react";

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
import { ATTACHMENT_ACCEPT, attachmentExtension, formatFileSize } from "@/lib/attachment-rules";
import { attachmentProblem, uploadAttachments } from "@/lib/attachment-upload";
import { copyImage, copyImages, copyText, photoFiles } from "@/lib/clipboard";
import { useTRPC } from "@/lib/trpc-client";
import type { ReportDetailData } from "@/server/services/report";
import type { PickerUser } from "@/server/services/team";

type Dialog = "reject" | "finish" | "forward" | "cc" | null;

const POLL_MS = 10_000;
// Within this distance of the end, the user counts as reading the newest messages.
const NEAR_BOTTOM_PX = 80;
// CHANGELOG 51: holding a message this long on a phone opens its Salin menu, unless the finger moves.
// With a mouse, the button beside the message opens the same menu (CHANGELOG 54).
const LONG_PRESS_MS = 450;
const LONG_PRESS_SLOP_PX = 10;

function Message({ message }: { message: ReportDetailData["messages"][number] }) {
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuBelow, setMenuBelow] = useState(false);
  const press = useRef<{ timer: ReturnType<typeof setTimeout>; x: number; y: number } | null>(null);
  const lastTouch = useRef(false);
  const longPressed = useRef(false);
  const shareFiles = useRef<Promise<File[]> | null>(null);
  const bubble = useRef<HTMLDivElement>(null);

  // The menu opens above the message, or below it when the page header would cover it.
  useLayoutEffect(() => {
    if (!menuOpen) return setMenuBelow(false);
    const menu = bubble.current?.querySelector(".msg-menu");
    const headerBottom = document.querySelector(".hd")?.getBoundingClientRect().bottom ?? 0;
    if (menu && menu.getBoundingClientRect().top < headerBottom + 8) setMenuBelow(true);
  }, [menuOpen]);

  // Salin semua foto may fall back to the share sheet, which needs the files ready at the tap.
  useEffect(() => {
    if (!menuOpen || message.photoIds.length < 2) return;
    const files = photoFiles(message.photoIds.map(photoUrl));
    files.catch(() => {});
    shareFiles.current = files;
  }, [menuOpen, message.photoIds]);

  // The menu closes on any touch outside the bubble.
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: Event) => {
      if (!bubble.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menuOpen]);

  function cancelPress() {
    if (press.current) clearTimeout(press.current.timer);
    press.current = null;
  }

  function startPress(event: PointerEvent) {
    lastTouch.current = event.pointerType === "touch";
    if (!lastTouch.current) return;
    cancelPress();
    longPressed.current = false;
    const open = () => {
      longPressed.current = true;
      setMenuOpen(true);
    };
    press.current = { timer: setTimeout(open, LONG_PRESS_MS), x: event.clientX, y: event.clientY };
  }

  function movePress(event: PointerEvent) {
    const start = press.current;
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > LONG_PRESS_SLOP_PX) cancelPress();
  }

  async function copyBody() {
    setMenuOpen(false);
    toast((await copyText(message.body)) ? "Teks disalin" : "Teks tidak bisa disalin");
  }

  // CHANGELOG 55.
  async function copyAllPhotos() {
    const urls = message.photoIds.map(photoUrl);
    const result = copyImages(urls, shareFiles.current ?? photoFiles(urls));
    setMenuOpen(false);
    const outcome = await result;
    if (outcome === "copied") toast(`${urls.length} foto disalin`);
    if (outcome === "failed") toast("Browser ini tidak bisa menyalin semua foto sekaligus. Salin satu per satu.");
  }

  // A message with one photo copies it directly; single photos of a larger set are copied from the
  // photo viewer (CHANGELOG 56).
  async function copyPhoto(id: string) {
    const copied = copyImage(photoUrl(id));
    setMenuOpen(false);
    toast((await copied) ? "Foto disalin" : "Foto tidak bisa disalin di browser ini");
  }

  if (message.isSystem) {
    return (
      <div className="sysmsg">
        {message.body} · {message.date}
      </div>
    );
  }
  const { receipt } = message;
  const hasText = message.body.trim() !== "";
  const photoCount = message.photoIds.length;
  const canCopy = hasText || photoCount > 0;
  return (
    <div
      ref={bubble}
      className={`msg ${message.mine ? "me" : ""} ${canCopy ? "copyable" : ""} ${menuOpen ? "menu-open" : ""}`}
      onPointerDown={canCopy ? startPress : undefined}
      onPointerMove={canCopy ? movePress : undefined}
      onPointerUp={cancelPress}
      onPointerCancel={cancelPress}
      // Android opens its own menu on a long press; the Salin menu takes its place.
      onContextMenu={canCopy ? (event) => lastTouch.current && event.preventDefault() : undefined}
      // Lifting the finger after a long press is not a tap: it must not also open a photo.
      onClickCapture={(event) => {
        if (!longPressed.current) return;
        longPressed.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {canCopy && (
        <button
          className="msg-copy"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Salin"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          title="Salin"
        >
          <Icon name="copy" size={15} />
        </button>
      )}
      {menuOpen && (
        <div className={`msg-menu ${menuBelow ? "below" : ""}`} role="menu">
          {hasText && (
            <button role="menuitem" onClick={copyBody}>
              <Icon name="copy" size={16} />
              Salin teks
            </button>
          )}
          {photoCount > 1 && (
            <button role="menuitem" onClick={copyAllPhotos}>
              <Icon name="layers" size={16} />
              Salin semua foto
            </button>
          )}
          {photoCount === 1 && (
            <button role="menuitem" onClick={() => copyPhoto(message.photoIds[0] ?? "")}>
              <Icon name="cam" size={16} />
              Salin foto
            </button>
          )}
        </div>
      )}
      {!message.mine && <div className="who">{message.senderName}</div>}
      {message.body}
      {message.photoIds.length > 0 && <PhotoThumbs sources={message.photoIds.map(photoUrl)} />}
      {message.attachments.length > 0 && (
        <div className="attach-list">
          {message.attachments.map((attachment) => (
            <a key={attachment.id} className="attach" href={`/api/attachments/${attachment.id}`} download={attachment.fileName}>
              <AttachmentLine name={attachment.fileName} size={attachment.sizeBytes} />
            </a>
          ))}
        </div>
      )}
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

// CHANGELOG 57: the file icon with its format, then the name and size.
function AttachmentLine({ name, size }: { name: string; size: number }) {
  return (
    <>
      <span className="attach-ico">
        <Icon name="file" size={18} />
        <b>{attachmentExtension(name)?.toUpperCase()}</b>
      </span>
      <span className="attach-text">
        <span className="attach-name">{name}</span>
        <small>{formatFileSize(size)}</small>
      </span>
    </>
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
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [sending, setSending] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const attachmentInput = useRef<HTMLInputElement>(null);
  const chatScroll = useRef<HTMLDivElement>(null);

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

  // CHANGELOG 24: while the chat is open and on screen, ask for the report's version every 10 s and
  // refresh only when it changed. TanStack Query pauses the interval while the app is in the background.
  const { data: latestVersion } = useQuery({
    ...trpc.report.version.queryOptions({ number }),
    enabled: !closed,
    refetchInterval: POLL_MS,
  });
  const refreshedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!latestVersion || latestVersion === report.version || refreshedFor.current === latestVersion) return;
    refreshedFor.current = latestVersion;
    router.refresh();
  }, [latestVersion, report.version, router]);

  // Mockup render: a report opens at the newest message. New messages and a growing composer keep it
  // there, unless the user scrolled up to read older messages.
  const stickToBottom = useRef(true);
  useEffect(() => {
    if (!stickToBottom.current) return;
    const frame = requestAnimationFrame(() => {
      const scroller = chatScroll.current;
      scroller?.scrollTo(0, scroller.scrollHeight);
    });
    return () => cancelAnimationFrame(frame);
  }, [messageCount, photos.length, error]);

  function trackScroll() {
    const scroller = chatScroll.current;
    if (scroller) stickToBottom.current = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < NEAR_BOTTOM_PX;
  }

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
    await addFiles(files);
  }

  // CHANGELOG 51: an image pasted into the message box joins the photos to send, like one picked
  // with the camera button. Pasted text still goes into the box as usual.
  async function pastePhotos(event: ClipboardEvent<HTMLTextAreaElement>) {
    const images = [...event.clipboardData.files].filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) return;
    if (!event.clipboardData.getData("text/plain")) event.preventDefault();
    await addFiles(images);
  }

  async function addFiles(files: File[]) {
    if (files.length === 0) return;
    if (photos.length + files.length > MAX_PHOTOS) return setError(formatError("PNG-LAP-06"));
    try {
      const prepared = await Promise.all(files.map(preparePhoto));
      setPhotos((current) => [...current, ...prepared]);
      setError("");
    } catch {
      setError(PHOTO_ERROR);
    }
  }

  // CHANGELOG 57: picked files wait above the box like photos; the rules are checked per file.
  function addAttachments(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    let picked = [...attachments];
    for (const file of files) {
      const problem = attachmentProblem(file, picked.length);
      if (problem) return setError(problem);
      picked = [...picked, file];
    }
    setAttachments(picked);
    setError("");
  }

  async function send() {
    if (!messageText.trim() && photos.length === 0 && attachments.length === 0) {
      return setError(formatError("PNG-LAP-08"));
    }
    setSending(true);
    try {
      const [photoKeys, uploaded] = await Promise.all([uploadPhotos(photos), uploadAttachments(attachments)]);
      await sendMessage.mutateAsync({ number, body: messageText, photoKeys, attachments: uploaded });
      setAttachments([]);
      setMessageText("");
      setPhotos([]);
      setError("");
      stickToBottom.current = true;
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
    <div className="chat-screen">
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
      <div className="chat-scroll" ref={chatScroll} onScroll={trackScroll}>
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

        {closed && (
          <div className="pad">
            <div className="lock-note">
              <Icon name="lock" size={14} /> Laporan sudah {STATUS_LABEL[status].toLowerCase()} dan tidak bisa dibuka
              kembali. Buat laporan baru jika masalah muncul lagi.
            </div>
          </div>
        )}
      </div>

      {!closed && (
        <div className="dock">
          {error && <div className="alert err">{error}</div>}
          {photos.length > 0 && (
            <div className="fcount">
              {photos.length}/{MAX_PHOTOS} foto siap dikirim
              <PhotoThumbs
                sources={photos.map((photo) => photo.url)}
                onRemove={(index) => setPhotos((current) => withoutPhoto(current, index))}
              />
            </div>
          )}
          {attachments.length > 0 && (
            <div className="attach-list attach-pending">
              {attachments.map((file, index) => (
                <div key={`${file.name}-${index}`} className="attach">
                  <AttachmentLine name={file.name} size={file.size} />
                  <button
                    className="attach-rm"
                    onClick={() => setAttachments((current) => current.filter((_, position) => position !== index))}
                    aria-label={`Hapus lampiran ${file.name}`}
                  >
                    <Icon name="x" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="composer">
            <button className="icbtn" onClick={() => fileInput.current?.click()} aria-label="Tambah foto">
              <Icon name="cam" size={18} />
            </button>
            <button className="icbtn" onClick={() => attachmentInput.current?.click()} aria-label="Lampirkan file">
              <Icon name="paperclip" size={18} />
            </button>
            <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={addPhotos} />
            <input
              ref={attachmentInput}
              type="file"
              accept={ATTACHMENT_ACCEPT}
              multiple
              hidden
              onChange={addAttachments}
            />
            <textarea
              id="msgIn"
              placeholder="Tulis pesan"
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              onPaste={pastePhotos}
            />
            <button className="send" onClick={send} disabled={sending} aria-label="Kirim">
              <Icon name="send" size={18} />
            </button>
          </div>
        </div>
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
    </div>
  );
}
