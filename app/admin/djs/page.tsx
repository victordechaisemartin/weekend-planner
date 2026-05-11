"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getEventId } from "@/lib/constants";

// ── types ─────────────────────────────────────────────────────

type DBDj = {
  id: string;
  event_id: string;
  name: string;
  alias: string | null;
  style: string | null;
  photo: string | null;
  revealed: boolean;
  display_order: number | null;
};

type DJForm = {
  name: string;
  alias: string;
  style: string;
  photo: string;
  revealed: boolean;
};

const EMPTY_FORM: DJForm = {
  name: "", alias: "", style: "", photo: "", revealed: false,
};

// ── component ─────────────────────────────────────────────────

export default function AdminDJsPage() {
  const [djs,         setDjs]         = useState<DBDj[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm,     setAddForm]     = useState<DJForm>(EMPTY_FORM);
  const [posting,     setPosting]     = useState(false);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editForm,    setEditForm]    = useState<DJForm>(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [confirmId,   setConfirmId]   = useState<string | null>(null);
  const [toast,       setToast]       = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchDJs() {
    const eventId = await getEventId();
    if (!eventId) return;
    const { data } = await supabase
      .from("djs")
      .select("*")
      .eq("event_id", eventId)
      .order("display_order", { ascending: true, nullsFirst: false });
    setDjs((data ?? []) as DBDj[]);
    setLoading(false);
  }

  useEffect(() => { fetchDJs(); }, []);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2500);
  }

  // ── add ───────────────────────────────────────────────────────

  async function handleAdd() {
    if (!addForm.name.trim()) return;
    setPosting(true);
    const eventId = await getEventId();
    if (!eventId) { setPosting(false); return; }

    const { error } = await supabase.from("djs").insert({
      event_id: eventId,
      name:     addForm.name.trim(),
      alias:    addForm.alias.trim()  || null,
      style:    addForm.style.trim()  || null,
      photo:    addForm.photo.trim()  || null,
      revealed: addForm.revealed,
    });

    if (!error) {
      setAddForm(EMPTY_FORM);
      setShowAddForm(false);
      showToast("DJ ajouté ✓");
      await fetchDJs();
    }
    setPosting(false);
  }

  // ── reveal toggle ─────────────────────────────────────────────

  async function handleToggleReveal(dj: DBDj) {
    await supabase
      .from("djs")
      .update({ revealed: !dj.revealed })
      .eq("id", dj.id);
    await fetchDJs();
  }

  // ── edit ──────────────────────────────────────────────────────

  function startEdit(dj: DBDj) {
    setEditingId(dj.id);
    setEditForm({
      name:     dj.name,
      alias:    dj.alias    ?? "",
      style:    dj.style    ?? "",
      photo:    dj.photo    ?? "",
      revealed: dj.revealed,
    });
    setConfirmId(null);
  }

  async function handleSave(id: string) {
    setSaving(true);
    const { error } = await supabase.from("djs").update({
      name:     editForm.name.trim(),
      alias:    editForm.alias.trim()  || null,
      style:    editForm.style.trim()  || null,
      photo:    editForm.photo.trim()  || null,
      revealed: editForm.revealed,
    }).eq("id", id);

    if (!error) {
      setEditingId(null);
      showToast("DJ mis à jour ✓");
      await fetchDJs();
    }
    setSaving(false);
  }

  // ── delete ────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    await supabase.from("djs").delete().eq("id", id);
    setConfirmId(null);
    setEditingId(null);
    await fetchDJs();
  }

  // ── render ────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-sm font-bold shadow-lg"
          style={{ background: "#F4A7B9", color: "#2D2D2D" }}
        >
          {toast}
        </div>
      )}

      {/* ── Add DJ button / form ── */}
      <div className="rounded-3xl overflow-hidden shadow-sm" style={{ background: "white" }}>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 font-bold text-sm transition-colors"
          style={{ color: "#2D2D2D" }}
        >
          <span>+ Ajouter un DJ</span>
          <span
            className="text-lg transition-transform"
            style={{ transform: showAddForm ? "rotate(45deg)" : undefined }}
          >
            🎧
          </span>
        </button>

        {showAddForm && (
          <div className="px-4 pb-4 space-y-3 border-t border-[#2D2D2D]/08">
            <DJFormFields form={addForm} onChange={setAddForm} />
            <button
              onClick={handleAdd}
              disabled={posting || !addForm.name.trim()}
              className="w-full rounded-full py-3 text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "#F4A7B9", color: "#2D2D2D" }}
            >
              {posting ? "Ajout…" : "Ajouter 🌸"}
            </button>
          </div>
        )}
      </div>

      {/* ── DJ list ── */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 rounded-3xl animate-pulse"
              style={{ background: "#F4A7B933" }}
            />
          ))}
        </div>
      ) : djs.length === 0 ? (
        <div className="py-16 text-center space-y-1">
          <p className="text-base font-bold" style={{ color: "#2D2D2D" }}>
            Aucun DJ ajouté 🎧
          </p>
          <p className="text-sm" style={{ color: "#2D2D2D66" }}>
            Ajoute le premier artiste !
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {djs.map((dj) => (
            <div key={dj.id}>
              {/* ── DJ card ── */}
              <div
                className="rounded-3xl p-4 shadow-sm space-y-3"
                style={{ background: "white" }}
              >
                {/* Top row: photo + info + reveal toggle */}
                <div className="flex items-center gap-3">
                  {/* Photo thumbnail */}
                  <div
                    className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ background: "#F4A7B933" }}
                  >
                    {dj.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={dj.photo}
                        alt={dj.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">🎧</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm leading-tight" style={{ color: "#2D2D2D" }}>
                      {dj.name}
                    </p>
                    {dj.alias && (
                      <p className="text-xs italic leading-tight mt-0.5" style={{ color: "#2D2D2D66" }}>
                        {dj.alias}
                      </p>
                    )}
                    {dj.style && (
                      <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: "#2D2D2D44" }}>
                        {dj.style}
                      </p>
                    )}
                  </div>

                  {/* Reveal toggle */}
                  <button
                    onClick={() => handleToggleReveal(dj)}
                    className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95"
                    style={{
                      background: dj.revealed ? "#F4A7B9" : "#2D2D2D15",
                      color: "#2D2D2D",
                    }}
                  >
                    {dj.revealed ? "Révélé 🌸" : "Caché 🔒"}
                  </button>
                </div>

                {/* Bottom row: edit + delete */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      editingId === dj.id ? setEditingId(null) : startEdit(dj)
                    }
                    className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                    style={{
                      background: editingId === dj.id ? "#C9B8E8" : "#2D2D2D11",
                      color: "#2D2D2D",
                    }}
                  >
                    ✏️ {editingId === dj.id ? "Fermer" : "Modifier"}
                  </button>

                  {confirmId === dj.id ? (
                    <div className="flex gap-1.5 ml-auto">
                      <button
                        onClick={() => handleDelete(dj.id)}
                        className="rounded-full px-3 py-1 text-xs font-bold"
                        style={{ background: "#F4A7B9", color: "#2D2D2D" }}
                      >
                        Oui, supprimer
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ background: "#2D2D2D11", color: "#2D2D2D" }}
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setConfirmId(dj.id); setEditingId(null); }}
                      className="rounded-full px-3 py-1 text-xs font-semibold ml-auto"
                      style={{ background: "#2D2D2D11", color: "#2D2D2D" }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              {/* ── Inline edit form ── */}
              {editingId === dj.id && (
                <div
                  className="rounded-3xl p-4 mt-1.5 space-y-3 shadow-sm"
                  style={{ background: "#FFF8F0", border: "1.5px solid #C9B8E8" }}
                >
                  <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "#2D2D2D66" }}>
                    Modifier le DJ
                  </p>
                  <DJFormFields form={editForm} onChange={setEditForm} />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(dj.id)}
                      disabled={saving || !editForm.name.trim()}
                      className="flex-1 rounded-full py-2.5 text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-40"
                      style={{ background: "#C9B8E8", color: "#2D2D2D" }}
                    >
                      {saving ? "Enregistrement…" : "Enregistrer"}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-full px-4 py-2.5 text-sm font-semibold"
                      style={{ background: "#2D2D2D11", color: "#2D2D2D" }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

// ── shared form fields ────────────────────────────────────────

function DJFormFields({
  form,
  onChange,
}: {
  form: DJForm;
  onChange: (f: DJForm) => void;
}) {
  const field =
    "w-full rounded-2xl border border-[#2D2D2D]/10 bg-[#FFF8F0] px-4 py-2.5 text-sm outline-none focus:border-[#F4A7B9] transition-colors";

  return (
    <>
      <input
        type="text"
        placeholder="Nom *"
        value={form.name}
        onChange={(e) => onChange({ ...form, name: e.target.value })}
        className={field}
        style={{ fontSize: 16, color: "#2D2D2D" }}
      />
      <input
        type="text"
        placeholder="Alias (ex: ou DJ D The Rock J)"
        value={form.alias}
        onChange={(e) => onChange({ ...form, alias: e.target.value })}
        className={field}
        style={{ fontSize: 16, color: "#2D2D2D" }}
      />
      <input
        type="text"
        placeholder="Style (ex: House Barbuc)"
        value={form.style}
        onChange={(e) => onChange({ ...form, style: e.target.value })}
        className={field}
        style={{ fontSize: 16, color: "#2D2D2D" }}
      />
      <input
        type="url"
        placeholder="URL photo (optionnel)"
        value={form.photo}
        onChange={(e) => onChange({ ...form, photo: e.target.value })}
        className={field}
        style={{ fontSize: 16, color: "#2D2D2D" }}
      />

      {/* Revealed toggle */}
      <button
        type="button"
        onClick={() => onChange({ ...form, revealed: !form.revealed })}
        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
        style={{
          background: form.revealed ? "#F4A7B9" : "#2D2D2D11",
          color: "#2D2D2D",
        }}
      >
        <span>{form.revealed ? "🌸 Révélé" : "🔒 Caché"}</span>
        <span
          className="ml-1 w-4 h-4 rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: "#2D2D2D66" }}
        >
          {form.revealed && (
            <span className="w-2 h-2 rounded-full" style={{ background: "#2D2D2D" }} />
          )}
        </span>
      </button>
    </>
  );
}
