import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "pink" | "lavender" | "mint";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

const variants: Record<Variant, string> = {
  pink:     "bg-pink text-white shadow-[0_4px_14px_0_rgba(244,167,185,0.45)] hover:brightness-105 active:brightness-95",
  lavender: "bg-lavender text-charcoal shadow-[0_4px_14px_0_rgba(201,184,232,0.45)] hover:brightness-105 active:brightness-95",
  mint:     "bg-mint text-charcoal shadow-[0_4px_14px_0_rgba(184,228,216,0.45)] hover:brightness-105 active:brightness-95",
};

export default function PastelButton({
  variant = "pink",
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}: Props) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2",
        "rounded-full px-6 py-2.5 text-sm font-semibold tracking-wide",
        "transition-all duration-150 ease-in-out",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:brightness-100",
        fullWidth && "w-full",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
