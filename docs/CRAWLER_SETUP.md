# 크롤러 설정 가이드

## 크롤링 스케줄

네이버 플레이스 데이터는 하루에 2번 자동으로 크롤링됩니다:
- **오전 11시 20분** (KST)
- **오후 1시 50분** (KST)

## 시간대 변환

Supabase의 cron은 UTC 시간을 사용하므로, 한국 시간(KST)을 UTC로 변환해야 합니다:
- 11:20 AM KST = 2:20 AM UTC
- 1:50 PM KST = 4:50 AM UTC

## Cron 표현식

```
20 2 * * *   # 매일 오전 2시 20분 UTC (오전 11시 20분 KST)
50 4 * * *   # 매일 오전 4시 50분 UTC (오후 1시 50분 KST)
```

## 설정 방법

### 1. Supabase Dashboard에서 설정

1. Supabase Dashboard > Database > Extensions로 이동
2. `pg_cron` extension 활성화
3. SQL Editor에서 위의 cron job SQL 실행

### 2. SQL로 직접 설정

```sql
-- 오전 크롤링 스케줄
SELECT cron.schedule(
  'crawler-morning',
  '20 2 * * *',
  $$
  SELECT net.http_post(
    'https://your-project.supabase.co/functions/v1/crawler-scheduler',
    '{}',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);

-- 오후 크롤링 스케줄
SELECT cron.schedule(
  'crawler-afternoon',
  '50 4 * * *',
  $$
  SELECT net.http_post(
    'https://your-project.supabase.co/functions/v1/crawler-scheduler',
    '{}',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

## 스케줄 확인

현재 설정된 크롤링 스케줄 확인:
```sql
SELECT * FROM cron.job;
```

## 스케줄 변경

스케줄을 변경하려면 먼저 기존 스케줄을 제거하고 새로 생성:
```sql
-- 기존 스케줄 제거
SELECT cron.unschedule('crawler-morning');
SELECT cron.unschedule('crawler-afternoon');

-- 새 스케줄 생성
-- (위의 SQL 다시 실행)
```

## 모니터링

- Supabase Dashboard에서 Edge Function 로그 확인
- crawler_results 테이블에서 크롤링 결과 확인
- Webhook 알림으로 크롤링 상태 모니터링