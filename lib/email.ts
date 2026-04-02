import { Resend } from "resend"
import type { Review, Hospital } from "./types"

// 빌드 타임 오류 방지를 위해 런타임에만 초기화
function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

const RISK_LABEL: Record<string, string> = {
  urgent: "🚨 긴급",
  caution: "⚠️ 주의",
  low: "ℹ️ 낮음",
  none: "✅ 없음",
}

const SENTIMENT_LABEL: Record<string, string> = {
  positive: "긍정",
  neutral: "중립",
  negative: "부정",
  dispute: "분쟁소지",
}

const PLATFORM_LABEL: Record<string, string> = {
  naver: "네이버 지도",
  google: "구글 지도",
  kakao: "카카오맵",
  manual: "직접입력",
}

export async function sendNegativeReviewAlert(
  review: Review,
  hospital: Hospital
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY가 설정되지 않아 이메일을 발송하지 않습니다.")
    return
  }

  const targetEmail = hospital.notification_email || process.env.NOTIFICATION_EMAIL
  if (!targetEmail) {
    console.warn("알림 이메일 주소가 설정되지 않았습니다.")
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://reviewguard-med.vercel.app"
  const dashboardUrl = `${appUrl}/dashboard/reviews`
  const riskLabel = RISK_LABEL[review.risk_level || "caution"] || "⚠️ 주의"
  const sentimentLabel = SENTIMENT_LABEL[review.sentiment || "negative"] || "부정"
  const platformLabel = PLATFORM_LABEL[review.platform] || review.platform

  const isUrgent = review.risk_level === "urgent"
  const subject = isUrgent
    ? `🚨 [긴급] ${hospital.name} - 즉시 대응 필요한 리뷰가 등록되었습니다`
    : `⚠️ [ReviewGuard Med] ${hospital.name} - 부정 리뷰 알림`

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb;">
  <div style="background: ${isUrgent ? "#dc2626" : "#0d9488"}; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">ReviewGuard Med</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">${hospital.name} 리뷰 알림</p>
  </div>

  <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: ${isUrgent ? "#fef2f2" : "#fffbeb"}; border-left: 4px solid ${isUrgent ? "#dc2626" : "#f59e0b"}; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
      <p style="margin: 0; font-weight: 600; color: ${isUrgent ? "#dc2626" : "#92400e"};">
        ${riskLabel} 위험도 | ${sentimentLabel} 리뷰
      </p>
      ${isUrgent ? '<p style="margin: 8px 0 0 0; color: #dc2626; font-size: 14px;">⚡ 6시간 이내 대응이 필요합니다. 법무 검토를 권장합니다.</p>' : ""}
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 100px;">플랫폼</td>
        <td style="padding: 8px 0; font-size: 14px;">${platformLabel}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">별점</td>
        <td style="padding: 8px 0; font-size: 14px;">${review.rating !== undefined ? "⭐".repeat(review.rating) + ` (${review.rating}점)` : "없음"}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">작성자</td>
        <td style="padding: 8px 0; font-size: 14px;">${review.author_name || "익명"}</td>
      </tr>
    </table>

    <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">리뷰 내용</p>
      <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #111827;">"${review.content}"</p>
    </div>

    ${review.ai_summary ? `
    <div style="background: #f0fdfa; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #0d9488; text-transform: uppercase; letter-spacing: 0.05em;">AI 요약</p>
      <p style="margin: 0; font-size: 14px; color: #134e4a;">${review.ai_summary}</p>
    </div>
    ` : ""}

    <div style="text-align: center;">
      <a href="${dashboardUrl}" style="display: inline-block; background: #0d9488; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        답변 초안 확인하기 →
      </a>
    </div>

    <p style="text-align: center; margin-top: 24px; font-size: 12px; color: #9ca3af;">
      ReviewGuard Med | 자동 발송 이메일입니다
    </p>
  </div>
</body>
</html>
`

  await getResend().emails.send({
    from: "ReviewGuard Med <noreply@reviewguard.co.kr>",
    to: [targetEmail],
    subject,
    html,
  })
}
