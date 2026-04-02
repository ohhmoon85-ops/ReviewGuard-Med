import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Star, MessageSquare, AlertTriangle, CheckCircle,
  TrendingUp, Clock, AlertCircle, Plus, ClipboardPaste, Smartphone
} from "lucide-react"

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: hospital } = await supabase
    .from("hospitals")
    .select("*")
    .eq("owner_id", user.id)
    .single()

  if (!hospital) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">병원 정보를 설정해주세요</h2>
          <Link href="/dashboard/settings" className="text-primary-600 underline">
            설정 페이지로 이동
          </Link>
        </div>
      </div>
    )
  }

  // 통계 조회
  const { data: reviews } = await supabase
    .from("reviews")
    .select("sentiment, risk_level, is_responded, rating")
    .eq("hospital_id", hospital.id)

  const stats = {
    total: reviews?.length || 0,
    positive: reviews?.filter((r) => r.sentiment === "positive").length || 0,
    neutral: reviews?.filter((r) => r.sentiment === "neutral").length || 0,
    negative: reviews?.filter((r) => r.sentiment === "negative").length || 0,
    dispute: reviews?.filter((r) => r.sentiment === "dispute").length || 0,
    urgent: reviews?.filter((r) => r.risk_level === "urgent").length || 0,
    unanswered: reviews?.filter((r) => !r.is_responded).length || 0,
    avgRating:
      reviews?.length
        ? (
          reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
          reviews.filter((r) => r.rating).length
        ).toFixed(1)
        : "0.0",
    responseRate:
      reviews?.length
        ? Math.round((reviews.filter((r) => r.is_responded).length / reviews.length) * 100)
        : 0,
  }

  // 최근 미답변 긴급/부정 리뷰
  const { data: urgentReviews } = await supabase
    .from("reviews")
    .select("id, content, rating, sentiment, risk_level, author_name, platform, detected_at")
    .eq("hospital_id", hospital.id)
    .eq("is_responded", false)
    .in("risk_level", ["urgent", "caution"])
    .order("detected_at", { ascending: false })
    .limit(5)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{hospital.name}</h1>
          <p className="text-gray-500">{hospital.specialty} · 평판 관리 대시보드</p>
        </div>
        <Link
          href="/dashboard/reviews?add=true"
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition font-medium"
        >
          <Plus className="w-4 h-4" />
          리뷰 추가
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Star}
          iconBg="bg-yellow-50 text-yellow-600"
          label="평균 별점"
          value={stats.avgRating}
          sub="/ 5.0"
        />
        <StatCard
          icon={MessageSquare}
          iconBg="bg-blue-50 text-blue-600"
          label="전체 리뷰"
          value={stats.total}
          sub="건"
        />
        <StatCard
          icon={CheckCircle}
          iconBg="bg-green-50 text-green-600"
          label="답변율"
          value={`${stats.responseRate}%`}
          sub={`미답변 ${stats.unanswered}건`}
          subColor={stats.unanswered > 0 ? "text-red-500" : "text-gray-400"}
        />
        <StatCard
          icon={AlertTriangle}
          iconBg="bg-red-50 text-red-600"
          label="긴급 리뷰"
          value={stats.urgent}
          sub="건 (즉시 대응 필요)"
          subColor={stats.urgent > 0 ? "text-red-500" : "text-gray-400"}
        />
      </div>

      {/* 감성 분포 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            리뷰 감성 분포
          </h2>
          {stats.total === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>아직 리뷰가 없습니다.</p>
              <Link href="/dashboard/reviews?add=true" className="text-primary-600 text-sm underline mt-2 block">
                첫 리뷰 추가하기
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: "긍정", count: stats.positive, color: "bg-green-500", textColor: "text-green-700", bg: "bg-green-50" },
                { label: "중립", count: stats.neutral, color: "bg-yellow-500", textColor: "text-yellow-700", bg: "bg-yellow-50" },
                { label: "부정", count: stats.negative, color: "bg-orange-500", textColor: "text-orange-700", bg: "bg-orange-50" },
                { label: "분쟁소지", count: stats.dispute, color: "bg-red-500", textColor: "text-red-700", bg: "bg-red-50" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className={`text-sm font-medium w-16 text-right ${item.textColor}`}>{item.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: stats.total > 0 ? `${(item.count / stats.total) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-10">{item.count}건</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 긴급 대응 필요 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            즉시 대응 필요
            {(urgentReviews?.length || 0) > 0 && (
              <span className="ml-auto bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {urgentReviews?.length}건
              </span>
            )}
          </h2>
          {!urgentReviews || urgentReviews.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
              <p>긴급 대응이 필요한 리뷰가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {urgentReviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/dashboard/reviews`}
                  className="block p-3 rounded-xl bg-red-50 hover:bg-red-100 transition"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      review.risk_level === "urgent" ? "bg-red-200 text-red-800" : "bg-orange-200 text-orange-800"
                    }`}>
                      {review.risk_level === "urgent" ? "🚨 긴급" : "⚠️ 주의"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {"⭐".repeat(review.rating || 0)} {review.author_name || "익명"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{review.content}</p>
                </Link>
              ))}
              <Link
                href="/dashboard/reviews?risk_level=urgent"
                className="block text-center text-sm text-primary-600 font-medium py-2 hover:underline"
              >
                전체 보기 →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="bg-primary-50 rounded-2xl p-6 border border-primary-100 mb-6">
        <h2 className="font-semibold text-primary-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          빠른 액션
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/dashboard/reviews?add=true"
            className="bg-white text-center py-3 px-4 rounded-xl text-sm font-medium text-gray-700 hover:shadow-sm transition border border-primary-100"
          >
            + 리뷰 직접 입력
          </Link>
          <Link
            href="/dashboard/reviews?is_responded=false"
            className="bg-white text-center py-3 px-4 rounded-xl text-sm font-medium text-gray-700 hover:shadow-sm transition border border-primary-100"
          >
            미답변 리뷰 보기 ({stats.unanswered}건)
          </Link>
          <Link
            href="/dashboard/settings"
            className="bg-white text-center py-3 px-4 rounded-xl text-sm font-medium text-gray-700 hover:shadow-sm transition border border-primary-100"
          >
            병원 설정
          </Link>
        </div>
      </div>

      {/* 네이버/카카오 리뷰 수집 안내 */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-green-600" />
          네이버·카카오 리뷰 수집 방법
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          네이버·카카오는 공식 API를 제공하지 않습니다. 아래 방법으로 간편하게 수집하세요.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 방법 1 */}
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardPaste className="w-4 h-4 text-green-700" />
              <p className="text-sm font-semibold text-green-800">방법 ① 스마트 붙여넣기 (권장)</p>
            </div>
            <ol className="text-xs text-green-700 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>네이버 스마트플레이스 앱 또는 웹에서 새 리뷰 확인</li>
              <li>리뷰 텍스트 전체 복사 (작성자·별점 포함)</li>
              <li>
                <Link href="/dashboard/reviews?add=true" className="underline font-medium">
                  리뷰 추가 → 스마트 붙여넣기
                </Link>{" "}
                탭에 붙여넣기
              </li>
              <li>AI가 자동으로 별점·작성자·내용 추출 → 저장</li>
            </ol>
          </div>

          {/* 방법 2 */}
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">📧</span>
              <p className="text-sm font-semibold text-yellow-800">방법 ② 이메일 알림 활용</p>
            </div>
            <ol className="text-xs text-yellow-700 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>네이버 스마트플레이스 관리자 → 알림 설정</li>
              <li>"새 리뷰 이메일 알림" 켜기</li>
              <li>알림 이메일 수신 후 → 내용 복사</li>
              <li>스마트 붙여넣기에 붙여넣으면 자동 파싱</li>
            </ol>
            <p className="text-xs text-yellow-600 mt-2 font-medium">
              💡 카카오맵도 동일한 방법으로 사용 가능
            </p>
          </div>
        </div>

        {!hospital.google_place_id && (
          <div className="mt-4 flex items-start gap-2 bg-blue-50 px-4 py-3 rounded-xl border border-blue-100">
            <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              <span className="font-semibold">구글 리뷰 자동 수집</span>이 아직 설정되지 않았습니다.{" "}
              <Link href="/dashboard/settings" className="underline font-semibold">설정 페이지</Link>에서 구글 지도를 연결하면
              매일 자동으로 수집됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  iconBg,
  label,
  value,
  sub,
  subColor = "text-gray-400",
}: {
  icon: React.ElementType
  iconBg: string
  label: string
  value: string | number
  sub?: string
  subColor?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>}
    </div>
  )
}
