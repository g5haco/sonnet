import { Block } from "@/components/block";

// Placeholder for pages whose phase hasn't landed yet: says what's coming, never fakes it.
export function ComingSoon({ title, phase, points }: { title: string; phase: number; points: string[] }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pt-4 pb-10 md:px-6 md:pt-6">
      <header className="mb-1">
        <h1 className="text-lg font-medium tracking-tight">{title}</h1>
        <p className="font-mono text-xs text-muted-foreground">arrives in phase {phase}</p>
      </header>
      <Block title="What's coming">
        <ul className="flex flex-col gap-2 text-sm">
          {points.map((p) => (
            <li key={p} className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
      </Block>
    </main>
  );
}
