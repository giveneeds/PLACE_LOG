-- 90일 이상 된 rankings 데이터를 자동으로 삭제하는 기능

-- 1. 오래된 순위 데이터 삭제 함수 생성
CREATE OR REPLACE FUNCTION delete_old_rankings()
RETURNS void AS $$
BEGIN
  DELETE FROM rankings
  WHERE checked_at < NOW() - INTERVAL '90 days';
  
  -- crawler_results 테이블도 같이 정리
  DELETE FROM crawler_results
  WHERE crawled_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 2. 매일 자정에 실행되는 pg_cron 작업 추가 (Supabase가 pg_cron 지원하는 경우)
-- 주의: Supabase 대시보드에서 pg_cron extension을 먼저 활성화해야 함
-- SELECT cron.schedule('delete-old-rankings', '0 0 * * *', 'SELECT delete_old_rankings();');

-- 3. 인덱스 추가 (삭제 성능 향상)
CREATE INDEX IF NOT EXISTS idx_rankings_checked_at ON rankings(checked_at);
CREATE INDEX IF NOT EXISTS idx_crawler_results_crawled_at ON crawler_results(crawled_at);

-- 4. 수동으로 실행할 수 있도록 권한 부여
GRANT EXECUTE ON FUNCTION delete_old_rankings() TO authenticated;

-- 5. 초기 정리 실행 (기존 90일 이상 데이터 삭제)
SELECT delete_old_rankings();