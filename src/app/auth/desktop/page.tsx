import type { Metadata } from "next";
import { desktopLink } from "@/lib/desktop/auth-link";
import { Bounce } from "./bounce";

export const metadata: Metadata = { title: "Sonnet · Sign in", robots: { index: false } };

// Where an emailed sign-in link lands when the request came from the desktop app. The browser can't finish the
// sign-in (its code belongs to the app), so this page passes it back to the app and says what to do if that fails.
export default async function DesktopSignIn({ searchParams }: PageProps<"/auth/desktop">) {
  const link = desktopLink(await searchParams);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="font-heading text-xl">{link ? "Opening Sonnet…" : "That link expired or was already used."}</p>
      <p className="max-w-sm text-sm text-pretty text-muted-foreground">
        {link
          ? "If nothing happens, open this link on the computer where Sonnet is installed, with the app running."
          : "Go back to the Sonnet app and ask for a fresh link."}
      </p>
      {link && <Bounce link={link} />}
    </main>
  );
}
