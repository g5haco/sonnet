// The sonnet://auth/callback link /auth/desktop hands to the app. Same rules as the app's own check
// (src-tauri/src/auth.rs): one PKCE `code`. A `token_hash` is deliberately not handed over, since it would sign
// in whoever made it. Anything else makes no link.
const TOKEN = /^[A-Za-z0-9_-]{1,512}$/;

type Params = Record<string, string | string[] | undefined>;

export function desktopLink(params: Params): string | null {
  const one = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : null);
  const code = one("code");
  return code && TOKEN.test(code) ? `sonnet://auth/callback?code=${code}` : null;
}
