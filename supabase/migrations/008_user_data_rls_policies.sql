-- 사용자별 데이터 권한 관리를 위한 RLS 정책

-- 1. tracked_places 테이블 RLS 활성화
ALTER TABLE tracked_places ENABLE ROW LEVEL SECURITY;

-- 2. tracked_places 정책: 사용자는 자신의 플레이스만 조회 가능
DROP POLICY IF EXISTS "Users can view own tracked places" ON tracked_places;
CREATE POLICY "Users can view own tracked places" ON tracked_places
    FOR SELECT
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 3. tracked_places 정책: 사용자는 자신의 플레이스만 추가 가능
DROP POLICY IF EXISTS "Users can insert own tracked places" ON tracked_places;
CREATE POLICY "Users can insert own tracked places" ON tracked_places
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 4. tracked_places 정책: 사용자는 자신의 플레이스만 수정 가능
DROP POLICY IF EXISTS "Users can update own tracked places" ON tracked_places;
CREATE POLICY "Users can update own tracked places" ON tracked_places
    FOR UPDATE
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 5. tracked_places 정책: 사용자는 자신의 플레이스만 삭제 가능
DROP POLICY IF EXISTS "Users can delete own tracked places" ON tracked_places;
CREATE POLICY "Users can delete own tracked places" ON tracked_places
    FOR DELETE
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 6. rankings 테이블 RLS 활성화
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

-- 7. rankings 정책: tracked_place의 소유자만 해당 순위 조회 가능
DROP POLICY IF EXISTS "Users can view rankings for own places" ON rankings;
CREATE POLICY "Users can view rankings for own places" ON rankings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tracked_places 
            WHERE tracked_places.id = rankings.tracked_place_id 
            AND (
                tracked_places.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role = 'admin'
                )
            )
        )
    );

-- 8. crawler_results 테이블 RLS 활성화
ALTER TABLE crawler_results ENABLE ROW LEVEL SECURITY;

-- 9. crawler_results 정책: tracked_place의 소유자만 해당 크롤링 결과 조회 가능
DROP POLICY IF EXISTS "Users can view crawler results for own places" ON crawler_results;
CREATE POLICY "Users can view crawler results for own places" ON crawler_results
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tracked_places 
            WHERE tracked_places.id = crawler_results.tracked_place_id 
            AND (
                tracked_places.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role = 'admin'
                )
            )
        )
    );

-- 10. 관리자 전용: 시스템 레벨 작업은 서비스 키로만 가능
-- (INSERT, UPDATE, DELETE는 서비스 역할로만 가능하도록 정책 없음)

-- 11. 권한 검증을 위한 함수
CREATE OR REPLACE FUNCTION check_user_place_access(place_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tracked_places 
        WHERE id = place_id 
        AND tracked_places.user_id = user_id
    ) OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = user_id 
        AND profiles.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. 권한 함수에 대한 접근 권한
GRANT EXECUTE ON FUNCTION check_user_place_access TO authenticated;