import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Color = "pink" | "lavender" | "mint";

type Props = HTMLAttributes<HTMLSpanElement> & { color?: Color };

const colors: Record<Color, string> = {
  pink: "bg-pink/20 text-pink",
  lavender: "bg-lavender/20 text-lavender",
  mint: "bg-mint/20 text-mint",
};

export default function Badge({ color = "pink", className, children, ...props }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors[color],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
