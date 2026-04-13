import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Paths that require an authenticated user. Unauthenticated requests are
 * redirected to /login with a `redirect` query parameter so the user can be
 * bounced back after signing in.
 */
const PROTECTED_PREFIXES: ReadonlyArray<string> = [
  "/learner",
  "/instructor",
  "/platform",
  "/dashboard",
  "/profile",
];

/**
 * Refreshes the Supabase session on every request and enforces auth for
 * protected routes. Must be called from the root `proxy.ts` (Next.js 16+;
 * formerly `middleware.ts`).
 *
 * The `getUser()` call is load-bearing: it revalidates the token server-side
 * and, if valid, refreshes the cookie on the outgoing response.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are missing, skip auth entirely — the app still renders,
  // and protected routes fall back to the login redirect below.
  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // IMPORTANT: do NOT remove this call. `getUser()` validates the session
  // token with Supabase and triggers the cookie refresh via `setAll` above.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Iframe-embedded pages (loaded by /lms/courses/[id] etc) must NOT redirect
  // to /login inside the iframe — the host frame can't post a login there.
  // Instead the page itself renders a "로그인 필요" card with a target="_top"
  // link that breaks out of the iframe.
  const isEmbedded = request.nextUrl.searchParams.get("embedded") === "1";

  if (!user && isProtected && !isEmbedded) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
