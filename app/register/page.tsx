"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Shield } from "lucide-react"
import { createClient } from "@/lib/supabase-client"
import { SPECIALTY_LIST } from "@/lib/types"

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // 계정 정보
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // 병원 정보
  const [hospitalName, setHospitalName] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [notificationEmail, setNotificationEmail] = useState("")

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    // 1. Supabase 계정 생성
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError("계정 생성에 실패했습니다.")
      setLoading(false)
      return
    }

    // 2. 병원 정보 저장
    const { error: hospitalError } = await supabase.from("hospitals").insert({
      owner_id: data.user.id,
      name: hospitalName,
      specialty,
      notification_email: notificationEmail || email,
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
          {/* 단계 표시 */}
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
                    onChange={(e) => setHospitalName(e.target.value)}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    알림 이메일 <span className="text-gray-400 font-normal">(부정 리뷰 즉시 알림)</span>
                  </label>
                  <input
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={email || "알림 받을 이메일 (미입력 시 계정 이메일 사용)"}
                  />
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
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
