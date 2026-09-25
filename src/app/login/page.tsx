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
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-card md:grid-cols-2">
        {/* The pitch: hidden on phones, where the form is the whole page. */}
        <section className="hidden flex-col justify-between gap-12 bg-secondary/50 p-10 md:flex">
          <p className="font-mono text-lg font-medium tracking-tight">
            sonnet<span className="text-brand">.</span>
          </p>
          <div>
            <h2 className="text-3xl font-medium tracking-tight text-balance">All your classes, one calm place.</h2>
            <ul className="mt-8 flex flex-col gap-5">
              {POINTS.map(([title, text]) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
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
    </main>
  );
}
