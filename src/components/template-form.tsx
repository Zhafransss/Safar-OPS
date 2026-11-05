"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icon } from "@/components/icon";
import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { errorText } from "@/lib/error-text";
import { useTRPC } from "@/lib/trpc-client";

const LIST_PATH = "/penugasan/template";

// Mockup vTplEdit.
export function TemplateForm({ template }: { template: { id: string; name: string; todos: string[] } | null }) {
  const [name, setName] = useState(template?.name ?? "");
  const [todos, setTodos] = useState<string[]>(template?.todos ?? [""]);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  const router = useRouter();
  const toast = useToast();
  const trpc = useTRPC();

  function finish(message: string) {
    toast(message);
    router.push(LIST_PATH);
  }
  const onError = (e: { message: string }) => setError(errorText(e.message));
  const saved = { onSuccess: () => finish("Template disimpan. Tugas yang sudah berjalan tidak berubah."), onError };
  const create = useMutation(trpc.template.create.mutationOptions(saved));
  const update = useMutation(trpc.template.update.mutationOptions(saved));
  const remove = useMutation(
    trpc.template.remove.mutationOptions({
      onSuccess: () => finish("Template dihapus."),
      onError: (e) => {
        setConfirming(false);
        onError(e);
      },
    }),
  );

  function save() {
    if (template) update.mutate({ id: template.id, name, todos });
    else create.mutate({ name, todos });
  }

  return (
    <div className="pad">
      {error && <div className="alert err">{error}</div>}
      <div className={`card ${error ? "mt" : ""}`}>
        <label className="lab" htmlFor="tpN">
          Nama template
        </label>
        <input
          id="tpN"
          className="inp"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Materi Promosi"
        />

        <label className="lab mt">Daftar to-do</label>
        {todos.map((todo, index) => (
          <div key={index} className="srch" style={{ marginTop: 6 }}>
            <input
              id={`tpt${index}`}
              className="inp"
              value={todo}
              onChange={(e) => setTodos(todos.map((item, i) => (i === index ? e.target.value : item)))}
              placeholder={`To-do ${index + 1}`}
            />
            <button className="icbtn" onClick={() => setTodos(todos.filter((_, i) => i !== index))} aria-label="Hapus">
              <Icon name="trash" size={16} />
            </button>
          </div>
        ))}
        <button className="btn sec sm mt" onClick={() => setTodos([...todos, ""])}>
          <Icon name="plus" size={16} /> Tambah to-do
        </button>
      </div>

      <button className="btn block mt2" onClick={save} disabled={create.isPending || update.isPending}>
        Simpan template
      </button>
      {template && (
        <button className="btn warn block mt" onClick={() => setConfirming(true)}>
          Hapus template
        </button>
      )}

      {confirming && template && (
        <Sheet
          title="Hapus template?"
          onClose={() => setConfirming(false)}
          actions={[
            { label: "Batal", variant: "sec", onClick: () => setConfirming(false) },
            {
              label: "Hapus",
              variant: "warn",
              onClick: () => remove.mutate({ id: template.id }),
              disabled: remove.isPending,
            },
          ]}
        >
          <p className="small" style={{ lineHeight: 1.5, margin: 0 }}>
            Tugas yang sudah dibuat dari template ini tidak terpengaruh.
          </p>
        </Sheet>
      )}
    </div>
  );
}
