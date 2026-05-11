import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image
     * - favicon, apple-touch-icon
     * - api/og (open graph image generation)
     */
    "/((?!_next/static|_next/image|favicon|apple-touch-icon|api/og).*)",
  ],
};
