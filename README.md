# ReviewGuard Med

병원·클리닉 리뷰 자동 모니터링 및 AI 답변 생성 서비스

## 기술 스택

- **Frontend**: Next.js 14 + Tailwind CSS → Vercel 배포
- **Database + Auth**: Supabase (무료 티어)
- **AI**: Claude API (기본 haiku, 업그레이드 가능)
- **이메일 알림**: Resend (무료 티어: 월 3,000건)
- **배포**: Vercel (무료 티어)

**초기 6개월 인프라 비용: ~₩0** (모두 무료 티어 사용)

---

## 배포 순서

### 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) → New Project 생성
2. **SQL Editor** → `supabase/schema.sql` 전체 내용 붙여넣기 → Run
3. **Project Settings → API**에서 키 복사:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 2. Anthropic API 키 발급

1. [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key
2. `ANTHROPIC_API_KEY` 값 복사
3. 비용 절감: 기본 `claude-haiku-4-5-20251001` 사용 (월 50건 기준 약 ₩1,000 미만)

### 3. Resend 이메일 설정 (선택 사항)

1. [resend.com](https://resend.com) → 무료 가입 → API Keys
2. `RESEND_API_KEY` 값 복사
3. `lib/email.ts`의 `from` 주소를 본인 도메인으로 변경 (또는 `onboarding@resend.dev` 유지)

### 4. GitHub 저장소 생성

```bash
cd "ReviewGuard Med"
git init
git add .
git commit -m "Initial commit: ReviewGuard Med MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/reviewguard-med.git
git push -u origin main
```

### 5. Vercel 배포

1. [vercel.com](https://vercel.com) → New Project → GitHub 저장소 연결
2. **Environment Variables** 설정 (아래 목록 참고)
3. Deploy 클릭

### 6. 환경 변수 (Vercel → Settings → Environment Variables)

| 변수명 | 값 | 필수 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `ANTHROPIC_API_KEY` | Claude API key | ✅ |
| `CLAUDE_MODEL` | `claude-haiku-4-5-20251001` | 선택 |
| `RESEND_API_KEY` | Resend API key | 선택 |
| `NOTIFICATION_EMAIL` | 기본 알림 이메일 | 선택 |
| `CRON_SECRET` | 임의 문자열 (예: `abc123xyz`) | ✅ |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | 선택 |
| `GOOGLE_PLACES_API_KEY` | Google Places API key | 선택 |

---

## 로컬 개발

```bash
npm install
cp .env.local.example .env.local
# .env.local에 값 채우기
npm run dev
```

---

## 기능 현황 (Phase 1 MVP)

| 기능 | 상태 |
|------|------|
| 회원가입 / 로그인 (Supabase Auth) | ✅ |
| 병원 정보 등록 | ✅ |
| 리뷰 수동 입력 + Claude AI 분석 | ✅ |
| 위험도 3단계 분류 (낮음/주의/긴급) | ✅ |
| 과별 맞춤 AI 답변 초안 생성 | ✅ |
| 부정 리뷰 이메일 알림 (Resend) | ✅ |
| 평판 관리 대시보드 | ✅ |
| Google Places API 자동 수집 (Cron) | ✅ |
| 네이버/카카오 자동 수집 | 🔜 Phase 2 |
| 원클릭 플랫폼 게시 | 🔜 Phase 3 |
| 월간 PDF 리포트 | 🔜 Phase 4 |

---

## 비용 계획

### 무료 티어 한도

| 서비스 | 무료 한도 | 초과 시 |
|--------|-----------|---------|
| Vercel | 무제한 (hobby) | Pro $20/월 |
| Supabase | DB 500MB, MAU 50,000 | Pro $25/월 |
| Resend | 이메일 3,000건/월 | $20/월 |
| Claude API | 없음 (종량제) | haiku: ~₩1,000/월 (50건) |

### Claude API 비용 예시
- haiku (기본): 입력 $0.80/MTok, 출력 $4/MTok
- 리뷰 분석 1건 + 답변 생성 1건 ≈ $0.002 (약 ₩3원)
- 월 100건 처리 시 ≈ ₩300~500

### 유료 구독자 확보 후
- 구독자 50개 (스타터 플랜): MRR ₩145만
- Claude API 비용 (50개 병원 × 50건): ₩18만
- 인프라: Vercel Pro + Supabase Pro ≈ ₩6만
- **순이익: ₩121만 (1개월차)**

---

## Google Place ID 찾는 법

1. [Google Maps](https://maps.google.com) 에서 병원 검색
2. URL에서 `place/` 뒤의 텍스트 또는
3. [Place ID Finder](https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder) 사용
