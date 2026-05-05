import { cn } from "@/lib/utils";

type Status = "full" | "free" | "coming-soon";

type Props = {
  status: Status;
  className?: string;
};

const config: Record<Status, { label: string; styles: string }> = {
  "full":        { label: "Full",        styles: "bg-pink/25 text-pink border-pink/30" },
  "free":        { label: "Free spots",  styles: "bg-mint/30 text-[#3a8c78] border-mint/40" },
  "coming-soon": { label: "Coming soon", styles: "bg-yellow/50 text-[#8a6d00] border-yellow/60" },
};

export default function FlowerBadge({ status, className }: Props) {
  const { label, styles } = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        styles,
        className
      )}
    >
      🌸 {label}
    </span>
  );
}
