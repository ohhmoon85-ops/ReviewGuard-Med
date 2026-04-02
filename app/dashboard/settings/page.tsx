"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-client"
import { SPECIALTY_LIST } from "@/lib/types"
import { Save, LogOut, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [hospital, setHospital] = useState<any>(null)

  const [name, setName] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [naverPlaceId, setNaverPlaceId] = useState("")
  const [googlePlaceId, setGooglePlaceId] = useState("")
  const [kakaoPlaceId, setKakaoPlaceId] = useState("")
  const [notificationEmail, setNotificationEmail] = useState("")
  const [tone, setTone] = useState("전문적이고 친근한")

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("hospitals")
        .select("*")
        .eq("owner_id", user.id)
        .single()

      if (data) {
        setHospital(data)
        setName(data.name || "")
        setSpecialty(data.specialty || "")
        setNaverPlaceId(data.naver_place_id || "")
        setGooglePlaceId(data.google_place_id || "")
        setKakaoPlaceId(data.kakao_place_id || "")
        setNotificationEmail(data.notification_email || "")
        setTone(data.tone || "전문적이고 친근한")
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)

    const { error } = await supabase
      .from("hospitals")
      .update({
        name,
        specialty,
        naver_place_id: naverPlaceId || null,
        google_place_id: googlePlaceId || null,
        kakao_place_id: kakaoPlaceId || null,
        notification_email: notificationEmail || null,
        tone,
      })
      .eq("id", hospital.id)

    setSaving(false)
    if (!error) setSuccess(true)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return <div className="animate-pulse">로딩 중...</div>
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">병원 설정</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-500 hover:text-red-600 text-sm transition"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">기본 정보</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">병원명 *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">진료과 *</label>
              <select
                required
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                {SPECIALTY_LIST.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AI 답변 톤</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="전문적이고 친근한">전문적이고 친근한 (기본)</option>
                <option value="정중하고 공식적인">정중하고 공식적인</option>
                <option value="따뜻하고 공감하는">따뜻하고 공감하는</option>
                <option value="간결하고 명확한">간결하고 명확한</option>
              </select>
            </div>
          </div>
        </div>

        {/* 플랫폼 연동 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-1">플랫폼 연동</h2>
          <p className="text-sm text-gray-500 mb-4">자동 수집을 위한 플랫폼 ID를 입력하세요.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                구글 Place ID
                <span className="text-gray-400 font-normal ml-2">자동 수집 지원</span>
              </label>
              <input
                value={googlePlaceId}
                onChange={(e) => setGooglePlaceId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                placeholder="ChIJ..."
              />
              <p className="text-xs text-gray-400 mt-1">
                구글 지도에서 병원 검색 → URL의 place_id= 값 복사
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                네이버 Place ID
                <span className="text-gray-400 font-normal ml-2">수동 입력</span>
              </label>
              <input
                value={naverPlaceId}
                onChange={(e) => setNaverPlaceId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                placeholder="1234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카카오맵 Place ID</label>
              <input
                value={kakaoPlaceId}
                onChange={(e) => setKakaoPlaceId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                placeholder="12345678"
              />
            </div>
          </div>
        </div>

        {/* 알림 설정 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">알림 설정</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              알림 이메일
            </label>
            <input
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="부정 리뷰 즉시 알림을 받을 이메일"
            />
            <div className="flex items-start gap-2 mt-2 p-3 bg-yellow-50 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-700">
                이메일 알림은 Resend 서비스를 사용합니다. <br />
                .env에 RESEND_API_KEY 설정 필요 (무료: 월 3,000건)
              </p>
            </div>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm">
            ✓ 설정이 저장되었습니다.
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-primary-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "저장 중..." : "설정 저장"}
        </button>
      </form>
    </div>
  )
}
