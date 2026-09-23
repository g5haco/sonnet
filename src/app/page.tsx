import { Block } from "@/components/block";

export default function Dashboard() {
  return (
    <main className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <div className="mb-3 rounded-full bg-secondary px-5 py-3 text-muted-foreground">
        Ask anything…
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Block title="Progress" className="min-h-48 md:col-span-2" />
        <Block title="Next exam" className="min-h-48" />
        <Block title="Up next" className="min-h-64 md:col-span-2" />
        <Block title="Focus" className="min-h-64" />
        <Block title="Study days" className="min-h-40 md:col-span-2" />
        <Block title="Grades" className="min-h-40" />
      </div>
    </main>
  );
}
