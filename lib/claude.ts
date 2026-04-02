import Anthropic from "@anthropic-ai/sdk"
import type { Specialty, Sentiment, RiskLevel } from "./types"

// 빌드 타임 오류 방지를 위해 런타임에만 초기화
export function getClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })
}

// 비용 절감: 기본 haiku 사용. 필요 시 .env에서 CLAUDE_MODEL=claude-sonnet-4-6 으로 변경
const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001"

// 진료과별 의료광고법 금지 표현 가이드라인
const SPECIALTY_GUIDELINES: Record<string, string> = {
  피부과: `
    - 금지: 시술 효과 과대 표현 ("확실히 효과 있습니다", "100% 효과")
    - 금지: 비교 광고 ("타 병원보다 저렴", "최고 기술")
    - 금지: 구체적 가격 언급
    - 금지: 특정 시술 결과 보장`,
  성형외과: `
    - 금지: 수술 결과 보장 표현
    - 금지: 비교 광고 및 최상급 표현
    - 금지: 구체적 가격, 할인 정보
    - 금지: 전후 사진 언급`,
  치과: `
    - 금지: 임플란트 성공률 수치 ("성공률 99%")
    - 주의: 비보험 수가 직접 언급
    - 금지: 치료 기간 보장 ("1년 안에 완성 보장")
    - 금지: 최저가 보장 표현`,
  한의원: `
    - 금지: 치료 효과 단정 표현 ("완치됩니다")
    - 금지: 특정 질환 치료 보장
    - 주의: 과학적 근거 미입증 표현
    - 금지: "병원에서 못 고치는 것을" 등 비교 표현`,
  정형외과: `
    - 금지: 수술 결과 보장 ("수술 후 재발 없습니다")
    - 금지: 재발 방지 단정
    - 주의: 비급여 항목 강조
    - 금지: 완전 회복 보장 표현`,
  기타: `
    - 치료 효과 과대 표현 금지
    - 비교 광고 금지
    - 결과 보장 표현 금지
    - 구체적 가격 언급 주의`,
}

// 긴급 키워드
const URGENT_KEYWORDS = [
  "고소",
  "소송",
  "허위",
  "의료 사고",
  "의료사고",
  "언론 제보",
  "언론제보",
  "식약처",
  "의료분쟁",
  "의료분쟁조정원",
  "인스타에 올리겠다",
  "sns에 올리겠다",
  "유튜브에 올리겠다",
  "법적",
  "변호사",
  "신고",
  "고발",
  "사기",
]

export interface AnalysisResult {
  sentiment: Sentiment
  risk_level: RiskLevel
  ai_summary: string
  keywords: string[]
}

export async function analyzeReview(
  reviewContent: string,
  rating: number | undefined
): Promise<AnalysisResult> {
  // 긴급 키워드 선제 검사 (API 호출 없이 빠르게 처리)
  const contentLower = reviewContent.toLowerCase()
  const hasUrgentKeyword = URGENT_KEYWORDS.some((kw) =>
    contentLower.includes(kw.toLowerCase())
  )

  const prompt = `다음 병원 리뷰를 분석해주세요.

별점: ${rating !== undefined ? `${rating}점` : "없음"}
리뷰 내용: "${reviewContent}"

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "sentiment": "positive|neutral|negative|dispute",
  "risk_level": "none|low|caution|urgent",
  "summary": "리뷰 요약 (50자 이내)",
  "keywords": ["키워드1", "키워드2", "키워드3"]
}

분류 기준:
- sentiment: positive(4~5점, 만족), neutral(3점, 개선요구), negative(1~2점, 불만), dispute(법적위협/허위사실/SNS확산예고)
- risk_level: none(긍정), low(중립), caution(부정), urgent(분쟁소지/법적위협)
- keywords: 리뷰에서 핵심 키워드 최대 5개 (한국어)`

  const message = await getClient().messages.create({
    model: MODEL,
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== "text") {
    throw new Error("Claude API 응답 오류")
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("JSON 파싱 실패")

    const parsed = JSON.parse(jsonMatch[0])

    // 긴급 키워드가 있으면 강제 urgent로 설정
    if (hasUrgentKeyword) {
      parsed.risk_level = "urgent"
      parsed.sentiment = "dispute"
    }

    return {
      sentiment: parsed.sentiment as Sentiment,
      risk_level: parsed.risk_level as RiskLevel,
      ai_summary: parsed.summary,
      keywords: parsed.keywords || [],
    }
  } catch {
    // 파싱 실패 시 기본값 반환
    const defaultSentiment: Sentiment =
      rating !== undefined
        ? rating >= 4
          ? "positive"
          : rating === 3
            ? "neutral"
            : "negative"
        : "neutral"

    return {
      sentiment: hasUrgentKeyword ? "dispute" : defaultSentiment,
      risk_level: hasUrgentKeyword
        ? "urgent"
        : defaultSentiment === "negative"
          ? "caution"
          : defaultSentiment === "neutral"
            ? "low"
            : "none",
      ai_summary: reviewContent.slice(0, 50),
      keywords: [],
    }
  }
}

export async function generateResponse(
  reviewContent: string,
  rating: number | undefined,
  sentiment: Sentiment,
  riskLevel: RiskLevel,
  hospitalName: string,
  specialty: Specialty,
  tone: string
): Promise<string> {
  const guidelines =
    SPECIALTY_GUIDELINES[specialty] || SPECIALTY_GUIDELINES["기타"]

  const systemPrompt = `당신은 ${hospitalName} (${specialty})의 온라인 리뷰 담당자입니다.
병원을 대표하여 환자 리뷰에 답변을 작성합니다.

[병원 답변 톤 & 매너]
${tone}한 어조로 작성합니다.

[의료광고법 준수 사항 - ${specialty}]
${guidelines}

[답변 원칙]
1. 환자에 대한 진심 어린 감사 또는 사과로 시작
2. 구체적인 진료 내용, 환자 개인정보 절대 언급 금지
3. 위 금지 표현 사용 절대 금지
4. 개선 의지나 감사 표현으로 마무리
5. 150자 이내로 간결하게 작성
6. 병원명 반복 사용 금지 (답변 내 최대 1회)

${riskLevel === "urgent" ? `[긴급 주의] 이 리뷰는 법적 분쟁 소지가 있습니다. 사실 관계 확인 필요를 언급하고, 원내 상담 유도 문구를 포함하세요. 법무 검토 후 게시를 권장합니다.` : ""}`

  const userPrompt = `다음 리뷰에 대한 답변 초안을 작성해주세요.

별점: ${rating !== undefined ? `${rating}점` : "없음"}
리뷰: "${reviewContent}"
감성 분류: ${sentiment}
위험도: ${riskLevel}

답변 초안만 작성해주세요 (설명 없이).`

  const message = await getClient().messages.create({
    model: MODEL,
    max_tokens: 400,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  })

  const content = message.content[0]
  if (content.type !== "text") {
    throw new Error("Claude API 응답 오류")
  }

  return content.text.trim()
}
