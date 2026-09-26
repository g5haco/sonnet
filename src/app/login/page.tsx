import type { Metadata } from "next";
import { LoginForm } from "./form";

export const metadata: Metadata = {
  title: "Sonnet · Your courses, deadlines and grades in one place",
  alternates: { canonical: "/login" },
};

// What Sonnet does, said plainly: no fake stats or testimonials.
const POINTS = [
  ["Every deadline", "Canvas syncs in, so nothing's due that you don't know about."],
  ["How caught up you are", "One honest number for the week, and what to do next."],
  ["An assistant that knows your classes", "It reads your syllabus and plans your week. Nothing saves without a yes."],
];

// Structured data for search engines: what the app is, nothing invented.
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Sonnet",
  url: "https://www.ericwei.me",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  description: "A student hub: courses, deadlines, calendar, grades, a focus timer and an AI assistant in one place.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default async function Login({ searchParams }: PageProps<"/login">) {
  const { expired, google, mode } = await searchParams;
  const up = mode === "signup";
  const note =
    expired === "1"
      ? "That link expired or was already used. Get a fresh one."
      : google === "0"
        ? "Google sign-in isn't available right now. Use your email instead."
        : null;

  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden p-4">
      {/* Backdrop: a blurred, dimmed meadow at dusk (generated). Decorative only. */}
      <div
        aria-hidden="true"
        className="absolute -inset-10 -z-10 scale-105 bg-[url(/login/meadow.webp)] bg-cover bg-center blur-sm brightness-[0.6]"
      />
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-card shadow-2xl md:grid-cols-2">
        {/* The pitch: hidden on phones, where the form is the whole page. Always the dark theme, since it sits on a
            dark abstract backdrop (generated). */}
        <section className="dark hidden flex-col justify-between gap-12 bg-[url(/login/abstract.webp)] bg-cover bg-center p-10 text-foreground md:flex">
          <header className="font-mono text-lg font-medium tracking-tight">
            sonnet<span className="text-foreground">.</span>
          </header>
          <div>
            <p className="text-3xl font-medium tracking-tight text-balance">All your classes, one calm place.</p>
            <ul className="mt-8 flex flex-col gap-5">
              {POINTS.map(([title, text]) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground" aria-hidden="true" />
                  <span className="text-sm">
                    <span className="font-medium">{title}.</span>{" "}
                    <span className="text-muted-foreground">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="p-6 md:p-10">
          <p className="font-mono text-lg font-medium tracking-tight md:hidden">
            sonnet<span className="text-brand">.</span>
          </p>
          <h1 className="mt-6 text-2xl font-medium tracking-tight md:mt-0">{up ? "Make it yours." : "Welcome back."}</h1>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">
            {up ? "Free. Bring your classes, we'll bring the order." : "Your deadlines missed you."}
          </p>
          <LoginForm key={up ? "up" : "in"} mode={up ? "up" : "in"} note={note} />
        </section>
      </div>
      <footer className="mt-6 text-center text-xs text-white/70">
        Sonnet is a free student hub: Canvas deadlines, your calendar, grades and an assistant that knows your
        courses.
      </footer>
      {/* JSON-LD, static and ours: safe to inline. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
    </main>
  );
}
