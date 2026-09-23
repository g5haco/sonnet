import { cn } from "@/lib/utils";

// Radius rule: blocks rounded-2xl, controls rounded-full, list rows rounded-lg.
export function Block({
  title,
  aside,
  className,
  children,
}: {
  title?: string;
  aside?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className={cn("flex flex-col rounded-2xl bg-card p-5 md:p-6", className)}>
      {title && (
        <header className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
          {aside && <div className="font-mono text-xs text-muted-foreground">{aside}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
