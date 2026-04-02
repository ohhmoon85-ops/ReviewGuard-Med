import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase-server"
import { analyzeReview } from "@/lib/claude"
import { sendNegativeReviewAlert } from "@/lib/email"

// Vercel Cron Job - 30분마다 실행 (vercel.json 설정)
// Google Places API로 리뷰 수집 (구글 계정 연동 시)
export async function GET(req: NextRequest) {
  // Cron 보안 검증
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Google Place ID가 등록된 병원 목록 조회
  const { data: hospitals } = await supabase
    .from("hospitals")
    .select("*")
    .not("google_place_id", "is", null)

  if (!hospitals || hospitals.length === 0) {
    return NextResponse.json({ message: "수집할 병원 없음", collected: 0 })
  }

  let totalCollected = 0

  for (const hospital of hospitals) {
    try {
      const collected = await collectGoogleReviews(hospital, supabase)
      totalCollected += collected
    } catch (err) {
      console.error(`병원 ${hospital.name} 리뷰 수집 실패:`, err)
    }
  }

  return NextResponse.json({
    message: `리뷰 수집 완료`,
    collected: totalCollected,
    hospitals: hospitals.length,
  })
}

async function collectGoogleReviews(
  hospital: any,
  supabase: any
): Promise<number> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return 0

  // Google Places API v1 (New) - 리뷰 조회
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${hospital.google_place_id}&fields=reviews,rating&key=${apiKey}&language=ko`

  const res = await fetch(url)
  const data = await res.json()

  if (data.status !== "OK" || !data.result?.reviews) return 0

  const reviews = data.result.reviews
  let collected = 0

  for (const review of reviews) {
    const externalId = `google_${hospital.google_place_id}_${review.time}`

    // 중복 체크
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("external_id", externalId)
      .single()

    if (existing) continue

    // 새 리뷰 분석
    let analysisResult
    try {
      analysisResult = await analyzeReview(review.text, review.rating)
    } catch {
      analysisResult = {
        sentiment: review.rating >= 4 ? "positive" : review.rating <= 2 ? "negative" : "neutral",
        risk_level: review.rating <= 2 ? "caution" : "none",
        ai_summary: review.text?.slice(0, 50) || "",
        keywords: [],
      }
    }

    // DB 저장
    const { data: newReview, error } = await supabase
      .from("reviews")
      .insert({
        hospital_id: hospital.id,
        platform: "google",
        external_id: externalId,
        author_name: review.author_name,
        rating: review.rating,
        content: review.text || "(텍스트 없음)",
        review_date: new Date(review.time * 1000).toISOString(),
        ...analysisResult,
      })
      .select()
      .single()

    if (!error && newReview) {
      collected++

      // 부정/긴급 알림
      if (
        (analysisResult.sentiment === "negative" || analysisResult.risk_level === "urgent") &&
        hospital.notification_email
      ) {
        try {
          await sendNegativeReviewAlert(newReview, hospital)
          await supabase
            .from("reviews")
            .update({ is_notified: true })
            .eq("id", newReview.id)
        } catch (err) {
          console.error("알림 발송 실패:", err)
        }
      }
    }
  }

  return collected
}
