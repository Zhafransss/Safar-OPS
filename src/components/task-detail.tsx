"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DateInput } from "@/components/date-input";
import { Icon } from "@/components/icon";
import { TeamChip } from "@/components/role-label";
import { ReportPopup } from "@/components/report-popup";
import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { formatError } from "@/config/error-codes";
import { findRevisionError, findTodoError, PROGRAM_STATUS_LABEL } from "@/lib/assignment-rules";
import { jakartaIsoDate } from "@/lib/date";
import { errorText } from "@/lib/error-text";
import { useTRPC } from "@/lib/trpc-client";
import type { TaskDetailData } from "@/server/services/assignment";

type Todo = TaskDetailData["todos"][number];
type Dialog =
  | { kind: "menu"; todo: Todo; index: number }
  | { kind: "edit"; todo: Todo | null }
  | { kind: "deleteTodo"; todo: Todo }
  | { kind: "approve" | "revise" | "deleteTask" | "report" }
  | null;

const confirmText = (text: string) => (
  <p className="small" style={{ lineHeight: 1.5, margin: 0 }}>
    {text}
  </p>
);

// Mockup todoForm, used for both "Tambah to-do" and "Edit to-do".
function TodoFormSheet({
  task,
  todo,
  onClose,
  onDelete,
}: {
  task: TaskDetailData;
  todo: Todo | null;
  onClose: () => void;
  onDelete: () => void;
}) {
  const memberIds = new Set(task.members.map((member) => member.id));
  const [name, setName] = useState(todo?.name ?? "");
  const [instruction, setInstruction] = useState(todo?.instruction ?? "");
  const [picId, setPicId] = useState(todo && memberIds.has(todo.picId) ? todo.picId : "");
  const [dueIso, setDueIso] = useState(todo?.dueIso ?? "");
  const [error, setError] = useState("");
  const router = useRouter();
  const toast = useToast();
  const trpc = useTRPC();
  const handlers = (message: string) => ({
    onSuccess: () => {
      onClose();
      toast(message);
      router.refresh();
    },
    onError: (e: { message: string }) => setError(errorText(e.message)),
  });
  const add = useMutation(trpc.todo.add.mutationOptions(handlers("To-do ditambahkan.")));
  const update = useMutation(trpc.todo.update.mutationOptions(handlers("To-do diperbarui.")));

  function save() {
    const draft = { name, instruction, picId, dueIso };
    const found = findTodoError([draft], jakartaIsoDate(new Date()), (id) => memberIds.has(id), todo?.dueIso);
    if (found) return setError(formatError(found.code, found.params));
    if (todo) update.mutate({ ...draft, todoId: todo.id });
    else add.mutate({ ...draft, taskId: task.id });
  }

  return (
    <Sheet
      title={todo ? "Edit to-do" : "Tambah to-do"}
      onClose={onClose}
      actions={[
        ...(todo
          ? [
              {
                label: (
                  <>
                    <Icon name="trash" size={16} /> Hapus
                  </>
                ),
                variant: "warn" as const,
                onClick: onDelete,
              },
            ]
          : []),
        { label: "Simpan", onClick: save, disabled: add.isPending || update.isPending },
      ]}
    >
      {error && (
        <div className="alert err" style={{ marginBottom: 8 }}>
          {error}
        </div>
      )}
      <label className="lab" htmlFor="teN">
        Nama to-do
      </label>
      <input id="teN" className="inp" value={name} onChange={(e) => setName(e.target.value)} />
      <label className="lab mt" htmlFor="teA">
        Arahan (opsional)
      </label>
      <textarea
        id="teA"
        className="inp"
        style={{ minHeight: 60 }}
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
      />
      <div className="g2 mt">
        <div>
          <label className="lab" htmlFor="teP">
            PIC
          </label>
          <select id="teP" className="sel" value={picId} onChange={(e) => setPicId(e.target.value)}>
            <option value="">Pilih</option>
            {task.members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
                {member.isLeader ? " (leader)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="lab" htmlFor="teD">
            DL
          </label>
          <DateInput id="teD" value={dueIso} onChange={(e) => setDueIso(e.target.value)} />
        </div>
      </div>
      {todo?.needsReassign && <div className="alert err mt small">PIC lama sudah tidak di tim. Pilih PIC baru.</div>}
    </Sheet>
  );
}

// Mockup qcFail (K-T13, K-T59): pick to-dos and write a note for each.
function ReviseSheet({ task, onClose }: { task: TaskDetailData; onClose: () => void }) {
  const [picked, setPicked] = useState<Record<string, string | undefined>>({});
  const [error, setError] = useState("");
  const router = useRouter();
  const toast = useToast();
  const trpc = useTRPC();
  const revise = useMutation(
    trpc.qc.returnForRevision.mutationOptions({
      onSuccess: ({ count }) => {
        onClose();
        toast(`${count} to-do dikembalikan untuk revisi.`);
        router.refresh();
      },
      onError: (e) => setError(errorText(e.message)),
    }),
  );

  function submit() {
    const picks = task.todos.filter((todo) => picked[todo.id] !== undefined);
    const found = findRevisionError(picks.map((todo) => ({ todoName: todo.name, note: picked[todo.id] ?? "" })));
    if (found) return setError(formatError(found.code, found.params));
    revise.mutate({ taskId: task.id, picks: picks.map((todo) => ({ todoId: todo.id, note: picked[todo.id] ?? "" })) });
  }

  return (
    <Sheet
      title="Kembalikan untuk revisi"
      onClose={onClose}
      actions={[
        { label: "Batal", variant: "sec", onClick: onClose },
        { label: "Kembalikan", variant: "warn", onClick: submit, disabled: revise.isPending },
      ]}
    >
      {error && (
        <div className="alert err" style={{ marginBottom: 8 }}>
          {error}
        </div>
      )}
      <div className="small muted" style={{ marginBottom: 6 }}>
        Pilih to-do yang perlu direvisi, lalu tulis catatan untuk masing-masing.
      </div>
      {task.todos.map((todo, index) => {
        const on = picked[todo.id] !== undefined;
        return (
          <div key={todo.id} style={{ borderBottom: "1px dashed var(--line)", padding: "6px 0" }}>
            <label className="chk" style={{ margin: 0 }}>
              <input
                type="checkbox"
                id={`qc${index}`}
                checked={on}
                onChange={(e) =>
                  setPicked((current) => ({ ...current, [todo.id]: e.target.checked ? "" : undefined }))
                }
              />
              <span>
                {todo.name}
                <br />
                <small className="muted">{todo.picName}</small>
              </span>
            </label>
            {on && (
              <div style={{ marginTop: 6 }}>
                <textarea
                  id={`qcN${index}`}
                  className="inp"
                  style={{ minHeight: 52 }}
                  placeholder={`Catatan revisi untuk ${todo.name} (wajib)`}
                  value={picked[todo.id]}
                  onChange={(e) => setPicked((current) => ({ ...current, [todo.id]: e.target.value }))}
                />
              </div>
            )}
          </div>
        );
      })}
    </Sheet>
  );
}

// Mockup vTgsDetail.
export function TaskDetail({ task }: { task: TaskDetailData }) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const router = useRouter();
  const toast = useToast();
  const trpc = useTRPC();
  const editable = task.canManage && !task.locked;

  const refreshWith = (message?: string) => () => {
    setDialog(null);
    if (message) toast(message);
    router.refresh();
  };
  const onError = (e: { message: string }) => {
    setDialog(null);
    toast(errorText(e.message));
  };
  const toggle = useMutation(
    trpc.todo.toggle.mutationOptions({
      onSuccess: ({ done }) => refreshWith(done ? "To-do selesai." : "Centang dibatalkan.")(),
      onError,
    }),
  );
  const move = useMutation(trpc.todo.move.mutationOptions({ onSuccess: refreshWith(), onError }));
  const removeTodo = useMutation(trpc.todo.remove.mutationOptions({ onSuccess: refreshWith("To-do dihapus."), onError }));
  const approve = useMutation(
    trpc.qc.approve.mutationOptions({ onSuccess: refreshWith("QC lolos. Tugas selesai."), onError }),
  );
  const removeTask = useMutation(
    trpc.task.remove.mutationOptions({
      onSuccess: ({ programId }) => {
        setDialog(null);
        toast("Tugas dihapus.");
        router.replace(`/penugasan/program/${programId}`);
      },
      onError,
    }),
  );

  const { progress } = task;
  const qcState = task.closed ? "ok" : task.allDone ? "" : "lock";

  return (
    <div className="pad">
      <div className="card">
        <div className={`pbar ${progress.percent === 100 ? "full" : ""}`} style={{ marginTop: 0 }}>
          <i style={{ width: `${progress.percent}%` }} />
        </div>
        <div className="pmeta">
          <span>
            {progress.done}/{progress.total} langkah
          </span>
          <span>{progress.percent}%</span>
        </div>
        <div className="mt">
          <div className="row">
            <span>Status</span>
            <span>
              {task.closed ? <span className="badge b-green">Selesai</span> : <span className="badge b-blue">Berjalan</span>}
            </span>
          </div>
          <div className="row">
            <span>Dibuat</span>
            <span>
              {task.created} oleh {task.createdBy}
            </span>
          </div>
          <div className="row">
            <span>Tim</span>
            <span>
              <TeamChip color={task.team.color}>{task.team.name}</TeamChip>
            </span>
          </div>
          {task.report && (
            <div className="row">
              <span>Laporan</span>
              <span>
                <button className="btn sm sec" onClick={() => setDialog({ kind: "report" })}>
                  {task.report.number}
                </button>
              </span>
            </div>
          )}
        </div>
        {task.summary && (
          <div className="flags">
            <span className={`badge ${task.summary.badge}`}>{task.summary.text}</span>
          </div>
        )}
      </div>

      {!task.canManage && !task.closed && (
        <p className="small muted">
          Anda hanya bisa mencentang to-do milik Anda. Butuh to-do tambahan? Kirim Laporan ke {task.leaderName}.
        </p>
      )}

      <div className="listbox mt">
        {task.todos.map((todo, index) => {
          const canTick = todo.mine && !task.locked;
          return (
            <div key={todo.id} className={`todo ${todo.isDone ? "done" : ""}`}>
              <button
                className={`tbox ${todo.isDone ? "on" : ""}`}
                disabled={!canTick || toggle.isPending}
                onClick={() => toggle.mutate({ todoId: todo.id })}
                aria-label={`${todo.isDone ? "Batalkan centang" : "Centang"} ${todo.name}`}
              >
                {todo.isDone && <Icon name="check" size={16} />}
              </button>
              <div className="tbody">
                <b>{todo.name}</b>
                <div className="tmeta">
                  <span>
                    {todo.picName}
                    {todo.mine ? " (saya)" : ""}
                  </span>
                  <span>DL {todo.dueShort}</span>
                  {todo.due && <span className={`badge ${todo.due.badge}`}>{todo.due.label}</span>}
                  {todo.revisionCount > 0 && <span className="badge b-gold">Revisi {todo.revisionCount}</span>}
                  {todo.needsReassign && <span className="badge b-red">Perlu dialihkan</span>}
                </div>
                {todo.instruction && (
                  <div className="arah">
                    <b style={{ fontSize: 11, display: "inline" }}>Arahan:</b> {todo.instruction}
                  </div>
                )}
                {todo.revisionNote && !todo.isDone && (
                  <div className="revn">
                    <b style={{ fontSize: 11, display: "inline" }}>Catatan revisi:</b> {todo.revisionNote}
                  </div>
                )}
              </div>
              {editable && (
                <div className="tact">
                  {/* CHANGELOG 5: one 44 px menu instead of three stacked 22 px buttons (K-T82). */}
                  <button
                    className="tmenu"
                    onClick={() => setDialog({ kind: "menu", todo, index })}
                    aria-label={`Menu ${todo.name}`}
                  >
                    ⋯
                  </button>
                </div>
              )}
            </div>
          );
        })}
        <div className="todo qc">
          <div className={`qcb ${qcState}`}>
            <Icon name={task.closed ? "check" : task.allDone ? "shield" : "lock"} size={15} />
          </div>
          <div className="tbody">
            <b>QC oleh {task.leaderName}</b>
            <div className="tmeta">{task.closed ? "Lolos QC" : task.allDone ? "Siap diperiksa" : "Menunggu to-do selesai"}</div>
            {task.isLeader && task.allDone && !task.locked && (
              <div className="btns mt">
                <button className="btn sm warn" onClick={() => setDialog({ kind: "revise" })}>
                  Kembalikan revisi
                </button>
                <button className="btn sm" onClick={() => setDialog({ kind: "approve" })}>
                  Approve QC
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {editable && (
        <button className="btn sec block mt" onClick={() => setDialog({ kind: "edit", todo: null })}>
          <Icon name="plus" size={18} /> Tambah to-do
        </button>
      )}
      {task.locked && !task.closed && (
        <div className="lock-note">
          <Icon name="lock" size={14} /> Program {PROGRAM_STATUS_LABEL[task.programStatus].toLowerCase()}. Tugas terkunci.
        </div>
      )}
      <details className="box">
        <summary>Riwayat ({task.logs.length})</summary>
        {task.logs.map((log) => (
          <div key={log.id} className="log">
            {log.text}
          </div>
        ))}
      </details>
      {editable && (
        <button className="btn warn block mt" onClick={() => setDialog({ kind: "deleteTask" })}>
          Hapus tugas
        </button>
      )}

      {dialog?.kind === "menu" && (
        <Sheet title={dialog.todo.name} onClose={() => setDialog(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              className="btn sec block"
              disabled={dialog.index === 0 || move.isPending}
              onClick={() => move.mutate({ todoId: dialog.todo.id, direction: -1 })}
            >
              <Icon name="up" size={16} /> Naik
            </button>
            <button className="btn sec block" onClick={() => setDialog({ kind: "edit", todo: dialog.todo })}>
              <Icon name="pen" size={16} /> Edit
            </button>
            <button
              className="btn sec block"
              disabled={dialog.index === task.todos.length - 1 || move.isPending}
              onClick={() => move.mutate({ todoId: dialog.todo.id, direction: 1 })}
            >
              <Icon name="down" size={16} /> Turun
            </button>
          </div>
        </Sheet>
      )}
      {dialog?.kind === "edit" && (
        <TodoFormSheet
          task={task}
          todo={dialog.todo}
          onClose={() => setDialog(null)}
          onDelete={() => dialog.todo && setDialog({ kind: "deleteTodo", todo: dialog.todo })}
        />
      )}
      {dialog?.kind === "deleteTodo" && (
        <Sheet
          title="Hapus to-do?"
          onClose={() => setDialog(null)}
          actions={[
            { label: "Batal", variant: "sec", onClick: () => setDialog(null) },
            {
              label: "Hapus",
              variant: "warn",
              onClick: () => removeTodo.mutate({ todoId: dialog.todo.id }),
              disabled: removeTodo.isPending,
            },
          ]}
        >
          {confirmText(`"${dialog.todo.name}" dihapus dari tugas dan tercatat di riwayat.`)}
        </Sheet>
      )}
      {dialog?.kind === "approve" && (
        <Sheet
          title="Approve QC?"
          onClose={() => setDialog(null)}
          actions={[
            { label: "Batal", variant: "sec", onClick: () => setDialog(null) },
            { label: "Approve QC", onClick: () => approve.mutate({ taskId: task.id }), disabled: approve.isPending },
          ]}
        >
          {confirmText("Tugas akan tertutup otomatis. Pekerjaan setelah QC dibuat sebagai tugas baru.")}
        </Sheet>
      )}
      {dialog?.kind === "revise" && <ReviseSheet task={task} onClose={() => setDialog(null)} />}
      {dialog?.kind === "deleteTask" && (
        <Sheet
          title="Hapus tugas?"
          onClose={() => setDialog(null)}
          actions={[
            { label: "Batal", variant: "sec", onClick: () => setDialog(null) },
            {
              label: "Hapus",
              variant: "warn",
              onClick: () => removeTask.mutate({ id: task.id }),
              disabled: removeTask.isPending,
            },
          ]}
        >
          {confirmText(
            `"${task.name}" hilang dari daftar dan progress program. PIC to-do di tugas ini diberi notifikasi.`,
          )}
        </Sheet>
      )}
      {dialog?.kind === "report" && task.report && (
        <ReportPopup report={task.report} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}
