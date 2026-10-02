import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { csp, CSP_HEADER, isStatic, makeNonce } from "@/lib/csp";

// Refreshes the Supabase session cookie, sends signed-out visitors to /login, and sets the CSP.
// Optimistic only (Next 16 guidance): pages re-check the user on the server.
export async function proxy(request: NextRequest) {
  const nonce = makeNonce();
  const policy = (path: string) =>
    csp({
      nonce: isStatic(path) ? undefined : nonce,
      dev: process.env.NODE_ENV === "development",
      supabase: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    });
  // Next reads the nonce from the request's CSP header and stamps it on its scripts. Rebuilt after cookie
  // refreshes so the page sees both.
  const forward = () => {
    const headers = new Headers(request.headers);
    headers.set(CSP_HEADER, policy(request.nextUrl.pathname));
    return NextResponse.next({ request: { headers } });
  };
  let response = forward();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = forward();
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const path = request.nextUrl.pathname;
  // Calendar subscriptions and Vercel Cron authenticate with secrets instead of a user session; /f/<code> is a shared deck.
  // Signed out on "/": the public landing page, under the same URL.
  if (!data?.claims && path === "/") {
    const landing = NextResponse.rewrite(new URL("/landing", request.url));
    landing.headers.set(CSP_HEADER, policy("/landing"));
    return landing;
  }
  if (!data?.claims && !["/login", "/landing", "/auth", "/api/cal", "/api/cron", "/f", "/privacy", "/terms", "/robots.txt", "/sitemap.xml", "/opengraph-image", "/icon", "/apple-icon", "/manifest.webmanifest"].some((p) => path === p || path.startsWith(`${p}/`))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  // Already signed in: skip the sign-in page (the desktop app starts here). Same getClaims check as requireUser,
  // so this can't loop. Carry any refreshed session cookies, or the rotated refresh token would be lost.
  if (data?.claims && path === "/login") {
    const home = NextResponse.redirect(new URL("/", request.url));
    response.cookies.getAll().forEach((c) => home.cookies.set(c));
    return home;
  }
  response.headers.set(CSP_HEADER, policy(path));
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
