"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Shield, Search, CheckCircle, Star } from "lucide-react"
import { createClient } from "@/lib/supabase-client"
import { SPECIALTY_LIST } from "@/lib/types"

function translateError(message: string): string {
  if (message.includes("after")) {
    const seconds = message.match(/\d+/)
    return `보안을 위해 ${seconds ? seconds[0] + "초" : "잠시"} 후에 다시 시도해주세요.`
  }
  if (message.includes("already registered") || message.includes("already been registered")) return "이미 가입된 이메일입니다."
  if (message.includes("invalid") && message.includes("email")) return "올바른 이메일 형식이 아닙니다."
  if (message.includes("Password should be at least")) return "비밀번호는 6자 이상이어야 합니다."
  if (message.includes("Unable to validate email address")) return "이메일 주소를 확인할 수 없습니다."
  if (message.includes("Email rate limit exceeded")) return "이메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해주세요."
  if (message.includes("Network")) return "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요."
  return message
}

interface PlaceCandidate {
  place_id: string
  name: string
  address: string
  rating?: number
  user_ratings_total?: number
}

export default function RegisterForm() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [hospitalName, setHospitalName] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [notificationEmail, setNotificationEmail] = useState("")

  // 구글 장소 검색 상태
  const [searching, setSearching] = useState(false)
  const [placeResults, setPlaceResults] = useState<PlaceCandidate[]>([])
  const [selectedPlace, setSelectedPlace] = useState<PlaceCandidate | null>(null)
  const [searchError, setSearchError] = useState("")

  async function handleSearchPlace() {
    if (!hospitalName.trim()) return
    setSearching(true)
    setPlaceResults([])
    setSelectedPlace(null)
    setSearchError("")

    try {
      const res = await fetch(`/api/places/search?q=${encodeURIComponent(hospitalName)}`)
      const data = await res.json()

      if (res.status === 503) {
        setSearchError("구글 API 키가 설정되지 않았습니다. 설정 후 다시 시도해주세요.")
      } else if (data.results?.length === 0) {
        setSearchError("검색 결과가 없습니다. 병원명을 더 구체적으로 입력해보세요.")
      } else {
        setPlaceResults(data.results || [])
      }
    } catch {
      setSearchError("검색 중 오류가 발생했습니다.")
    } finally {
      setSearching(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      setError(translateError(signUpError.message))
      setLoading(false)
      return
    }

    if (!data.user) {
      setError("계정 생성에 실패했습니다.")
      setLoading(false)
      return
    }

    const { error: hospitalError } = await supabase.from("hospitals").insert({
      owner_id: data.user.id,
      name: hospitalName,
      specialty,
      notification_email: notificationEmail || email,
      google_place_id: selectedPlace?.place_id || null,
    })

    if (hospitalError) {
      setError("병원 정보 저장에 실패했습니다: " + hospitalError.message)
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-primary-600" />
            <span className="font-bold text-xl text-gray-900">ReviewGuard Med</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">무료로 시작하기</h1>
          <p className="text-gray-500 mt-1">신용카드 없이 바로 사용 가능</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* 스텝 인디케이터 */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step >= s ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {s}
                </div>
                {s === 1 && (
                  <div className={`flex-1 h-0.5 w-16 ${step > 1 ? "bg-primary-600" : "bg-gray-100"}`} />
                )}
              </div>
            ))}
            <span className="text-sm text-gray-500 ml-1">
              {step === 1 ? "계정 정보" : "병원 정보"}
            </span>
          </div>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2) } : handleRegister} className="space-y-4">
            {step === 1 ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="doctor@clinic.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="6자 이상"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">병원명 *</label>
                  <input
                    type="text"
                    required
                    value={hospitalName}
                    onChange={(e) => {
                      setHospitalName(e.target.value)
                      setSelectedPlace(null)
                      setPlaceResults([])
                      setSearchError("")
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="OO의원, OO클리닉"
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
                    <option value="">진료과 선택</option>
                    {SPECIALTY_LIST.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* 구글 지도 연결 */}
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">구글 지도 연결</p>
                      <p className="text-xs text-gray-400">구글 리뷰 자동 수집을 위해 연결하세요</p>
                    </div>
                    {selectedPlace && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> 연결됨
                      </span>
                    )}
                  </div>

                  {selectedPlace ? (
                    <div className="bg-green-50 rounded-lg p-3 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-green-800">{selectedPlace.name}</p>
                        <p className="text-xs text-green-600">{selectedPlace.address}</p>
                        {selectedPlace.rating && (
                          <p className="text-xs text-green-600 mt-0.5">
                            ⭐ {selectedPlace.rating} ({selectedPlace.user_ratings_total?.toLocaleString()}개 리뷰)
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedPlace(null); setPlaceResults([]) }}
                        className="text-xs text-green-600 hover:text-green-800 underline flex-shrink-0"
                      >
                        변경
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleSearchPlace}
                        disabled={!hospitalName.trim() || searching}
                        className="w-full flex items-center justify-center gap-2 border border-primary-300 text-primary-700 font-medium py-2.5 rounded-lg hover:bg-primary-50 transition text-sm disabled:opacity-50"
                      >
                        {searching ? (
                          <><div className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" /> 검색 중...</>
                        ) : (
                          <><Search className="w-4 h-4" /> 구글 지도에서 병원 검색</>
                        )}
                      </button>

                      {searchError && (
                        <p className="text-xs text-orange-600">{searchError}</p>
                      )}

                      {placeResults.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500">아래 목록에서 해당 병원을 선택하세요</p>
                          {placeResults.map((place) => (
                            <button
                              key={place.place_id}
                              type="button"
                              onClick={() => { setSelectedPlace(place); setPlaceResults([]) }}
                              className="w-full text-left px-3 py-2.5 border border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition"
                            >
                              <p className="text-sm font-medium text-gray-800">{place.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{place.address}</p>
                              {place.rating && (
                                <p className="text-xs text-yellow-600 mt-0.5 flex items-center gap-1">
                                  <Star className="w-3 h-3" /> {place.rating} · 리뷰 {place.user_ratings_total?.toLocaleString()}개
                                </p>
                              )}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setPlaceResults([])}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            나중에 설정하기
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    알림 이메일 <span className="text-gray-400 font-normal">(부정 리뷰 즉시 알림)</span>
                  </label>
                  <input
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={email || "미입력 시 계정 이메일 사용"}
                  />
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            <div className="flex gap-3">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
                >
                  이전
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-600 text-white font-semibold py-3 rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
              >
                {loading ? "처리 중..." : step === 1 ? "다음" : "시작하기"}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-primary-600 font-medium hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
