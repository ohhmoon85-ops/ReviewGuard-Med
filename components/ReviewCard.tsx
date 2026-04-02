"use client"

import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { MessageSquarePlus, CheckCircle, AlertTriangle, Clock } from "lucide-react"
import type { ReviewWithResponse } from "@/lib/types"
import {
  RISK_LEVEL_LABELS,
  SENTIMENT_LABELS,
  PLATFORM_LABELS,
} from "@/lib/types"

interface ReviewCardProps {
  review: ReviewWithResponse
  onRespond: () => void
}

const RISK_COLORS = {
  urgent: "bg-red-100 text-red-800 border-red-200",
  caution: "bg-orange-100 text-orange-800 border-orange-200",
  low: "bg-yellow-100 text-yellow-800 border-yellow-200",
  none: "bg-gray-100 text-gray-700 border-gray-200",
}

const SENTIMENT_COLORS = {
  positive: "bg-green-100 text-green-800",
  neutral: "bg-yellow-100 text-yellow-800",
  negative: "bg-orange-100 text-orange-800",
  dispute: "bg-red-100 text-red-800",
}

const RISK_ICONS = {
  urgent: "🚨",
  caution: "⚠️",
  low: "ℹ️",
  none: "✅",
}

export default function ReviewCard({ review, onRespond }: ReviewCardProps) {
  const riskLevel = review.risk_level || "low"
  const sentiment = review.sentiment || "neutral"
  const publishedResponse = review.responses?.find((r) => r.published_at)
  const draftResponse = review.responses?.find((r) => !r.published_at)

  return (
    <div
      className={`bg-white rounded-2xl p-5 border ${
        riskLevel === "urgent"
          ? "border-red-200 ring-1 ring-red-100"
          : "border-gray-100"
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* 위험도 배지 */}
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${RISK_COLORS[riskLevel as keyof typeof RISK_COLORS]}`}
          >
            {RISK_ICONS[riskLevel as keyof typeof RISK_ICONS]}
            {RISK_LEVEL_LABELS[riskLevel as keyof typeof RISK_LEVEL_LABELS]}
          </span>

          {/* 감성 배지 */}
          <span
            className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${SENTIMENT_COLORS[sentiment as keyof typeof SENTIMENT_COLORS]}`}
          >
            {SENTIMENT_LABELS[sentiment as keyof typeof SENTIMENT_LABELS]}
          </span>

          {/* 플랫폼 */}
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {PLATFORM_LABELS[review.platform] || review.platform}
          </span>

          {/* 별점 */}
          {review.rating && (
            <span className="text-xs text-yellow-600">
              {"⭐".repeat(review.rating)} ({review.rating}점)
            </span>
          )}
        </div>

        {/* 답변 상태 */}
        <div className="flex-shrink-0">
          {review.is_responded ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
              답변완료
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              미답변
            </span>
          )}
        </div>
      </div>

      {/* 작성자 + 날짜 */}
      <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
        <span className="font-medium text-gray-700">{review.author_name || "익명"}</span>
        <span>·</span>
        <span>
          {formatDistanceToNow(new Date(review.detected_at), {
            addSuffix: true,
            locale: ko,
          })}
        </span>
      </div>

      {/* 리뷰 내용 */}
      <p className="text-gray-800 text-sm leading-relaxed mb-3">{review.content}</p>

      {/* AI 요약 + 키워드 */}
      {review.ai_summary && (
        <div className="bg-primary-50 rounded-xl px-3 py-2 mb-3">
          <p className="text-xs text-primary-700">
            <span className="font-semibold">AI 요약:</span> {review.ai_summary}
          </p>
          {review.keywords && review.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {review.keywords.map((kw) => (
                <span key={kw} className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 게시된 답변 미리보기 */}
      {publishedResponse && (
        <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 mb-3">
          <p className="text-xs text-green-700 font-semibold mb-1">게시된 답변</p>
          <p className="text-xs text-green-800 line-clamp-2">
            {publishedResponse.final_content || publishedResponse.draft_content}
          </p>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={onRespond}
          className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition ${
            review.is_responded
              ? "text-gray-600 border border-gray-200 hover:bg-gray-50"
              : riskLevel === "urgent"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-primary-600 text-white hover:bg-primary-700"
          }`}
        >
          <MessageSquarePlus className="w-4 h-4" />
          {review.is_responded
            ? "답변 수정"
            : draftResponse
              ? "초안 보기"
              : "AI 답변 생성"}
        </button>
      </div>
    </div>
  )
}
