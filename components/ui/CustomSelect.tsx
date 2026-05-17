"use client";

import { useEffect, useRef, useState } from "react";

type Option = { value: string; label: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
};

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "— Choisir —",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between rounded-2xl border bg-white px-4 py-2.5 text-sm text-left transition-all"
        style={{
          borderColor: open ? "#F4A7B9" : "rgba(45,45,45,0.1)",
          boxShadow:   open ? "0 0 0 2px rgba(244,167,185,0.25)" : "none",
          color:       selected ? "#2D2D2D" : "rgba(45,45,45,0.3)",
        }}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 shrink-0 ml-2 transition-transform duration-200"
          style={{
            color:     "rgba(45,45,45,0.4)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute z-50 w-full mt-1 rounded-2xl overflow-hidden shadow-lg"
          style={{
            border:    "2px solid #F4A7B9",
            background: "white",
            maxHeight:  240,
            overflowY: "auto",
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors hover:bg-[#FFF0F5]"
                style={{
                  background: isSelected ? "#FFF0F5" : "transparent",
                  color:      isSelected ? "#2D2D2D" : "rgba(45,45,45,0.7)",
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 shrink-0"
                    style={{ color: "#F4A7B9" }}
                  >
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
