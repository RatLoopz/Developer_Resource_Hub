import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  // 1. Bypass proxy for Telegram Webhook
  // API routes handles its own auth via secret tokens
  if (request.nextUrl.pathname.startsWith("/api/telegram/webhook")) {
    return NextResponse.next()
  }

  // 2. Handle session update for everything else
  return await updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)"],
}
