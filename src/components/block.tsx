import { cn } from "@/lib/utils";

export function Block({
  title,
  className,
  children,
}: {
  title?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-xl bg-card p-5", className)}>
      {title && <h2 className="mb-3 text-sm text-muted-foreground">{title}</h2>}
      {children}
    </section>
  );
}
