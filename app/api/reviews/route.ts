import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { analyzeReview } from "@/lib/claude"
import { sendNegativeReviewAlert } from "@/lib/email"

// 리뷰 목록 조회
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const hospitalId = searchParams.get("hospital_id")
  const sentiment = searchParams.get("sentiment")
  const riskLevel = searchParams.get("risk_level")
  const isResponded = searchParams.get("is_responded")
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const offset = (page - 1) * limit

  let query = supabase
    .from("reviews")
    .select(`
      *,
      responses(id, draft_content, final_content, published_at, created_at),
      hospitals!inner(id, name, specialty, owner_id)
    `, { count: "exact" })
    .eq("hospitals.owner_id", user.id)
    .order("detected_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (hospitalId) query = query.eq("hospital_id", hospitalId)
  if (sentiment) query = query.eq("sentiment", sentiment)
  if (riskLevel) query = query.eq("risk_level", riskLevel)
  if (isResponded !== null) query = query.eq("is_responded", isResponded === "true")

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, count, page, limit })
}

// 리뷰 수동 입력 + AI 분석
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { hospital_id, platform, author_name, rating, content, review_date } = body

  if (!hospital_id || !content) {
    return NextResponse.json({ error: "hospital_id, content는 필수입니다" }, { status: 400 })
  }

  // 병원 소유권 확인
  const { data: hospital } = await supabase
    .from("hospitals")
    .select("*")
    .eq("id", hospital_id)
    .eq("owner_id", user.id)
    .single()

  if (!hospital) {
    return NextResponse.json({ error: "병원을 찾을 수 없습니다" }, { status: 404 })
  }

  // Claude API로 분석
  let analysisResult
  try {
    analysisResult = await analyzeReview(content, rating)
  } catch (err) {
    console.error("Claude 분석 실패:", err)
    analysisResult = {
      sentiment: rating >= 4 ? "positive" : rating <= 2 ? "negative" : "neutral",
      risk_level: rating <= 2 ? "caution" : "none",
      ai_summary: content.slice(0, 50),
      keywords: [],
    }
  }

  // DB 저장
  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      hospital_id,
      platform: platform || "manual",
      author_name,
      rating,
      content,
      review_date: review_date || new Date().toISOString(),
      ...analysisResult,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 부정/긴급 리뷰 이메일 알림
  if (
    (analysisResult.sentiment === "negative" || analysisResult.risk_level === "urgent") &&
    hospital.notification_email
  ) {
    try {
      await sendNegativeReviewAlert(review, hospital)
    } catch (err) {
      console.error("이메일 알림 실패:", err)
    }
  }

  return NextResponse.json({ data: review })
}
