"use client"

import { useState } from "react"
import { X, Loader2, Sparkles, ClipboardPaste, PenLine, CheckCircle, AlertCircle } from "lucide-react"

interface AddReviewModalProps {
  hospitalId: string
  onClose: () => void
  onSuccess: () => void
}

type Mode = "paste" | "manual"

const PLATFORM_OPTIONS = [
  { value: "naver", label: "네이버 지도" },
  { value: "kakao", label: "카카오맵" },
  { value: "manual", label: "기타 (직접 입력)" },
]

export default function AddReviewModal({ hospitalId, onClose, onSuccess }: AddReviewModalProps) {
  const [mode, setMode] = useState<Mode>("paste")

  // 스마트 붙여넣기 상태
  const [pasteText, setPasteText] = useState("")
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<any>(null)
  const [parseError, setParseError] = useState("")

  // 직접 입력 / 최종 제출 상태
  const [platform, setPlatform] = useState("naver")
  const [authorName, setAuthorName] = useState("")
  const [rating, setRating] = useState<number>(3)
  const [content, setContent] = useState("")
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().split("T")[0])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // ── AI 파싱 ──────────────────────────────────────────────
  async function handleParse() {
    if (!pasteText.trim()) return
    setParsing(true)
    setParsed(null)
    setParseError("")

    const res = await fetch("/api/parse-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: pasteText, platform_hint: platform }),
    })
    const json = await res.json()
    setParsing(false)

    if (json.error) {
      setParseError(json.error)
    } else {
      const p = json.parsed
      setParsed(p)
      // 파싱 결과로 폼 자동 채우기
      if (p.platform) setPlatform(p.platform)
      if (p.author_name) setAuthorName(p.author_name)
      if (p.rating) setRating(p.rating)
      if (p.content) setContent(p.content)
      if (p.review_date) setReviewDate(p.review_date)
    }
  }

  // ── 최종 저장 ────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setError("")

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hospital_id: hospitalId,
        platform,
        author_name: authorName || undefined,
        rating,
        content: content.trim(),
        review_date: reviewDate,
      }),
    })

    const json = await res.json()
    setLoading(false)

    if (json.error) {
      setError(json.error)
    } else {
      onSuccess()
    }
  }

  function resetPaste() {
    setPasteText("")
    setParsed(null)
    setParseError("")
    setContent("")
    setAuthorName("")
    setRating(3)
    setReviewDate(new Date().toISOString().split("T")[0])
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col">

        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">리뷰 추가</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 모드 탭 */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => { setMode("paste"); resetPaste() }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition ${
              mode === "paste" ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            스마트 붙여넣기
            <span className="bg-primary-100 text-primary-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">AI</span>
          </button>
          <button
            onClick={() => { setMode("manual"); resetPaste() }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition ${
              mode === "manual" ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <PenLine className="w-4 h-4" />
            직접 입력
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto">

          {/* ── 스마트 붙여넣기 모드 ── */}
          {mode === "paste" && (
            <div className="p-5 space-y-4">
              {/* 안내 */}
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-700 font-semibold mb-1">📋 사용 방법</p>
                <p className="text-xs text-blue-600 leading-relaxed">
                  네이버/카카오 리뷰를 통째로 복사해서 아래에 붙여넣으세요.<br />
                  AI가 작성자, 별점, 내용을 자동으로 추출합니다.
                </p>
              </div>

              {!parsed ? (
                <>
                  {/* 플랫폼 힌트 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">플랫폼</label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
                    >
                      {PLATFORM_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* 붙여넣기 영역 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">리뷰 텍스트 붙여넣기 *</label>
                    <textarea
                      value={pasteText}
                      onChange={(e) => { setPasteText(e.target.value); setParseError("") }}
                      rows={6}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                      placeholder={`예시 (네이버 리뷰 알림 이메일 또는 앱에서 복사):\n\n김OO님이 리뷰를 남겼습니다.\n별점: ★★★★☆\n친절하고 설명을 잘 해주셨어요. 대기 시간이 조금 길었지만 만족합니다.\n2026.04.02`}
                    />
                  </div>

                  {parseError && (
                    <div className="flex items-start gap-2 bg-red-50 px-3 py-2.5 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700">{parseError}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleParse}
                    disabled={!pasteText.trim() || parsing}
                    className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-3 rounded-xl hover:bg-primary-700 transition disabled:opacity-50 text-sm"
                  >
                    {parsing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> AI 분석 중...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> AI로 자동 추출</>
                    )}
                  </button>
                </>
              ) : (
                /* 파싱 결과 확인 + 수정 */
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-xl">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <p className="text-xs text-green-700 font-medium">AI가 정보를 추출했습니다. 확인 후 저장하세요.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">플랫폼</label>
                      <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                        {PLATFORM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">별점</label>
                      <select value={rating} onChange={(e) => setRating(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                        {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{"⭐".repeat(r)} ({r}점)</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">작성자</label>
                      <input value={authorName} onChange={(e) => setAuthorName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="익명" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">작성일</label>
                      <input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">리뷰 내용 *</label>
                    <textarea value={content} onChange={(e) => setContent(e.target.value)}
                      rows={4} required
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-700 text-xs px-3 py-2.5 rounded-xl">{error}</div>
                  )}

                  <div className="flex gap-3">
                    <button type="button" onClick={resetPaste}
                      className="flex-1 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm">
                      다시 입력
                    </button>
                    <button type="submit" disabled={loading || !content.trim()}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-2.5 rounded-xl hover:bg-primary-700 transition disabled:opacity-50 text-sm">
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> 저장 중...</> : "AI 분석 후 저장"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ── 직접 입력 모드 ── */}
          {mode === "manual" && (
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">플랫폼</label>
                  <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm">
                    {PLATFORM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">별점</label>
                  <select value={rating} onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm">
                    {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{"⭐".repeat(r)} ({r}점)</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">작성자 (선택)</label>
                  <input value={authorName} onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    placeholder="익명" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">작성일</label>
                  <input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">리뷰 내용 *</label>
                <textarea required value={content} onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                  placeholder="리뷰 내용을 입력하세요..." />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition text-sm">
                  취소
                </button>
                <button type="submit" disabled={loading || !content.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-3 rounded-xl hover:bg-primary-700 transition disabled:opacity-50 text-sm">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> AI 분석 중...</> : "리뷰 추가 + AI 분석"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
