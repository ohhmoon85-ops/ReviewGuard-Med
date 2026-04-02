import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"
import { generateResponse } from "@/lib/claude"

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { review_id } = await req.json()
  if (!review_id) {
    return NextResponse.json({ error: "review_id는 필수입니다" }, { status: 400 })
  }

  // 리뷰 + 병원 정보 조회
  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .select(`
      *,
      hospitals!inner(id, name, specialty, tone, owner_id)
    `)
    .eq("id", review_id)
    .single()

  if (reviewError || !review) {
    return NextResponse.json({ error: "리뷰를 찾을 수 없습니다" }, { status: 404 })
  }

  const hospital = (review as any).hospitals
  if (hospital.owner_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 })
  }

  // 분석 결과가 없으면 기본값 사용
  const sentiment = review.sentiment || "neutral"
  const riskLevel = review.risk_level || "low"

  // Claude로 답변 초안 생성
  let draftContent: string
  try {
    draftContent = await generateResponse(
      review.content,
      review.rating,
      sentiment,
      riskLevel,
      hospital.name,
      hospital.specialty,
      hospital.tone || "전문적이고 친근한"
    )
  } catch (err) {
    console.error("Claude 답변 생성 실패:", err)
    return NextResponse.json({ error: "AI 답변 생성 중 오류가 발생했습니다" }, { status: 500 })
  }

  // 기존 초안이 있으면 업데이트, 없으면 새로 생성
  const { data: existingResponse } = await supabase
    .from("responses")
    .select("id")
    .eq("review_id", review_id)
    .is("published_at", null)
    .single()

  let responseData
  if (existingResponse) {
    const { data } = await supabase
      .from("responses")
      .update({ draft_content: draftContent })
      .eq("id", existingResponse.id)
      .select()
      .single()
    responseData = data
  } else {
    const { data } = await supabase
      .from("responses")
      .insert({ review_id, draft_content: draftContent })
      .select()
      .single()
    responseData = data
  }

  return NextResponse.json({ data: responseData })
}

// 답변 게시 (최종 저장)
export async function PUT(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { response_id, final_content } = await req.json()
  if (!response_id || !final_content) {
    return NextResponse.json({ error: "response_id, final_content는 필수입니다" }, { status: 400 })
  }

  const { data: response, error: fetchError } = await supabase
    .from("responses")
    .select(`
      *,
      reviews!inner(
        id, hospital_id,
        hospitals!inner(owner_id)
      )
    `)
    .eq("id", response_id)
    .single()

  if (fetchError || !response) {
    return NextResponse.json({ error: "답변을 찾을 수 없습니다" }, { status: 404 })
  }

  const hospital = (response as any).reviews?.hospitals
  if (hospital?.owner_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 })
  }

  // 답변 게시 처리
  const { data, error } = await supabase
    .from("responses")
    .update({
      final_content,
      published_at: new Date().toISOString(),
      published_by: user.id,
    })
    .eq("id", response_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 리뷰 is_responded 업데이트
  const reviewId = (response as any).reviews?.id
  await supabase
    .from("reviews")
    .update({ is_responded: true })
    .eq("id", reviewId)

  return NextResponse.json({ data })
}
