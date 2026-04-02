export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { getClient } from "@/lib/claude"

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { text, platform_hint } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: "텍스트를 입력해주세요." }, { status: 400 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY 미설정" }, { status: 503 })
  }

  try {
    const message = await getClient().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `다음은 병원 리뷰 텍스트입니다. 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

플랫폼 힌트: ${platform_hint || "알 수 없음"}
리뷰 텍스트:
"""
${text.trim().slice(0, 1000)}
"""

응답 형식 (JSON만):
{
  "platform": "naver" | "google" | "kakao" | "manual",
  "author_name": "작성자명 (없으면 null)",
  "rating": 1~5 숫자 (별점 추론, 없으면 null),
  "content": "리뷰 본문만 추출 (작성자명, 날짜 등 메타정보 제외)",
  "review_date": "YYYY-MM-DD (날짜 추론, 없으면 null)"
}`,
        },
      ],
    })

    const raw = message.content[0].type === "text" ? message.content[0].text.trim() : ""
    const parsed = JSON.parse(raw)

    return NextResponse.json({ parsed })
  } catch (err) {
    return NextResponse.json({ error: "파싱 실패: " + String(err) }, { status: 500 })
  }
}
