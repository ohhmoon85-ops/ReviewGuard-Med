"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import ReviewCard from "@/components/ReviewCard"
import AddReviewModal from "@/components/AddReviewModal"
import ResponseModal from "@/components/ResponseModal"
import { Filter, Plus, RefreshCw } from "lucide-react"
import type { ReviewWithResponse, Sentiment, RiskLevel } from "@/lib/types"

const SENTIMENT_FILTERS: { label: string; value: string }[] = [
  { label: "전체", value: "" },
  { label: "긍정", value: "positive" },
  { label: "중립", value: "neutral" },
  { label: "부정", value: "negative" },
  { label: "분쟁소지", value: "dispute" },
]

const RISK_FILTERS: { label: string; value: string }[] = [
  { label: "전체 위험도", value: "" },
  { label: "없음", value: "none" },
  { label: "낮음", value: "low" },
  { label: "주의", value: "caution" },
  { label: "긴급", value: "urgent" },
]

export default function ReviewsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const [reviews, setReviews] = useState<ReviewWithResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hospital, setHospital] = useState<any>(null)

  const [sentimentFilter, setSentimentFilter] = useState(searchParams.get("sentiment") || "")
  const [riskFilter, setRiskFilter] = useState(searchParams.get("risk_level") || "")
  const [respondedFilter, setRespondedFilter] = useState(searchParams.get("is_responded") || "")

  const [showAddModal, setShowAddModal] = useState(searchParams.get("add") === "true")
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null)

  const fetchHospital = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("hospitals")
      .select("*")
      .eq("owner_id", user.id)
      .single()
    setHospital(data)
    return data
  }, [supabase])

  const fetchReviews = useCallback(async (currentPage = 1) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(currentPage), limit: "20" })
    if (hospital?.id) params.set("hospital_id", hospital.id)
    if (sentimentFilter) params.set("sentiment", sentimentFilter)
    if (riskFilter) params.set("risk_level", riskFilter)
    if (respondedFilter) params.set("is_responded", respondedFilter)

    const res = await fetch(`/api/reviews?${params}`)
    const json = await res.json()
    setReviews(json.data || [])
    setTotal(json.count || 0)
    setLoading(false)
  }, [hospital?.id, sentimentFilter, riskFilter, respondedFilter])

  useEffect(() => {
    fetchHospital()
  }, [fetchHospital])

  useEffect(() => {
    if (hospital) fetchReviews(page)
  }, [hospital, page, sentimentFilter, riskFilter, respondedFilter, fetchReviews])

  const handleReviewAdded = () => {
    setShowAddModal(false)
    fetchReviews(1)
  }

  const handleResponseSaved = () => {
    setSelectedReviewId(null)
    fetchReviews(page)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">리뷰 관리</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchReviews(page)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            title="새로고침"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition font-medium"
          >
            <Plus className="w-4 h-4" />
            리뷰 추가
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-gray-400" />

          {/* 감성 필터 */}
          <div className="flex gap-1">
            {SENTIMENT_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => { setSentimentFilter(f.value); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  sentimentFilter === f.value
                    ? "bg-primary-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200" />

          {/* 위험도 필터 */}
          <select
            value={riskFilter}
            onChange={(e) => { setRiskFilter(e.target.value); setPage(1) }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {RISK_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>

          {/* 답변 여부 필터 */}
          <select
            value={respondedFilter}
            onChange={(e) => { setRespondedFilter(e.target.value); setPage(1) }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">모든 답변 상태</option>
            <option value="false">미답변</option>
            <option value="true">답변 완료</option>
          </select>

          <span className="ml-auto text-sm text-gray-400">총 {total}건</span>
        </div>
      </div>

      {/* 리뷰 목록 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
          <p className="text-gray-400 mb-4">리뷰가 없습니다.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-primary-600 font-medium hover:underline"
          >
            첫 리뷰 추가하기 →
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onRespond={() => setSelectedReviewId(review.id)}
              />
            ))}
          </div>

          {/* 페이지네이션 */}
          {total > 20 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
              >
                이전
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                {page} / {Math.ceil(total / 20)}
              </span>
              <button
                disabled={page >= Math.ceil(total / 20)}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      {/* 리뷰 추가 모달 */}
      {showAddModal && hospital && (
        <AddReviewModal
          hospitalId={hospital.id}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleReviewAdded}
        />
      )}

      {/* 답변 생성 모달 */}
      {selectedReviewId && (
        <ResponseModal
          reviewId={selectedReviewId}
          onClose={() => setSelectedReviewId(null)}
          onSuccess={handleResponseSaved}
        />
      )}
    </div>
  )
}
