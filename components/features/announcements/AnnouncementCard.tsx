"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Announcement } from "@/lib/types";
import { cn } from "@/lib/utils";

type Variant = "pinned" | "lavender" | "mint";

type Props = {
  announcement: Announcement;
  variant: Variant;
};

const EMOJIS = ["🌸", "🎉", "❤️", "🌼"] as const;

const cardStyles: Record<Variant, string> = {
  pinned:   "bg-pink border-pink/50",
  lavender: "bg-lavender/30 border-lavender/40",
  mint:     "bg-mint/30 border-mint/40",
};

function isAllCaps(line: string): boolean {
  const t = line.trim();
  return t.length > 0 && /[A-Z]/.test(t) && !/[a-z]/.test(t);
}

function startsWithEmoji(line: string): boolean {
  const cp = line.trim().codePointAt(0) ?? 0;
  return cp > 127;
}

function splitEmojiLine(line: string): [string, string] {
  const m = line.match(/^(\S+)\s+(.*)/);
  return m ? [m[1], m[2]] : [line, ""];
}

function renderMessageLine(line: string, i: number) {
  if (line.trim() === "") {
    return <div key={i} className="mb-3" />;
  }
  if (isAllCaps(line)) {
    return (
      <p key={i} className="font-extrabold text-base mb-1 text-charcoal">
        {line}
      </p>
    );
  }
  if (startsWithEmoji(line)) {
    const [emoji, text] = splitEmojiLine(line);
    return (
      <p key={i} className="flex items-start gap-1 mb-1 text-sm text-charcoal/90">
        <span>{emoji}</span>
        <span>{text}</span>
      </p>
    );
  }
  return (
    <p key={i} className="text-sm leading-relaxed mb-1 text-charcoal/90">
      {line}
    </p>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day:    "numeric",
    month:  "short",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

export default function AnnouncementCard({ announcement, variant }: Props) {
  const [reactions, setReactions] = useState<Record<string, number>>(
    announcement.reactions ?? {}
  );
  const [busy, setBusy] = useState(false);

  async function react(emoji: string) {
    if (busy) return;
    setBusy(true);

    const next = { ...reactions, [emoji]: (reactions[emoji] ?? 0) + 1 };
    setReactions(next); // optimistic

    await supabase
      .from("announcements")
      .update({ reactions: next })
      .eq("id", announcement.id);

    setBusy(false);
  }

  return (
    <article className={cn("relative rounded-3xl border p-5 space-y-3", cardStyles[variant])}>
      {variant === "pinned" && (
        <span className="absolute top-4 right-4 text-lg leading-none select-none" aria-label="Pinned">
          📌
        </span>
      )}

      <div>
        {announcement.message.split("\n").map((line, i) => renderMessageLine(line, i))}
      </div>

      <p className="text-[11px] text-charcoal/40 font-medium">
        {formatDate(announcement.created_at)}
      </p>

      {/* Reaction bar */}
      <div className="flex flex-wrap gap-2 pt-1">
        {EMOJIS.map((emoji) => {
          const count = reactions[emoji] ?? 0;
          return (
            <button
              key={emoji}
              onClick={() => react(emoji)}
              disabled={busy}
              aria-label={`React with ${emoji}`}
              className={cn(
                "flex items-center gap-1 rounded-full border border-white/70 bg-white/60 px-2.5 py-1",
                "text-xs font-semibold text-charcoal/70 transition-all duration-100",
                "hover:scale-110 hover:bg-white hover:shadow-sm active:scale-95",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              <span>{emoji}</span>
              {count > 0 && <span className="text-charcoal/55">{count}</span>}
            </button>
          );
        })}
      </div>
    </article>
  );
}
