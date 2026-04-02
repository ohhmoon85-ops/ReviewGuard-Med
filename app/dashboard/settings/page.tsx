"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-client"
import { SPECIALTY_LIST } from "@/lib/types"
import { Save, LogOut, AlertTriangle, Search, CheckCircle, Star, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

interface PlaceCandidate {
  place_id: string
  name: string
  address: string
  rating?: number
  user_ratings_total?: number
}

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [hospital, setHospital] = useState<any>(null)

  const [name, setName] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [notificationEmail, setNotificationEmail] = useState("")
  const [tone, setTone] = useState("전문적이고 친근한")

  // 구글 장소 연동
  const [googlePlaceId, setGooglePlaceId] = useState("")
  const [googlePlaceName, setGooglePlaceName] = useState("")
  const [googlePlaceAddress, setGooglePlaceAddress] = useState("")
  const [searching, setSearching] = useState(false)
  const [placeResults, setPlaceResults] = useState<PlaceCandidate[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchError, setSearchError] = useState("")

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
        setNotificationEmail(data.notification_email || "")
        setTone(data.tone || "전문적이고 친근한")
        setGooglePlaceId(data.google_place_id || "")
        setSearchQuery(data.name || "")
        // google_place_id가 있으면 장소명은 병원명으로 표시
        if (data.google_place_id) {
          setGooglePlaceName(data.name)
        }
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  async function handleSearchPlace() {
    const query = searchQuery || name
    if (!query.trim()) return
    setSearching(true)
    setPlaceResults([])
    setSearchError("")

    try {
      const res = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()

      if (res.status === 503) {
        setSearchError("GOOGLE_PLACES_API_KEY가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요.")
      } else if (!data.results?.length) {
        setSearchError("검색 결과가 없습니다. 병원명을 더 구체적으로 입력해보세요.")
      } else {
        setPlaceResults(data.results)
      }
    } catch {
      setSearchError("검색 중 오류가 발생했습니다.")
    } finally {
      setSearching(false)
    }
  }

  function handleSelectPlace(place: PlaceCandidate) {
    setGooglePlaceId(place.place_id)
    setGooglePlaceName(place.name)
    setGooglePlaceAddress(place.address)
    setPlaceResults([])
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)

    const { error } = await supabase
      .from("hospitals")
      .update({
        name,
        specialty,
        notification_email: notificationEmail || null,
        tone,
        google_place_id: googlePlaceId || null,
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
    return <div className="animate-pulse text-gray-400 py-8">로딩 중...</div>
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

        {/* 구글 지도 연동 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-900">구글 지도 연동</h2>
            {googlePlaceId && (
              <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> 연결됨
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">구글 리뷰를 매일 자동으로 수집합니다.</p>

          {googlePlaceId && googlePlaceName ? (
            <div className="bg-green-50 rounded-xl p-4 mb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-green-800 text-sm">{googlePlaceName}</p>
                  {googlePlaceAddress && <p className="text-xs text-green-600 mt-0.5">{googlePlaceAddress}</p>}
                  <p className="text-xs text-green-600 mt-1 font-mono">{googlePlaceId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setGooglePlaceId(""); setGooglePlaceName(""); setGooglePlaceAddress("") }}
                  className="flex-shrink-0 flex items-center gap-1 text-xs text-green-700 hover:text-red-600 border border-green-200 px-2 py-1 rounded-lg transition"
                >
                  <RefreshCw className="w-3 h-3" /> 재연결
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPlaceResults([]); setSearchError("") }}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearchPlace())}
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="병원명으로 검색"
                />
                <button
                  type="button"
                  onClick={handleSearchPlace}
                  disabled={searching || !searchQuery.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {searching
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Search className="w-4 h-4" />
                  }
                  검색
                </button>
              </div>

              {searchError && (
                <div className="flex items-start gap-2 bg-orange-50 px-3 py-2 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-700">{searchError}</p>
                </div>
              )}

              {placeResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">해당 병원을 선택하세요</p>
                  {placeResults.map((place) => (
                    <button
                      key={place.place_id}
                      type="button"
                      onClick={() => handleSelectPlace(place)}
                      className="w-full text-left px-3 py-3 border border-gray-200 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition"
                    >
                      <p className="text-sm font-semibold text-gray-800">{place.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{place.address}</p>
                      {place.rating && (
                        <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                          <Star className="w-3 h-3" /> {place.rating} · 리뷰 {place.user_ratings_total?.toLocaleString()}개
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-400">
                검색이 안 되면 GOOGLE_PLACES_API_KEY 환경변수를 확인하세요.
              </p>
            </div>
          )}
        </div>

        {/* 알림 설정 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">알림 설정</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">알림 이메일</label>
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
                이메일 알림은 Resend 서비스를 사용합니다.
                Vercel 환경변수에 RESEND_API_KEY 설정 필요 (무료: 월 3,000건)
              </p>
            </div>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> 설정이 저장되었습니다.
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
