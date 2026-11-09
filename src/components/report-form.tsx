"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";

import { Icon } from "@/components/icon";
import { PhotoThumbs } from "@/components/photo-thumbs";
import { useToast } from "@/components/toast";
import { UserPicker } from "@/components/user-picker";
import { formatError } from "@/config/error-codes";
import { errorText } from "@/lib/error-text";
import { PHOTO_ERROR, preparePhoto, uploadPhotos, withoutPhoto, type PendingPhoto } from "@/lib/photo-upload";
import { findReportError, MAX_PHOTOS, REPORT_TYPES, type ReportType } from "@/lib/report-rules";
import { useTRPC } from "@/lib/trpc-client";
import type { PickerUser } from "@/server/services/team";

// The mockup words this one differently from the per-message limit in PRD section 13.
const TOO_MANY_PHOTOS = "PNG-LAP-06: Maksimal 5 foto.";

const scrollToTop = () => document.getElementById("scr")?.scrollTo(0, 0);

// Mockup vLapNew.
export function ReportForm({ users, meId }: { users: PickerUser[]; meId: string }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ReportType | null>(null);
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [toId, setToId] = useState<string | null>(null);
  const [ccIds, setCcIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [picking, setPicking] = useState<"to" | "cc" | null>(null);
  const [sending, setSending] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const toast = useToast();
  const trpc = useTRPC();
  const create = useMutation(trpc.report.create.mutationOptions());

  const nameOf = (id: string) => users.find((user) => user.id === id)?.name ?? "";

  function fail(message: string) {
    setError(message);
    scrollToTop();
  }

  async function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (photos.length + files.length > MAX_PHOTOS) return fail(TOO_MANY_PHOTOS);
    try {
      const prepared = await Promise.all(files.map(preparePhoto));
      setPhotos((current) => [...current, ...prepared]);
      setError("");
    } catch {
      fail(PHOTO_ERROR);
    }
  }

  async function send() {
    // Checked before uploading so a rejected form leaves no stray photos behind.
    const code = findReportError({ title, type, body, toId }, meId);
    if (code) return fail(formatError(code));
    setSending(true);
    try {
      const photoKeys = await uploadPhotos(photos);
      const created = await create.mutateAsync({ title, type, body, toId, ccIds, photoKeys });
      toast(`${created.number} terkirim ke ${created.toName}.`);
      router.replace(`/penugasan/laporan/${created.number}`);
    } catch (e) {
      fail(errorText(e instanceof Error ? e.message : ""));
      setSending(false);
    }
  }

  return (
    <div className="pad">
      {error && <div className="alert err">{error}</div>}
      <div className={`card ${error ? "mt" : ""}`}>
        <label className="lab" htmlFor="lJ">
          Judul
        </label>
        <input
          id="lJ"
          className="inp"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Contoh: Serah terima PO-130"
        />

        <label className="lab mt">Jenis</label>
        <div className="pills" style={{ flexWrap: "wrap" }}>
          {REPORT_TYPES.map((option) => (
            <button
              key={option.value}
              className={`pill ${type === option.value ? "on" : ""}`}
              onClick={() => setType(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className="lab mt" htmlFor="lI">
          Isi
        </label>
        <textarea
          id="lI"
          className="inp"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Tulis laporan"
        />

        <label className="lab mt">Foto (opsional)</label>
        <PhotoThumbs
          sources={photos.map((photo) => photo.url)}
          onRemove={(index) => setPhotos((current) => withoutPhoto(current, index))}
        >
          <button
            className="foto"
            style={{ border: "1.5px dashed var(--line)", cursor: "pointer" }}
            onClick={() => fileInput.current?.click()}
            aria-label="Tambah foto"
          >
            <Icon name="plus" size={18} />
          </button>
        </PhotoThumbs>
        <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={addPhotos} />
        <div className="small muted" style={{ marginTop: 4 }}>
          {photos.length}/{MAX_PHOTOS} foto · dikompres otomatis
        </div>
      </div>

      <div className="card mt">
        <label className="lab">Penerima</label>
        <button className="picker" onClick={() => setPicking("to")}>
          {toId ? <span>{nameOf(toId)}</span> : <span className="ph">Tag satu orang</span>}
          <span className="muted">›</span>
        </button>

        <label className="lab mt">CC (opsional)</label>
        <div>
          {ccIds.map((id) => (
            <span key={id} className="mchip">
              {nameOf(id)}
              <button onClick={() => setCcIds(ccIds.filter((x) => x !== id))} aria-label="Hapus">
                <Icon name="x" size={14} />
              </button>
            </span>
          ))}
        </div>
        <button className="btn sec sm mt" onClick={() => setPicking("cc")}>
          <Icon name="plus" size={16} /> Tambah CC
        </button>
      </div>

      <button className="btn block mt2" onClick={send} disabled={sending}>
        Kirim laporan
      </button>

      {picking === "to" && (
        <UserPicker
          title="Pilih penerima"
          users={users}
          exclude={[]}
          onClose={() => setPicking(null)}
          onPick={(id) => {
            setToId(id);
            setCcIds(ccIds.filter((x) => x !== id));
            setPicking(null);
          }}
        />
      )}
      {picking === "cc" && (
        <UserPicker
          title="Tambah CC"
          users={users}
          exclude={[meId, toId, ...ccIds]}
          onClose={() => setPicking(null)}
          onPick={(id) => {
            setCcIds([...ccIds, id]);
            setPicking(null);
          }}
        />
      )}
    </div>
  );
}
