"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getEventId } from "@/lib/constants";
import type { Announcement } from "@/lib/types";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [message,       setMessage]       = useState("");
  const [pinned,        setPinned]        = useState(false);
  const [posting,       setPosting]       = useState(false);
  const [toast,         setToast]         = useState("");
  const [confirmId,     setConfirmId]     = useState<string | null>(null);
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [editContent,   setEditContent]   = useState("");
  const [editPinned,    setEditPinned]    = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchAnnouncements() {
    const eventId = await getEventId();
    if (!eventId) return;
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .eq("event_id", eventId)
      .order("pinned",     { ascending: false })
      .order("created_at", { ascending: false });
    setAnnouncements(
      (data ?? []).map((a) => ({ ...a, reactions: a.reactions ?? {} }))
    );
    setLoading(false);
  }

  useEffect(() => { fetchAnnouncements(); }, []);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2500);
  }

  async function handlePost() {
    if (!message.trim()) return;
    setPosting(true);
    const eventId = await getEventId();
    if (!eventId) { setPosting(false); return; }

    const { error } = await supabase.from("announcements").insert({
      event_id:   eventId,
      message:    message.trim(),
      pinned,
      reactions:  {},
    });

    if (!error) {
      setMessage("");
      setPinned(false);
      showToast("Annonce postée ✓");
      await fetchAnnouncements();
    }
    setPosting(false);
  }

  async function handleTogglePin(a: Announcement) {
    await supabase
      .from("announcements")
      .update({ pinned: !a.pinned })
      .eq("id", a.id);
    await fetchAnnouncements();
  }

  function handleStartEdit(a: Announcement) {
    setEditingId(a.id);
    setEditContent(a.message);
    setEditPinned(a.pinned);
    setConfirmId(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditContent("");
    setEditPinned(false);
  }

  async function handleSaveEdit() {
    if (!editingId || !editContent.trim()) return;
    const { error } = await supabase
      .from("announcements")
      .update({ message: editContent.trim(), pinned: editPinned })
      .eq("id", editingId);
    if (!error) {
      handleCancelEdit();
      showToast("Annonce modifiée ✅");
      await fetchAnnouncements();
    }
  }

  async function handleDelete(id: string) {
    await supabase.from("announcements").delete().eq("id", id);
    setConfirmId(null);
    await fetchAnnouncements();
  }

  return (
    <div className="space-y-6">

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-sm font-bold shadow-lg"
          style={{ background: "#F4A7B9", color: "#2D2D2D" }}
        >
          {toast}
        </div>
      )}

      {/* ── New announcement form ── */}
      <div
        className="rounded-3xl p-4 shadow-sm space-y-3"
        style={{ background: "white" }}
      >
        <p className="font-bold text-sm" style={{ color: "#2D2D2D" }}>
          Nouvelle annonce
        </p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Écris ton annonce ici..."
          rows={4}
          className="w-full resize-none rounded-2xl border border-[#2D2D2D]/10 bg-[#FFF8F0] px-4 py-3 outline-none focus:border-[#F4A7B9] transition-colors"
          style={{ fontSize: 16, color: "#2D2D2D" }}
        />

        {/* Pin toggle */}
        <button
          onClick={() => setPinned((p) => !p)}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
          style={{
            background: pinned ? "#F4A7B9" : "#2D2D2D11",
            color: "#2D2D2D",
          }}
        >
          📌
          <span>Épingler cette annonce</span>
          <span
            className="ml-1 w-4 h-4 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: "#2D2D2D66" }}
          >
            {pinned && (
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: "#2D2D2D" }}
              />
            )}
          </span>
        </button>

        <button
          onClick={handlePost}
          disabled={posting || !message.trim()}
          className="w-full rounded-full py-3 text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-40"
          style={{ background: "#F4A7B9", color: "#2D2D2D" }}
        >
          {posting ? "Envoi…" : "Poster 🌸"}
        </button>
      </div>

      {/* ── Announcements list ── */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 rounded-3xl animate-pulse"
              style={{ background: "#F4A7B933" }}
            />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="py-16 text-center space-y-1">
          <p className="text-base font-bold" style={{ color: "#2D2D2D" }}>
            Aucune annonce pour l&apos;instant 🌸
          </p>
          <p className="text-sm" style={{ color: "#2D2D2D66" }}>
            Sois le premier à poster !
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="rounded-3xl p-4 shadow-sm"
              style={{
                background: "white",
                borderLeft: a.pinned ? "4px solid #F4A7B9" : undefined,
              }}
            >
              {editingId === a.id ? (
                /* ── Inline edit form ── */
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-2xl border border-[#2D2D2D]/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#F4A7B9] transition-colors"
                    style={{ color: "#2D2D2D", fontSize: 16 }}
                  />

                  {/* Pinned toggle */}
                  <button
                    type="button"
                    onClick={() => setEditPinned((p) => !p)}
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                    style={{
                      background: editPinned ? "#F4A7B9" : "#2D2D2D11",
                      color: "#2D2D2D",
                    }}
                  >
                    📌
                    <span>Épingler</span>
                    <span
                      className="ml-1 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: "#2D2D2D66" }}
                    >
                      {editPinned && (
                        <span className="w-2 h-2 rounded-full" style={{ background: "#2D2D2D" }} />
                      )}
                    </span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={!editContent.trim()}
                      className="rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
                      style={{ background: "#B8E4D8", color: "#2D2D2D" }}
                    >
                      Enregistrer ✅
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="rounded-full px-4 py-2 text-xs font-semibold transition-colors"
                      style={{ background: "#F4A7B922", color: "#2D2D2D" }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Normal view ── */
                <>
                  {/* Message preview */}
                  <p className="text-sm mb-2 leading-snug" style={{ color: "#2D2D2D" }}>
                    {a.message.length > 100
                      ? a.message.slice(0, 100) + "…"
                      : a.message}
                  </p>

                  {/* Date + actions */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs" style={{ color: "#2D2D2D66" }}>
                      {new Date(a.created_at).toLocaleDateString("fr-FR", {
                        day:    "numeric",
                        month:  "short",
                        hour:   "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    <div className="flex gap-2">
                      {/* Pin / unpin */}
                      <button
                        onClick={() => handleTogglePin(a)}
                        className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                        style={{
                          background: a.pinned ? "#F4A7B9" : "#2D2D2D11",
                          color: "#2D2D2D",
                        }}
                      >
                        📌 {a.pinned ? "Épinglée" : "Épingler"}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleStartEdit(a)}
                        className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                        style={{ background: "#2D2D2D11", color: "#2D2D2D" }}
                      >
                        ✏️
                      </button>

                      {/* Delete */}
                      {confirmId === a.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(a.id)}
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
                          onClick={() => setConfirmId(a.id)}
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          style={{ background: "#2D2D2D11", color: "#2D2D2D" }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
