export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { searchGooglePlace } from "@/lib/google-places"
import { createClient } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
  // 로그인 검증
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const q = req.nextUrl.searchParams.get("q")
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [] })
  }

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY 미설정", results: [] }, { status: 503 })
  }

  const results = await searchGooglePlace(q.trim())
  return NextResponse.json({ results })
}
