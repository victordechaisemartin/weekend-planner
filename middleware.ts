import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  const isAuthPage  = req.nextUrl.pathname.startsWith("/auth");
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin");

  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/announcements", req.url));
  }

  // /admin routes pass through here for authenticated users.
  // Non-admins hitting /admin are redirected by app/admin/layout.tsx.
  void isAdminPage;

  return res;
}

export const config = {
  // Exclude _next internals, favicon, and any file with an extension
  // (images, manifest.json, fonts, etc.) so static assets in /public
  // are always served without an auth check.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|json|woff|woff2|ttf|otf)$).*)"],
};
