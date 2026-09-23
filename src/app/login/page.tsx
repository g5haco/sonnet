import { LoginForm } from "./form";

export default async function Login({ searchParams }: PageProps<"/login">) {
  const { expired } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <section className="w-full max-w-sm rounded-2xl bg-card p-6 md:p-8">
        <p className="font-mono text-lg font-medium tracking-tight">
          sonnet<span className="text-brand">.</span>
        </p>
        <h1 className="mt-6 text-2xl font-medium tracking-tight">Welcome back.</h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">Your deadlines missed you.</p>
        <LoginForm expired={expired === "1"} />
      </section>
    </main>
  );
}
