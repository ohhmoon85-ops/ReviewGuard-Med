import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ReviewGuard Med | 병원 리뷰 자동 관리",
  description: "AI 기반 의료기관 온라인 평판 자동화 관리 플랫폼. 네이버·구글 리뷰를 자동 모니터링하고 의료광고법에 맞는 답변을 즉시 생성합니다.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
