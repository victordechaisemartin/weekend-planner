import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export default function FlowerDivider({ className }: Props) {
  return (
    <div className={cn("flex items-center gap-3 my-4", className)}>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink/40 to-pink/40" />
      <span className="text-base leading-none select-none" aria-hidden>🌸</span>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-pink/40 to-pink/40" />
    </div>
  );
}
