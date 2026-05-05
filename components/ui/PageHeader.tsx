import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  className?: string;
};

export default function PageHeader({ title, subtitle, className }: Props) {
  return (
    <header className={cn("px-5 pt-8 pb-4", className)}>
      <p className="flex items-center justify-center gap-2 mb-3 select-none">
        <span className="text-2xl leading-none">🌸</span>
        <span className="inline-block italic -skew-x-3 text-3xl font-black tracking-tighter text-charcoal leading-none">
          Lolapabouillet
        </span>
      </p>
      <h1 className="text-center text-2xl font-bold tracking-tight text-charcoal">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-center text-sm text-charcoal/50 font-medium">
          {subtitle}
        </p>
      )}
    </header>
  );
}
