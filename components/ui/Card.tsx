import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export default function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl bg-white shadow-sm p-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}
