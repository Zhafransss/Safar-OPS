"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { DateInput } from "@/components/date-input";
import { Icon } from "@/components/icon";
import { PickSheet } from "@/components/pick-sheet";
import { ReportPopup } from "@/components/report-popup";
import { useToast } from "@/components/toast";
import { formatError } from "@/config/error-codes";
import { findTaskError } from "@/lib/assignment-rules";
import { jakartaIsoDate } from "@/lib/date";
import { errorText } from "@/lib/error-text";
import { STATUS_LABEL } from "@/lib/report-rules";
import { useTRPC } from "@/lib/trpc-client";
import type { TaskFormData } from "@/server/services/assignment";

type DraftTodo = { key: number; name: string; instruction: string; picId: string; dueIso: string };

const scrollToTop = () => document.getElementById("scr")?.scrollTo(0, 0);

// Mockup vTgsNew.
export function TaskForm({ form }: { form: TaskFormData }) {
  const [name, setName] = useState("");
  const [reportNumber, setReportNumber] = useState<string | null>(null);
  const [todos, setTodos] = useState<DraftTodo[]>([]);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<"template" | "report" | "popup" | null>(null);
  const nextKey = useRef(0);

  const router = useRouter();
  const toast = useToast();
  const trpc = useTRPC();
  const create = useMutation(
    trpc.task.create.mutationOptions({
      onSuccess: ({ id }) => {
        toast("Tugas dibuat.");
        router.replace(`/penugasan/tugas/${id}`);
      },
      onError: (e) => {
        setError(errorText(e.message));
        scrollToTop();
      },
    }),
  );

  const blank = (todoName = ""): DraftTodo => ({ key: nextKey.current++, name: todoName, instruction: "", picId: "", dueIso: "" });
  const update = (key: number, patch: Partial<DraftTodo>) =>
    setTodos((current) => current.map((todo) => (todo.key === key ? { ...todo, ...patch } : todo)));
  const move = (index: number, step: number) =>
    setTodos((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      if (item) next.splice(index + step, 0, item);
      return next;
    });
  const report = form.reports.find((candidate) => candidate.number === reportNumber);

  function save() {
    const memberIds = new Set(form.members.map((member) => member.id));
    const found = findTaskError(name, todos, jakartaIsoDate(new Date()), (id) => memberIds.has(id));
    if (found) {
      setError(formatError(found.code, found.params));
      return scrollToTop();
    }
    create.mutate({ programId: form.programId, name, reportNumber, todos });
  }

  function applyTemplate(id: string) {
    const template = form.templates.find((candidate) => candidate.id === id);
    setDialog(null);
    if (!template) return;
    setTodos((current) => [...current, ...template.todos.map((todoName) => blank(todoName))]);
    if (!name) setName(`${template.name} – `);
    toast(`${template.todos.length} to-do ditambahkan. Lengkapi PIC dan DL.`);
  }

  return (
    <div className="pad">
      {error && <div className="alert err">{error}</div>}
      <div className={`card ${error ? "mt" : ""}`}>
        <label className="lab" htmlFor="gN">
          Nama tugas
        </label>
        <input
          id="gN"
          className="inp"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Helm HL-02 – Data & Foto"
        />
        <label className="lab mt">No. Laporan (opsional)</label>
        <button className="picker" onClick={() => setDialog("report")}>
          {reportNumber ? <span>{reportNumber}</span> : <span className="ph">Pilih laporan terkait</span>}
          <span className="muted">›</span>
        </button>
        {reportNumber && (
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button className="btn sm sec" onClick={() => setDialog("popup")}>
              Lihat isi laporan
            </button>
            <button className="btn sm sec" onClick={() => setReportNumber(null)}>
              Hapus
            </button>
          </div>
        )}
      </div>

      <div className="qh">
        <b>To-do</b>
        <span>{todos.length} to-do</span>
      </div>
      {form.templates.length > 0 && (
        <button className="btn sec block" onClick={() => setDialog("template")}>
          <Icon name="tpl" size={18} /> Pakai template
        </button>
      )}
      {todos.map((todo, index) => (
        <div key={todo.key} className="todo-ed">
          <div className="h">
            <span>To-do {index + 1}</span>
            <span style={{ display: "flex", gap: 2 }}>
              <button className="x" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Naik">
                <Icon name="up" size={16} />
              </button>
              <button className="x" onClick={() => move(index, 1)} disabled={index === todos.length - 1} aria-label="Turun">
                <Icon name="down" size={16} />
              </button>
              <button
                className="x"
                onClick={() => setTodos((current) => current.filter((item) => item.key !== todo.key))}
                aria-label="Hapus"
              >
                <Icon name="trash" size={16} />
              </button>
            </span>
          </div>
          <input
            id={`tn${index}`}
            className="inp"
            placeholder="Nama to-do"
            value={todo.name}
            onChange={(e) => update(todo.key, { name: e.target.value })}
          />
          <textarea
            id={`ta${index}`}
            className="inp mt"
            style={{ minHeight: 52 }}
            placeholder="Arahan (opsional)"
            value={todo.instruction}
            onChange={(e) => update(todo.key, { instruction: e.target.value })}
          />
          <div className="g2 mt">
            <select
              id={`tp${index}`}
              className="sel"
              value={todo.picId}
              onChange={(e) => update(todo.key, { picId: e.target.value })}
            >
              <option value="">PIC</option>
              {form.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                  {member.isLeader ? " (leader)" : ""}
                </option>
              ))}
            </select>
            <DateInput
              id={`tdl${index}`}
              value={todo.dueIso}
              onChange={(e) => update(todo.key, { dueIso: e.target.value })}
              aria-label="DL"
            />
          </div>
        </div>
      ))}
      <button className="btn sec block mt" onClick={() => setTodos((current) => [...current, blank()])}>
        <Icon name="plus" size={18} /> Tambah to-do
      </button>
      <div className="todo-ed" style={{ background: "var(--accbg)", borderStyle: "solid", borderColor: "transparent" }}>
        <div className="h" style={{ margin: 0 }}>
          <span>QC · otomatis di urutan terakhir</span>
          <span>{form.leaderName}</span>
        </div>
      </div>
      <button className="btn block mt2" onClick={save} disabled={create.isPending}>
        Simpan tugas
      </button>

      {dialog === "template" && (
        <PickSheet
          title="Pilih template"
          placeholder="Cari template"
          items={form.templates.map((template) => ({
            key: template.id,
            label: template.name,
            sub: `${template.todos.length} to-do: ${template.todos.join(", ")}`,
            search: template.name,
          }))}
          onPick={applyTemplate}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "report" && (
        <PickSheet
          title="Pilih laporan"
          placeholder="Cari no. atau judul laporan"
          items={form.reports.map((candidate) => ({
            key: candidate.number,
            label: `${candidate.number} · ${candidate.title}`,
            sub: `${STATUS_LABEL[candidate.status]} · dari ${candidate.fromName}`,
            search: `${candidate.number} ${candidate.title}`,
          }))}
          onPick={(number) => {
            setReportNumber(number);
            setDialog(null);
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "popup" && report && <ReportPopup report={report} onClose={() => setDialog(null)} />}
    </div>
  );
}
