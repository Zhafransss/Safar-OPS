"use client";

import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";

import { ChoiceSheet } from "@/components/choice-sheet";
import { DateField } from "@/components/date-field";
import { useLongPressDrag } from "@/components/drag-sensors";
import { Icon } from "@/components/icon";
import { PicField } from "@/components/pic-field";
import { ReportPopup } from "@/components/report-popup";
import { useToast } from "@/components/toast";
import { formatError } from "@/config/error-codes";
import { findTaskError, moveItem } from "@/lib/assignment-rules";
import { jakartaIsoDate } from "@/lib/date";
import { errorText } from "@/lib/error-text";
import { STATUS_LABEL } from "@/lib/report-rules";
import { useTRPC } from "@/lib/trpc-client";
import type { TaskFormData } from "@/server/services/assignment";

type DraftTodo = { key: number; name: string; instruction: string; picId: string; dueIso: string };

// dnd-kit treats an id of 0 as missing, and draft keys start at 0.
const dragId = (todo: DraftTodo) => `todo-${todo.key}`;

// U-08 in the new-task form: the card holds text fields, where a long press selects text, so only
// its header row ("To-do 1") starts the drag.
function SortableDraft({ id, header, children }: { id: string; header: ReactNode; children: ReactNode }) {
  const { listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`todo-ed ${isDragging ? "dragging" : ""}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <div ref={setActivatorNodeRef} className="h drag-handle" {...listeners}>
        {header}
      </div>
      {children}
    </div>
  );
}

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
  const sensors = useLongPressDrag();
  function drop({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setTodos((current) => {
      const ids = current.map(dragId);
      return moveItem(current, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    });
  }
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

      {/* U-03: a small Template button on the right of the heading, in place of the count. */}
      <div className="qh">
        <b>To-do</b>
        {form.templates.length > 0 ? (
          <button className="btn sec sm" onClick={() => setDialog("template")}>
            <Icon name="tpl" size={16} /> Template
          </button>
        ) : (
          <span>{todos.length} to-do</span>
        )}
      </div>
      <DndContext
        id="draft-order"
        sensors={sensors}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={drop}
      >
        <SortableContext items={todos.map(dragId)} strategy={verticalListSortingStrategy}>
          <div>
            {todos.map((todo, index) => (
              <SortableDraft
                key={todo.key}
                id={dragId(todo)}
                header={
                  <>
                    <span className="drag-label">
                      <Icon name="grip" size={16} /> To-do {index + 1}
                    </span>
                    <button
                      className="x"
                      onClick={() => setTodos((current) => current.filter((item) => item.key !== todo.key))}
                      aria-label="Hapus"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </>
                }
              >
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
                  <PicField
                    id={`tp${index}`}
                    members={form.members}
                    value={todo.picId}
                    placeholder="PIC"
                    onChange={(picId) => update(todo.key, { picId })}
                  />
                  <DateField
                    id={`tdl${index}`}
                    value={todo.dueIso}
                    placeholder="Deadline"
                    onChange={(dueIso) => update(todo.key, { dueIso })}
                  />
                </div>
              </SortableDraft>
            ))}
          </div>
        </SortableContext>
      </DndContext>
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

      {/* U-06: templates have names, so they sort alphabetically like the simulation. */}
      {dialog === "template" && (
        <ChoiceSheet
          title="Pilih template"
          placeholder="Cari template"
          items={[...form.templates]
            .sort((a, b) => a.name.localeCompare(b.name, "id"))
            .map((template) => ({
              key: template.id,
              label: template.name,
              sub: `${template.todos.length} to-do: ${template.todos.join(", ")}`,
              search: template.name,
            }))}
          onPick={applyTemplate}
          onClose={() => setDialog(null)}
        />
      )}
      {/* U-06. Reports have no name to sort by, so the newest number stays first (CHANGELOG 33). */}
      {dialog === "report" && (
        <ChoiceSheet
          title="Pilih laporan"
          placeholder="Cari no. atau judul laporan"
          items={form.reports.map((candidate) => ({
            key: candidate.number,
            label: `${candidate.number} · ${candidate.title}`,
            sub: `${STATUS_LABEL[candidate.status]} · dari ${candidate.fromName}`,
            search: `${candidate.number} ${candidate.title}`,
          }))}
          selectedKey={reportNumber}
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
