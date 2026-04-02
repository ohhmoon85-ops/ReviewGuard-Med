"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Shield, Star, MessageSquare, AlertTriangle, CheckCircle,
  Bot, RefreshCw, Send, X, Plus, Sparkles, ArrowRight,
  LayoutDashboard, ListChecks, FlaskConical, ClipboardPaste, PenLine
} from "lucide-react"

// ─── 목업 데이터 ───────────────────────────────────────────────────────────────
const MOCK_REVIEWS = [
  {
    id: "1",
    platform: "naver",
    author_name: "김**",
    rating: 5,
    content: "원장님이 너무 친절하시고 설명을 자세히 해주셔서 좋았습니다. 대기 시간도 짧고 시설도 깨끗해요. 다음에 또 방문할게요!",
    sentiment: "positive" as const,
    risk_level: "none" as const,
    ai_summary: "친절한 원장님, 짧은 대기시간, 청결한 시설에 대한 높은 만족도",
    keywords: ["친절", "설명", "대기시간", "청결"],
    is_responded: true,
    detected_at: "2026-04-01T09:00:00Z",
    mock_response: "안녕하세요, 이춘봉성형외과입니다. 소중한 후기 감사드립니다. 앞으로도 최선을 다해 진료하겠습니다. 다음 방문 때도 편안한 진료 경험이 될 수 있도록 노력하겠습니다. 감사합니다.",
  },
  {
    id: "2",
    platform: "google",
    author_name: "이**",
    rating: 2,
    content: "대기시간이 너무 길었어요. 예약을 했는데도 1시간 넘게 기다렸습니다. 직원 분들도 불친절하고 다시는 오고 싶지 않네요.",
    sentiment: "negative" as const,
    risk_level: "caution" as const,
    ai_summary: "예약 후 긴 대기시간(1시간+)과 직원 불친절에 대한 불만",
    keywords: ["대기시간", "예약", "불친절", "불만"],
    is_responded: false,
    detected_at: "2026-04-01T11:30:00Z",
    mock_response: "안녕하세요, 이춘봉성형외과입니다. 불편을 드려 진심으로 사과드립니다. 말씀해 주신 대기시간 문제를 인지하고 즉시 개선 방안을 마련하겠습니다. 더 나은 서비스로 보답할 수 있도록 최선을 다하겠습니다.",
  },
  {
    id: "3",
    platform: "naver",
    author_name: "박**",
    rating: 1,
    content: "수술 후 부작용이 생겼는데 병원 측에서 아무런 조치를 취하지 않았습니다. 의료분쟁조정원에 신고하겠습니다. 이 사실을 SNS에 올리겠습니다.",
    sentiment: "dispute" as const,
    risk_level: "urgent" as const,
    ai_summary: "수술 후 부작용 미조치, 의료분쟁조정원 신고 예고 및 SNS 확산 위협",
    keywords: ["부작용", "의료분쟁", "SNS", "신고"],
    is_responded: false,
    detected_at: "2026-04-01T14:00:00Z",
    mock_response: "안녕하세요, 이춘봉성형외과입니다. 불편을 겪으셨다니 진심으로 사과드립니다. 해당 사항에 대해 신속히 확인하겠습니다. 원내에서 직접 상담을 통해 문제를 해결할 수 있도록 도와드리겠습니다. 연락처 남겨 주시면 담당자가 바로 연락드리겠습니다. ※ 본 답변은 법무 검토 후 최종 게시를 권장합니다.",
  },
  {
    id: "4",
    platform: "kakao",
    author_name: "최**",
    rating: 3,
    content: "시술 결과 자체는 만족스러운데 사후 관리 안내가 부족했습니다. 주의사항을 더 자세히 설명해 주셨으면 좋겠어요.",
    sentiment: "neutral" as const,
    risk_level: "low" as const,
    ai_summary: "시술 결과 만족, 사후관리 안내 부족에 대한 개선 요구",
    keywords: ["시술", "사후관리", "안내", "개선"],
    is_responded: false,
    detected_at: "2026-03-31T16:00:00Z",
    mock_response: "안녕하세요, 이춘봉성형외과입니다. 소중한 의견 감사드립니다. 사후 관리 안내가 충분하지 않았던 점 개선하겠습니다. 궁금한 점이 있으시면 언제든지 문의해 주세요.",
  },
]

const MOCK_STATS = {
  avg_rating: 4.2,
  total: 24,
  positive: 14,
  neutral: 5,
  negative: 4,
  dispute: 1,
  unanswered: 8,
  response_rate: 67,
}

const RISK_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-800 border-red-200",
  caution: "bg-orange-100 text-orange-800 border-orange-200",
  low: "bg-yellow-100 text-yellow-800 border-yellow-200",
  none: "bg-gray-100 text-gray-700 border-gray-200",
}
const RISK_ICONS: Record<string, string> = { urgent: "🚨", caution: "⚠️", low: "ℹ️", none: "✅" }
const RISK_LABELS: Record<string, string> = { urgent: "긴급", caution: "주의", low: "낮음", none: "없음" }
const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-green-100 text-green-800",
  neutral: "bg-yellow-100 text-yellow-800",
  negative: "bg-orange-100 text-orange-800",
  dispute: "bg-red-100 text-red-800",
}
const SENTIMENT_LABELS: Record<string, string> = { positive: "긍정", neutral: "중립", negative: "부정", dispute: "분쟁소지" }
const PLATFORM_LABELS: Record<string, string> = { naver: "네이버", google: "구글", kakao: "카카오", manual: "직접입력" }

// ─── 리뷰 분석 시뮬레이터 ─────────────────────────────────────────────────────
function analyzeReview(content: string, rating: number) {
  const urgent = ["고소", "소송", "의료분쟁", "신고", "언론", "sns", "snS", "SNS", "인스타", "유튜브", "허위", "사기"]
  const negative = ["불친절", "최악", "별로", "실망", "화가", "짜증", "불만", "다시는", "후회", "불쾌"]

  if (urgent.some((k) => content.includes(k))) {
    return { sentiment: "dispute", risk_level: "urgent", summary: "법적 위협 또는 SNS 확산 예고가 포함된 긴급 리뷰", keywords: ["긴급대응필요"] }
  }
  if (rating <= 2 || negative.some((k) => content.includes(k))) {
    return { sentiment: "negative", risk_level: "caution", summary: "불만족 경험에 대한 부정 리뷰, 빠른 대응 필요", keywords: ["불만", "개선필요"] }
  }
  if (rating === 3) {
    return { sentiment: "neutral", risk_level: "low", summary: "부분적 만족과 개선 요구가 포함된 중립 리뷰", keywords: ["개선요구", "보통"] }
  }
  return { sentiment: "positive", risk_level: "none", summary: "전반적으로 만족스러운 경험에 대한 긍정 리뷰", keywords: ["만족", "친절", "추천"] }
}

// ─── 답변 생성 시뮬레이터 ─────────────────────────────────────────────────────
function generateResponse(content: string, sentiment: string, riskLevel: string) {
  if (riskLevel === "urgent") {
    return "안녕하세요, 이춘봉성형외과입니다. 불편을 겪으셨다니 진심으로 사과드립니다. 해당 사항을 신속히 확인하겠습니다. 직접 상담을 통해 문제를 해결할 수 있도록 연락 부탁드립니다. 병원 대표번호로 연락 주시면 담당자가 바로 도움을 드리겠습니다.\n※ 이 답변은 법무 검토 후 최종 게시를 권장합니다."
  }
  if (sentiment === "negative") {
    return "안녕하세요, 이춘봉성형외과입니다. 기대에 미치지 못한 경험을 드려 진심으로 사과드립니다. 말씀해 주신 내용을 바탕으로 즉시 개선 방안을 마련하겠습니다. 불편하신 점이 있으시면 언제든지 말씀해 주세요. 더 나은 서비스로 보답하겠습니다. 감사합니다."
  }
  if (sentiment === "neutral") {
    return "안녕하세요, 이춘봉성형외과입니다. 소중한 의견 주셔서 감사드립니다. 말씀해 주신 부분을 적극적으로 반영하여 더 나은 서비스를 제공할 수 있도록 노력하겠습니다. 앞으로도 많은 관심 부탁드립니다. 감사합니다."
  }
  return "안녕하세요, 이춘봉성형외과입니다. 따뜻한 후기 남겨 주셔서 진심으로 감사드립니다. 앞으로도 항상 최선을 다해 진료하겠습니다. 다음 방문 때도 편안한 경험이 될 수 있도록 노력하겠습니다. 감사합니다."
}

type Tab = "dashboard" | "reviews" | "add"

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function DemoClient() {
  const [reviews, setReviews] = useState(MOCK_REVIEWS)
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const [selectedReview, setSelectedReview] = useState<typeof MOCK_REVIEWS[0] | null>(null)
  const [showResponse, setShowResponse] = useState(false)
  const [generatingResponse, setGeneratingResponse] = useState(false)
  const [responseText, setResponseText] = useState("")
  const [published, setPublished] = useState(false)

  const [addMode, setAddMode] = useState<"paste" | "manual">("paste")
  const [addPlatform, setAddPlatform] = useState("naver")
  const [addRating, setAddRating] = useState(3)
  const [addAuthor, setAddAuthor] = useState("")
  const [addContent, setAddContent] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzedReview, setAnalyzedReview] = useState<any>(null)

  // 스마트 붙여넣기 상태
  const [pasteText, setPasteText] = useState("")
  const [parsing, setParsing] = useState(false)
  const [parsedResult, setParsedResult] = useState<any>(null)

  function handleOpenResponse(review: typeof MOCK_REVIEWS[0]) {
    setSelectedReview(review)
    setShowResponse(true)
    setPublished(false)
    setGeneratingResponse(true)
    setResponseText("")
    setTimeout(() => {
      setResponseText(review.mock_response)
      setGeneratingResponse(false)
    }, 1800)
  }

  function handlePublish() {
    setPublished(true)
    setReviews((prev) =>
      prev.map((r) => r.id === selectedReview?.id ? { ...r, is_responded: true } : r)
    )
    setTimeout(() => setShowResponse(false), 1200)
  }

  function handleAnalyze() {
    if (!addContent.trim()) return
    setAnalyzing(true)
    setAnalyzedReview(null)
    setTimeout(() => {
      const result = analyzeReview(addContent, addRating)
      setAnalyzedReview(result)
      setAnalyzing(false)
    }, 1500)
  }

  function handleAddReview() {
    if (!analyzedReview) return
    const newReview = {
      id: String(Date.now()),
      platform: addPlatform,
      author_name: addAuthor || "익명",
      rating: addRating,
      content: addContent,
      sentiment: analyzedReview.sentiment,
      risk_level: analyzedReview.risk_level,
      ai_summary: analyzedReview.summary,
      keywords: analyzedReview.keywords,
      is_responded: false,
      detected_at: new Date().toISOString(),
      mock_response: generateResponse(addContent, analyzedReview.sentiment, analyzedReview.risk_level),
    }
    setReviews((prev) => [newReview as any, ...prev])
    setAddContent("")
    setAddAuthor("")
    setAddRating(3)
    setAnalyzedReview(null)
    setActiveTab("reviews")
  }

  // 스마트 붙여넣기 시뮬레이터 (데모용 — API 키 없이 동작)
  function handlePasteSimulate() {
    if (!pasteText.trim()) return
    setParsing(true)
    setParsedResult(null)
    setTimeout(() => {
      const text = pasteText
      // 별점 추출 (★ 개수 또는 숫자)
      const starMatch = text.match(/★{1,5}/) || text.match(/별점[^\d]*(\d)/) || text.match(/(\d)점/)
      const rating = starMatch
        ? (starMatch[0].startsWith("★") ? starMatch[0].length : parseInt(starMatch[1]))
        : 3
      // 작성자 추출
      const authorMatch = text.match(/([가-힣]{2,4})(님|씨)/) || text.match(/작성자[:\s]+([^\n]+)/)
      const author_name = authorMatch ? authorMatch[1] : null
      // 날짜 추출
      const dateMatch = text.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/)
      const review_date = dateMatch ? `${dateMatch[1]}-${dateMatch[2].padStart(2,"0")}-${dateMatch[3].padStart(2,"0")}` : new Date().toISOString().split("T")[0]
      // 본문 추출 (메타 정보 제거)
      const lines = text.split("\n").map(l => l.trim()).filter(l =>
        l.length > 0 &&
        !l.match(/★|별점|작성자|님이 리뷰|플랫폼|\d{4}[.\-/]\d/) &&
        l.length > 5
      )
      const content = lines.join(" ").trim() || text.trim()

      setParsedResult({ rating, author_name, review_date, content })
      setAddRating(rating)
      if (author_name) setAddAuthor(author_name)
      setAddContent(content)
      setParsing(false)
    }, 1500)
  }

  function resetPaste() {
    setPasteText("")
    setParsedResult(null)
    setAddContent("")
    setAddAuthor("")
    setAddRating(3)
    setAnalyzedReview(null)
  }

  const unanswered = reviews.filter((r) => !r.is_responded).length

  const tabs = [
    { key: "dashboard" as Tab, label: "대시보드", icon: LayoutDashboard },
    { key: "reviews" as Tab, label: "리뷰 관리", icon: ListChecks },
    { key: "add" as Tab, label: "테스트", icon: FlaskConical },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* 데모 배너 */}
      <div className="bg-primary-600 text-white text-center py-2.5 text-xs sm:text-sm font-medium px-4 flex items-center justify-center gap-2 flex-wrap">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          데모 모드 — API 키 없이 모든 기능 체험
        </span>
        <Link href="/register" className="underline hover:no-underline font-semibold whitespace-nowrap">
          실제 서비스 시작하기 →
        </Link>
      </div>

      {/* 헤더 (모바일) / 사이드바 헤더 역할 */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between md:hidden sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary-600" />
          <div>
            <div className="font-bold text-gray-900 text-sm leading-tight">ReviewGuard Med</div>
            <div className="text-xs text-gray-400">데모 · 이춘봉성형외과</div>
          </div>
        </div>
        <Link
          href="/register"
          className="flex items-center gap-1 bg-primary-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary-700 transition"
        >
          시작 <ArrowRight className="w-3 h-3" />
        </Link>
      </header>

      {/* 데스크톱 레이아웃 */}
      <div className="flex flex-1 overflow-hidden">

        {/* 사이드바 — 데스크톱 전용 */}
        <aside className="hidden md:flex w-60 lg:w-64 bg-white border-r border-gray-100 flex-col flex-shrink-0">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Shield className="w-7 h-7 text-primary-600" />
              <div>
                <div className="font-bold text-gray-900 text-sm">ReviewGuard Med</div>
                <div className="text-xs text-gray-400">데모 대시보드</div>
              </div>
            </div>
          </div>

          <div className="px-3 py-3 mx-3 mt-4 bg-primary-50 rounded-xl">
            <p className="font-semibold text-primary-900 text-sm">이춘봉성형외과</p>
            <p className="text-xs text-primary-600">성형외과 · 데모</p>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {tabs.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition font-medium text-sm ${
                  activeTab === item.key
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 w-full bg-primary-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-primary-700 transition"
            >
              실제 서비스 시작
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">

            {/* ── 대시보드 탭 ── */}
            {activeTab === "dashboard" && (
              <div>
                <div className="mb-6">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">이춘봉성형외과</h1>
                  <p className="text-gray-500 text-sm">성형외과 · 평판 관리 대시보드</p>
                </div>

                {/* 통계 카드 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                  {[
                    { icon: Star, bg: "bg-yellow-50 text-yellow-600", label: "평균 별점", value: MOCK_STATS.avg_rating, sub: "/ 5.0" },
                    { icon: MessageSquare, bg: "bg-blue-50 text-blue-600", label: "전체 리뷰", value: reviews.length, sub: "건" },
                    { icon: CheckCircle, bg: "bg-green-50 text-green-600", label: "답변율", value: `${Math.round((reviews.filter(r => r.is_responded).length / reviews.length) * 100)}%`, sub: `미답변 ${unanswered}건` },
                    { icon: AlertTriangle, bg: "bg-red-50 text-red-600", label: "긴급 리뷰", value: reviews.filter(r => r.risk_level === "urgent").length, sub: "건" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                        <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1">{s.label}</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
                    </div>
                  ))}
                </div>

                {/* 감성 분포 + 긴급 리뷰 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100">
                    <h2 className="font-semibold text-gray-900 mb-4">리뷰 감성 분포</h2>
                    <div className="space-y-3">
                      {[
                        { label: "긍정", count: reviews.filter(r => r.sentiment === "positive").length, color: "bg-green-500", text: "text-green-700" },
                        { label: "중립", count: reviews.filter(r => r.sentiment === "neutral").length, color: "bg-yellow-500", text: "text-yellow-700" },
                        { label: "부정", count: reviews.filter(r => r.sentiment === "negative").length, color: "bg-orange-500", text: "text-orange-700" },
                        { label: "분쟁소지", count: reviews.filter(r => r.sentiment === "dispute").length, color: "bg-red-500", text: "text-red-700" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <span className={`text-xs font-medium w-14 sm:w-16 text-right ${item.text}`}>{item.label}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                            <div className={`h-2.5 rounded-full ${item.color}`} style={{ width: `${(item.count / reviews.length) * 100}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-8">{item.count}건</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100">
                    <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      즉시 대응 필요
                      {reviews.filter(r => r.risk_level === "urgent" && !r.is_responded).length > 0 && (
                        <span className="ml-auto bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          {reviews.filter(r => r.risk_level === "urgent" && !r.is_responded).length}건
                        </span>
                      )}
                    </h2>
                    {reviews.filter(r => ["urgent", "caution"].includes(r.risk_level) && !r.is_responded).slice(0, 3).map((review) => (
                      <div
                        key={review.id}
                        onClick={() => { setActiveTab("reviews"); setTimeout(() => handleOpenResponse(review), 100) }}
                        className="p-3 rounded-xl bg-red-50 hover:bg-red-100 transition cursor-pointer mb-2"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${review.risk_level === "urgent" ? "bg-red-200 text-red-800" : "bg-orange-200 text-orange-800"}`}>
                            {RISK_ICONS[review.risk_level]} {RISK_LABELS[review.risk_level]}
                          </span>
                          <span className="text-xs text-gray-500">{"⭐".repeat(review.rating)} {review.author_name}</span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{review.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── 리뷰 관리 탭 ── */}
            {activeTab === "reviews" && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">리뷰 관리</h1>
                  <button
                    onClick={() => setActiveTab("add")}
                    className="flex items-center gap-1.5 bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-xl hover:bg-primary-700 transition font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">리뷰 추가 테스트</span>
                    <span className="sm:hidden">추가</span>
                  </button>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className={`bg-white rounded-2xl p-4 sm:p-5 border ${review.risk_level === "urgent" ? "border-red-200 ring-1 ring-red-100" : "border-gray-100"}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${RISK_COLORS[review.risk_level]}`}>
                            {RISK_ICONS[review.risk_level]} {RISK_LABELS[review.risk_level]}
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SENTIMENT_COLORS[review.sentiment]}`}>
                            {SENTIMENT_LABELS[review.sentiment]}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {PLATFORM_LABELS[review.platform] || review.platform}
                          </span>
                          <span className="text-xs text-yellow-600">{"⭐".repeat(review.rating)}</span>
                        </div>
                        <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${review.is_responded ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
                          {review.is_responded ? <><CheckCircle className="w-3 h-3" /> 답변완료</> : "미답변"}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mb-1.5">{review.author_name}</p>
                      <p className="text-gray-800 text-sm leading-relaxed mb-3">{review.content}</p>

                      {review.ai_summary && (
                        <div className="bg-primary-50 rounded-xl px-3 py-2 mb-3">
                          <p className="text-xs text-primary-700">
                            <span className="font-semibold">AI 요약:</span> {review.ai_summary}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {review.keywords.map((kw) => (
                              <span key={kw} className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{kw}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          onClick={() => handleOpenResponse(review)}
                          className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition ${
                            review.risk_level === "urgent" && !review.is_responded
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : "bg-primary-600 text-white hover:bg-primary-700"
                          }`}
                        >
                          <Bot className="w-4 h-4" />
                          {review.is_responded ? "답변 보기" : "AI 답변 생성"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 리뷰 추가 테스트 탭 ── */}
            {activeTab === "add" && (
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">리뷰 추가 테스트</h1>
                <p className="text-gray-500 text-sm mb-4">네이버·카카오 리뷰를 붙여넣거나 직접 입력해보세요.</p>

                {/* 모드 탭 */}
                <div className="flex border-b border-gray-200 mb-5">
                  <button
                    onClick={() => { setAddMode("paste"); resetPaste() }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium border-b-2 transition ${
                      addMode === "paste" ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <ClipboardPaste className="w-4 h-4" />
                    스마트 붙여넣기
                    <span className="bg-primary-100 text-primary-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">AI</span>
                  </button>
                  <button
                    onClick={() => { setAddMode("manual"); resetPaste() }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium border-b-2 transition ${
                      addMode === "manual" ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <PenLine className="w-4 h-4" />
                    직접 입력
                  </button>
                </div>

                {/* ── 스마트 붙여넣기 ── */}
                {addMode === "paste" && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs text-blue-700 font-semibold mb-1">📋 사용 방법</p>
                      <p className="text-xs text-blue-600 leading-relaxed">
                        네이버·카카오 리뷰를 통째로 복사해서 붙여넣으세요.<br />
                        AI가 작성자·별점·내용을 자동으로 추출합니다.
                      </p>
                    </div>

                    {!parsedResult ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">플랫폼</label>
                          <select value={addPlatform} onChange={(e) => setAddPlatform(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="naver">네이버 지도</option>
                            <option value="google">구글 지도</option>
                            <option value="kakao">카카오맵</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">리뷰 텍스트 붙여넣기</label>
                          <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)}
                            rows={5}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder={"예시 (네이버 알림 이메일 또는 앱에서 복사):\n\n김OO님이 리뷰를 남겼습니다.\n별점: ★★★★☆\n친절하고 설명을 잘 해주셨어요. 대기 시간이 조금 길었지만 만족합니다.\n2026.04.02"}
                          />
                        </div>

                        {/* 테스트 예시 */}
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs font-semibold text-gray-500 mb-2">📋 테스트 예시 (클릭해서 입력)</p>
                          <div className="space-y-2">
                            {[
                              { label: "✅ 긍정", text: "김OO님이 리뷰를 남겼습니다.\n별점: ★★★★★\n원장님이 너무 친절하고 설명을 자세히 해주셔서 좋았습니다. 다음에 또 방문할게요!\n2026.04.01" },
                              { label: "⚠️ 부정", text: "이OO님이 리뷰를 남겼습니다.\n별점: ★★☆☆☆\n대기시간이 너무 길고 직원이 불친절했어요. 다시는 오고 싶지 않네요.\n2026.04.01" },
                              { label: "🚨 긴급", text: "박OO님이 리뷰를 남겼습니다.\n별점: ★☆☆☆☆\n수술 후 부작용이 생겼는데 아무 조치도 없었습니다. 의료분쟁조정원에 신고하겠습니다.\n2026.04.02" },
                            ].map((ex) => (
                              <button key={ex.label} onClick={() => setPasteText(ex.text)}
                                className="w-full text-left px-3 py-2 bg-white rounded-lg border border-gray-100 hover:border-primary-300 transition text-sm">
                                <span className="font-medium">{ex.label}</span>
                                <span className="text-gray-400 ml-2 text-xs">{ex.text.split("\n")[0]}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <button onClick={handlePasteSimulate} disabled={!pasteText.trim() || parsing}
                          className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-3 rounded-xl hover:bg-primary-700 transition disabled:opacity-50">
                          {parsing
                            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> AI 추출 중...</>
                            : <><Sparkles className="w-4 h-4" /> AI로 자동 추출</>
                          }
                        </button>
                      </>
                    ) : (
                      /* 파싱 결과 확인 */
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-xl">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <p className="text-xs text-green-700 font-medium">AI가 정보를 추출했습니다. 확인 후 분석하세요.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">플랫폼</label>
                            <select value={addPlatform} onChange={(e) => setAddPlatform(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                              <option value="naver">네이버 지도</option>
                              <option value="google">구글 지도</option>
                              <option value="kakao">카카오맵</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">별점</label>
                            <select value={addRating} onChange={(e) => setAddRating(Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                              {[5,4,3,2,1].map(r => <option key={r} value={r}>{"⭐".repeat(r)} ({r}점)</option>)}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">작성자</label>
                          <input value={addAuthor} onChange={(e) => setAddAuthor(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="익명" />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">리뷰 내용</label>
                          <textarea value={addContent} onChange={(e) => setAddContent(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>

                        <div className="flex gap-3">
                          <button onClick={resetPaste}
                            className="flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm">
                            다시 입력
                          </button>
                          <button onClick={() => { setAnalyzedReview(null); handleAnalyze() }} disabled={!addContent.trim() || analyzing}
                            className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-2.5 rounded-xl hover:bg-primary-700 transition disabled:opacity-50 text-sm">
                            {analyzing
                              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 분석 중...</>
                              : <><Bot className="w-4 h-4" /> AI 감성 분석</>
                            }
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── 직접 입력 ── */}
                {addMode === "manual" && (
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">플랫폼</label>
                        <select value={addPlatform} onChange={(e) => setAddPlatform(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                          <option value="naver">네이버 지도</option>
                          <option value="google">구글 지도</option>
                          <option value="kakao">카카오맵</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">별점</label>
                        <select value={addRating} onChange={(e) => setAddRating(Number(e.target.value))}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                          {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{"⭐".repeat(r)} ({r}점)</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">리뷰 내용 *</label>
                      <textarea value={addContent} onChange={(e) => { setAddContent(e.target.value); setAnalyzedReview(null) }}
                        rows={4} placeholder="리뷰 내용을 직접 입력하세요."
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>

                    {/* 테스트 예시 */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">📋 예시 클릭</p>
                      <div className="space-y-2">
                        {[
                          { label: "✅ 긍정", text: "원장님이 너무 친절하고 설명을 자세히 해주셔서 좋았습니다. 다음에 또 방문할게요!" },
                          { label: "⚠️ 부정", text: "대기시간이 너무 길고 직원이 불친절했어요. 다시는 오고 싶지 않네요." },
                          { label: "🚨 긴급", text: "수술 후 부작용이 생겼는데 아무 조치도 없었습니다. 의료분쟁조정원에 신고하겠습니다." },
                        ].map((ex) => (
                          <button key={ex.label} onClick={() => { setAddContent(ex.text); setAnalyzedReview(null) }}
                            className="w-full text-left px-3 py-2 bg-white rounded-lg border border-gray-100 hover:border-primary-300 transition text-sm">
                            <span className="font-medium">{ex.label}</span>
                            <span className="text-gray-500 ml-2 text-xs">{ex.text.slice(0, 30)}...</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button onClick={handleAnalyze} disabled={!addContent.trim() || analyzing}
                      className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-3 rounded-xl hover:bg-primary-700 transition disabled:opacity-50">
                      {analyzing
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> AI 분석 중...</>
                        : <><Bot className="w-4 h-4" /> AI 분석하기</>
                      }
                    </button>
                  </div>
                )}

                {/* 분석 결과 (공통) */}
                {analyzedReview && (
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-primary-100 ring-1 ring-primary-100 mt-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary-600" />
                      AI 분석 결과
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1">감성 분류</p>
                        <span className={`text-sm font-bold px-2 py-1 rounded-full ${SENTIMENT_COLORS[analyzedReview.sentiment]}`}>
                          {SENTIMENT_LABELS[analyzedReview.sentiment]}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1">위험도</p>
                        <span className={`text-sm font-bold px-2 py-1 rounded-full border ${RISK_COLORS[analyzedReview.risk_level]}`}>
                          {RISK_ICONS[analyzedReview.risk_level]} {RISK_LABELS[analyzedReview.risk_level]}
                        </span>
                      </div>
                    </div>
                    <div className="bg-primary-50 rounded-xl p-3 mb-4">
                      <p className="text-xs font-semibold text-primary-700 mb-1">AI 요약</p>
                      <p className="text-sm text-primary-800">{analyzedReview.summary}</p>
                    </div>
                    {analyzedReview.risk_level === "urgent" && (
                      <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
                        <p className="text-sm font-semibold text-red-700">🚨 긴급 알림 발송 예정</p>
                        <p className="text-xs text-red-600 mt-1">실제 서비스에서는 등록된 이메일로 즉시 알림이 발송됩니다.</p>
                      </div>
                    )}
                    <button onClick={handleAddReview}
                      className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl hover:bg-gray-800 transition flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" />
                      리뷰 목록에 추가하기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 하단 탭바 — 모바일 전용 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-30">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition ${
              activeTab === item.key ? "text-primary-600" : "text-gray-400"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ── AI 답변 모달 ── */}
      {showResponse && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl sm:rounded-t-2xl z-10">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary-600" />
                AI 답변 초안
              </h2>
              <button onClick={() => setShowResponse(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5">
              {/* 원본 리뷰 */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${RISK_COLORS[selectedReview.risk_level]}`}>
                    {RISK_ICONS[selectedReview.risk_level]} {RISK_LABELS[selectedReview.risk_level]}
                  </span>
                  <span className="text-xs text-gray-500">{"⭐".repeat(selectedReview.rating)} {selectedReview.author_name}</span>
                </div>
                <p className="text-sm text-gray-700">{selectedReview.content}</p>
              </div>

              {generatingResponse ? (
                <div className="text-center py-10">
                  <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">AI가 의료광고법 가이드라인을 적용해 답변을 생성하고 있습니다...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">답변 초안 <span className="text-gray-400 font-normal">(수정 가능)</span></label>
                      <button onClick={() => { setGeneratingResponse(true); setTimeout(() => setGeneratingResponse(false), 1200) }}
                        className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium">
                        <RefreshCw className="w-3.5 h-3.5" /> 재생성
                      </button>
                    </div>
                    <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)}
                      rows={6} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>

                  {selectedReview.risk_level === "urgent" && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
                      <p className="text-sm font-semibold text-red-700">⚠️ 법무 검토 권장</p>
                      <p className="text-xs text-red-600 mt-1">이 리뷰는 분쟁 소지가 있습니다. 게시 전 법무팀 검토를 권장합니다.</p>
                    </div>
                  )}

                  <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 mb-5">
                    <p className="text-xs text-yellow-700">⚠️ 의료광고법 준수: 게시 전 금지 표현 포함 여부를 반드시 확인하세요.</p>
                  </div>

                  {published ? (
                    <div className="text-center py-4">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <p className="font-semibold text-green-700">답변이 저장되었습니다!</p>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button onClick={() => setShowResponse(false)}
                        className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition text-sm">
                        닫기
                      </button>
                      <button onClick={handlePublish}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-3 rounded-xl hover:bg-primary-700 transition text-sm">
                        <Send className="w-4 h-4" />
                        답변 저장 완료
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
