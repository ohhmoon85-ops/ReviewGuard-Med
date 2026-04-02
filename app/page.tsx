import Link from "next/link"
import { Shield, Bell, Bot, BarChart3, Clock, FileText } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary-600" />
            <span className="font-bold text-xl text-gray-900">ReviewGuard Med</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              로그인
            </Link>
            <Link
              href="/register"
              className="bg-primary-600 text-white font-medium px-5 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              무료 시작
            </Link>
          </div>
        </div>
      </header>

      {/* 히어로 */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
          <Bot className="w-4 h-4" />
          AI 기반 의료광고법 준수 답변
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          병원 리뷰 관리,<br />
          <span className="text-primary-600">5분이면 충분합니다</span>
        </h1>
        <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto leading-relaxed">
          부정 리뷰 등록 → 즉시 알림 → AI 답변 초안 생성 → 원클릭 게시.<br />
          기존 수동 대응 평균 8시간을 96% 단축합니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="bg-primary-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-primary-700 transition text-lg"
          >
            무료로 시작하기
          </Link>
          <Link
            href="/login"
            className="border border-gray-200 text-gray-700 font-semibold px-8 py-4 rounded-xl hover:bg-gray-50 transition text-lg"
          >
            로그인
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-400">신용카드 없이 시작 · 언제든 해지 가능</p>
      </section>

      {/* 문제 인식 */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            지금 이런 문제를 겪고 계신가요?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "😓",
                title: "리뷰 발견 지연",
                desc: "직접 네이버·구글을 확인해야 해서 평균 8시간 후에 발견. 그 사이 잠재 환자가 이탈합니다.",
              },
              {
                icon: "📝",
                title: "답변 작성이 막막",
                desc: "의료광고법 위반 걱정에 어떻게 써야 할지 몰라 방치하는 경우가 대부분입니다.",
              },
              {
                icon: "📱",
                title: "플랫폼이 너무 많아",
                desc: "네이버·구글·카카오 3개를 매일 확인하면 하루 30분 이상. 사실상 1개만 보고 나머지는 방치.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 핵심 기능 */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
          ReviewGuard Med가 해결합니다
        </h2>
        <p className="text-center text-gray-500 mb-12">
          별점 0.4점 차이가 신환 22% 차이입니다
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: Bell,
              color: "bg-red-50 text-red-600",
              title: "즉시 알림",
              desc: "부정·긴급 리뷰 등록 즉시 이메일 알림. 위험도 3단계(낮음·주의·긴급)로 분류.",
            },
            {
              icon: Bot,
              color: "bg-primary-50 text-primary-600",
              title: "과별 AI 답변",
              desc: "피부과·치과·한의원 등 진료과별 의료광고법 가이드라인을 반영한 답변 초안 자동 생성.",
            },
            {
              icon: Shield,
              color: "bg-blue-50 text-blue-600",
              title: "의료광고법 준수",
              desc: "과대 표현·비교 광고·결과 보장 등 금지 표현을 AI가 자동 필터링합니다.",
            },
            {
              icon: BarChart3,
              color: "bg-purple-50 text-purple-600",
              title: "평판 대시보드",
              desc: "플랫폼별 별점 추이, 미답변 현황, 키워드 분석을 한눈에 확인.",
            },
            {
              icon: Clock,
              color: "bg-orange-50 text-orange-600",
              title: "30분 자동 수집",
              desc: "구글 리뷰를 30분 간격으로 자동 수집. 네이버·카카오 수동 입력 지원.",
            },
            {
              icon: FileText,
              color: "bg-green-50 text-green-600",
              title: "월간 리포트",
              desc: "별점 변화·답변율·위험 리뷰 처리 현황을 담은 월간 리포트 자동 생성. (Pro)",
            },
          ].map((feature) => (
            <div key={feature.title} className="flex gap-4">
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center flex-shrink-0`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 요금제 */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">요금제</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: "스타터",
                price: "29,000",
                desc: "소형 의원·클리닉",
                features: [
                  "네이버+구글 모니터링",
                  "AI 답변 초안 월 30건",
                  "위험도 2단계 분류",
                  "이메일 알림",
                  "담당자 2명",
                ],
                cta: "시작하기",
                highlight: false,
              },
              {
                name: "프로",
                price: "79,000",
                desc: "중형 병원·전문 클리닉",
                features: [
                  "전체 플랫폼 모니터링",
                  "AI 답변 초안 무제한",
                  "위험도 3단계 분류",
                  "긴급 이중 알림",
                  "원클릭 게시",
                  "월간 PDF 리포트",
                  "담당자 5명",
                ],
                cta: "시작하기",
                highlight: true,
              },
              {
                name: "네트워크",
                price: "199,000",
                desc: "체인 병원·다점포",
                features: [
                  "프로 기능 전체 포함",
                  "지점 최대 10개",
                  "지점 비교 리포트",
                  "지점별 무제한 답변",
                  "지점당 담당자 5명",
                ],
                cta: "문의하기",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 ${plan.highlight ? "bg-primary-600 text-white ring-2 ring-primary-600" : "bg-white border border-gray-100"}`}
              >
                <div className={`text-sm font-medium mb-1 ${plan.highlight ? "text-primary-200" : "text-gray-500"}`}>
                  {plan.desc}
                </div>
                <div className="font-bold text-2xl mb-1">{plan.name}</div>
                <div className="mb-6">
                  <span className="text-3xl font-bold">₩{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? "text-primary-200" : "text-gray-400"}`}>/월</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className={`text-sm flex items-center gap-2 ${plan.highlight ? "text-primary-100" : "text-gray-600"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${plan.highlight ? "bg-primary-300" : "bg-primary-500"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-2.5 rounded-xl font-semibold transition ${
                    plan.highlight
                      ? "bg-white text-primary-700 hover:bg-primary-50"
                      : "bg-primary-600 text-white hover:bg-primary-700"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          지금 바로 시작하세요
        </h2>
        <p className="text-gray-500 mb-8">
          월 ₩79,000으로 전담 마케터 없이 리뷰를 5분 만에 관리하세요.
        </p>
        <Link
          href="/register"
          className="bg-primary-600 text-white font-semibold px-10 py-4 rounded-xl hover:bg-primary-700 transition text-lg inline-block"
        >
          무료로 시작하기
        </Link>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" />
            <span className="font-semibold text-gray-900">ReviewGuard Med</span>
          </div>
          <p className="text-sm text-gray-400">
            © 2026 ReviewGuard Med. AI 기반 의료기관 온라인 평판 관리 플랫폼
          </p>
        </div>
      </footer>
    </div>
  )
}
