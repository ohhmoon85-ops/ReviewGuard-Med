export type Specialty =
  | "피부과"
  | "성형외과"
  | "치과"
  | "한의원"
  | "정형외과"
  | "재활의학과"
  | "이비인후과"
  | "산부인과"
  | "안과"
  | "기타"

export type Platform = "naver" | "google" | "kakao" | "manual"

export type Sentiment = "positive" | "neutral" | "negative" | "dispute"

export type RiskLevel = "none" | "low" | "caution" | "urgent"

export interface Hospital {
  id: string
  owner_id: string
  name: string
  specialty: Specialty
  naver_place_id?: string
  google_place_id?: string
  kakao_place_id?: string
  notification_email?: string
  tone: string
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  hospital_id: string
  platform: Platform
  external_id?: string
  author_name?: string
  rating?: number
  content: string
  sentiment?: Sentiment
  risk_level?: RiskLevel
  ai_summary?: string
  keywords?: string[]
  is_responded: boolean
  is_notified: boolean
  review_date?: string
  detected_at: string
  created_at: string
}

export interface Response {
  id: string
  review_id: string
  draft_content: string
  final_content?: string
  published_at?: string
  published_by?: string
  platform_response_id?: string
  created_at: string
}

export interface ReviewWithResponse extends Review {
  responses?: Response[]
}

export interface DashboardStats {
  total_reviews: number
  positive_count: number
  neutral_count: number
  negative_count: number
  dispute_count: number
  unanswered_count: number
  urgent_count: number
  avg_rating: number
  response_rate: number
}

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  none: "없음",
  low: "낮음",
  caution: "주의",
  urgent: "긴급",
}

export const SENTIMENT_LABELS: Record<Sentiment, string> = {
  positive: "긍정",
  neutral: "중립",
  negative: "부정",
  dispute: "분쟁소지",
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  naver: "네이버",
  google: "구글",
  kakao: "카카오",
  manual: "직접입력",
}

export const SPECIALTY_LIST: Specialty[] = [
  "피부과",
  "성형외과",
  "치과",
  "한의원",
  "정형외과",
  "재활의학과",
  "이비인후과",
  "산부인과",
  "안과",
  "기타",
]
