"use client"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"

interface AddReviewModalProps {
  hospitalId: string
  onClose: () => void
  onSuccess: () => void
}

export default function AddReviewModal({ hospitalId, onClose, onSuccess }: AddReviewModalProps) {
  const [platform, setPlatform] = useState("naver")
  const [authorName, setAuthorName] = useState("")
  const [rating, setRating] = useState<number>(3)
  const [content, setContent] = useState("")
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">리뷰 직접 입력</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">플랫폼</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
              >
                <option value="naver">네이버 지도</option>
                <option value="google">구글 지도</option>
                <option value="kakao">카카오맵</option>
                <option value="manual">직접 입력</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">별점</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-sm"
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>{"⭐".repeat(r)} ({r}점)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">작성자 (선택)</label>
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="익명"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">작성일</label>
              <input
                type="date"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">리뷰 내용 *</label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
              placeholder="리뷰 내용을 붙여넣거나 입력하세요..."
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition text-sm"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-3 rounded-xl hover:bg-primary-700 transition disabled:opacity-50 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI 분석 중...
                </>
              ) : (
                "리뷰 추가 + AI 분석"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
