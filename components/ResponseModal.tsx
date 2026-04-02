"use client"

import { useEffect, useState } from "react"
import { X, RefreshCw, Send, AlertTriangle } from "lucide-react"

interface ResponseModalProps {
  reviewId: string
  onClose: () => void
  onSuccess: () => void
}

export default function ResponseModal({ reviewId, onClose, onSuccess }: ResponseModalProps) {
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [review, setReview] = useState<any>(null)
  const [responseData, setResponseData] = useState<any>(null)
  const [draftContent, setDraftContent] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    loadData()
  }, [reviewId])

  async function loadData() {
    setLoading(true)
    // 리뷰 상세 조회
    const res = await fetch(`/api/reviews?review_id=${reviewId}`)
    // 기존 응답 확인 후 초안 생성
    await generateDraft()
    setLoading(false)
  }

  async function generateDraft() {
    setGenerating(true)
    setError("")
    try {
      const res = await fetch("/api/generate-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_id: reviewId }),
      })
      const json = await res.json()
      if (json.error) {
        setError(json.error)
      } else {
        setResponseData(json.data)
        setDraftContent(json.data?.draft_content || "")
      }
    } catch {
      setError("답변 생성 중 오류가 발생했습니다.")
    }
    setGenerating(false)
  }

  async function handlePublish() {
    if (!responseData || !draftContent.trim()) return
    setPublishing(true)
    setError("")
    try {
      const res = await fetch("/api/generate-response", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response_id: responseData.id,
          final_content: draftContent,
        }),
      })
      const json = await res.json()
      if (json.error) {
        setError(json.error)
      } else {
        onSuccess()
      }
    } catch {
      setError("답변 저장 중 오류가 발생했습니다.")
    }
    setPublishing(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">AI 답변 초안</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {loading || generating ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">
                {generating ? "Claude AI가 답변을 생성하고 있습니다..." : "로딩 중..."}
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-start gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-4">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* 답변 초안 편집 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    답변 초안 <span className="text-gray-400 font-normal">(수정 가능)</span>
                  </label>
                  <button
                    onClick={generateDraft}
                    disabled={generating}
                    className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    재생성
                  </button>
                </div>
                <textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm leading-relaxed resize-none"
                  placeholder="AI가 답변을 생성합니다..."
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-400">
                    내용을 직접 수정하거나 재생성할 수 있습니다.
                  </p>
                  <p className={`text-xs ${draftContent.length > 300 ? "text-orange-500" : "text-gray-400"}`}>
                    {draftContent.length}자
                  </p>
                </div>
              </div>

              {/* 의료광고법 안내 */}
              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-100 px-4 py-3 rounded-xl mb-6">
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-yellow-800 mb-0.5">의료광고법 준수 안내</p>
                  <p className="text-xs text-yellow-700">
                    게시 전 답변 내용이 의료광고법에 위반되지 않는지 반드시 확인하세요.
                    AI가 생성한 초안은 참고용이며, 최종 책임은 담당자에게 있습니다.
                  </p>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
                >
                  닫기
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing || !draftContent.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-3 rounded-xl hover:bg-primary-700 transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {publishing ? "저장 중..." : "답변 저장 완료"}
                </button>
              </div>
              <p className="text-xs text-center text-gray-400 mt-3">
                * 네이버·구글 플랫폼에 직접 게시는 별도로 진행하세요.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
