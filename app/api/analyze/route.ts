import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { analyzeReview } from "@/lib/claude"

// 기존 리뷰 재분석
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { review_id } = await req.json()

  const { data: review, error } = await supabase
    .from("reviews")
    .select(`*, hospitals!inner(owner_id)`)
    .eq("id", review_id)
    .single()

  if (error || !review) {
    return NextResponse.json({ error: "리뷰를 찾을 수 없습니다" }, { status: 404 })
  }

  const hospital = (review as any).hospitals
  if (hospital.owner_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 })
  }

  const analysisResult = await analyzeReview(review.content, review.rating)

  const { data, error: updateError } = await supabase
    .from("reviews")
    .update(analysisResult)
    .eq("id", review_id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ data })
}
