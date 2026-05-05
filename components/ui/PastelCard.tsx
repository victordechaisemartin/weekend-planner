import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = HTMLAttributes<HTMLDivElement> & {
  noPadding?: boolean;
};

export default function PastelCard({ noPadding = false, className, children, ...props }: Props) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-cream",
        "shadow-[0_2px_16px_0_rgba(45,45,45,0.07)]",
        "border border-white/60",
        !noPadding && "p-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
