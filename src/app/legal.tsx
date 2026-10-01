import Link from "next/link";
import type { ReactNode } from "react";

// Shared frame for /privacy and /terms (public pages; see the proxy allowlist).
// Replace CONTACT with a monitored address before launch, and drop the draft note once a lawyer has reviewed the text.
export const CONTACT = "[contact email, to be added]";
export const UPDATED = "September 30, 2026";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
      <Link href="/" className="-my-3 inline-flex min-h-11 items-center font-mono text-lg font-medium tracking-tight">
        sonnet<span className="text-muted-foreground">.</span>
      </Link>
      <h1 className="font-heading mt-8 text-3xl text-balance sm:text-4xl">{title}</h1>
      <p className="mt-2 font-mono text-xs text-muted-foreground">Last updated {UPDATED}</p>
      <p className="mt-6 rounded-2xl bg-muted/60 p-4 text-sm text-pretty text-muted-foreground">
        Draft: this text has not been reviewed by a lawyer yet and may change before Sonnet starts charging.
      </p>
      <div className="mt-10 flex flex-col gap-10">{children}</div>
      <footer className="mt-16 flex flex-wrap gap-x-6 border-t border-border pt-6 text-sm text-muted-foreground">
        <Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-foreground">
          Privacy
        </Link>
        <Link href="/terms" className="inline-flex min-h-11 items-center hover:text-foreground">
          Terms
        </Link>
        <Link href="/login" className="inline-flex min-h-11 items-center hover:text-foreground">
          Sign in
        </Link>
      </footer>
    </main>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 text-sm/6 text-pretty text-muted-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-medium [&_strong]:text-foreground">
      <h2 className="font-heading text-lg text-foreground">{title}</h2>
      {children}
    </section>
  );
}
