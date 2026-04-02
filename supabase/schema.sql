-- ReviewGuard Med - Supabase 스키마
-- Supabase SQL Editor에서 실행하세요

-- 병원 정보
create table hospitals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  specialty text not null, -- 피부과, 치과, 한의원, 성형외과, 정형외과, 기타
  naver_place_id text,
  google_place_id text,
  kakao_place_id text,
  notification_email text,
  tone text default '전문적이고 친근한', -- 병원 브랜드 톤
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 리뷰
create table reviews (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references hospitals(id) on delete cascade not null,
  platform text not null, -- naver, google, kakao, manual
  external_id text, -- 플랫폼 내 고유 ID (중복 방지)
  author_name text,
  rating integer check (rating >= 1 and rating <= 5),
  content text not null,
  -- AI 분석 결과
  sentiment text, -- positive, neutral, negative, dispute
  risk_level text, -- none, low, caution, urgent
  ai_summary text,
  keywords text[], -- 주요 키워드
  -- 상태
  is_responded boolean default false,
  is_notified boolean default false,
  review_date timestamptz,
  detected_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 답변 초안 및 게시 이력
create table responses (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references reviews(id) on delete cascade not null,
  draft_content text not null,
  final_content text,
  published_at timestamptz,
  published_by uuid references auth.users(id),
  platform_response_id text, -- 플랫폼에 게시된 답변 ID
  created_at timestamptz default now()
);

-- 알림 이력
create table notifications (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references reviews(id) on delete cascade not null,
  hospital_id uuid references hospitals(id) on delete cascade not null,
  channel text not null, -- email, kakao
  sent_at timestamptz default now(),
  success boolean default true
);

-- RLS (Row Level Security) 활성화
alter table hospitals enable row level security;
alter table reviews enable row level security;
alter table responses enable row level security;
alter table notifications enable row level security;

-- RLS 정책: 본인 병원 데이터만 접근 가능
create policy "hospitals_owner_policy" on hospitals
  for all using (owner_id = auth.uid());

create policy "reviews_hospital_policy" on reviews
  for all using (
    hospital_id in (select id from hospitals where owner_id = auth.uid())
  );

create policy "responses_hospital_policy" on responses
  for all using (
    review_id in (
      select r.id from reviews r
      join hospitals h on r.hospital_id = h.id
      where h.owner_id = auth.uid()
    )
  );

create policy "notifications_hospital_policy" on notifications
  for all using (
    hospital_id in (select id from hospitals where owner_id = auth.uid())
  );

-- 인덱스
create index reviews_hospital_id_idx on reviews(hospital_id);
create index reviews_sentiment_idx on reviews(sentiment);
create index reviews_risk_level_idx on reviews(risk_level);
create index reviews_is_responded_idx on reviews(is_responded);
create index reviews_detected_at_idx on reviews(detected_at desc);
create index reviews_external_id_idx on reviews(external_id);

-- updated_at 자동 갱신 함수
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger hospitals_updated_at
  before update on hospitals
  for each row execute function update_updated_at();

-- 서비스 역할용 정책 (Cron Job에서 사용)
create policy "service_role_reviews" on reviews
  for all using (auth.role() = 'service_role');

create policy "service_role_hospitals" on hospitals
  for all using (auth.role() = 'service_role');

create policy "service_role_notifications" on notifications
  for all using (auth.role() = 'service_role');
