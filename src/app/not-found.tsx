import Link from "next/link";

export const metadata = { title: "Not found · Sonnet" };

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm">404</p>
        <h1 className="text-2xl font-semibold">This page doesn&apos;t exist</h1>
        <Link href="/" className="text-sm link">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
