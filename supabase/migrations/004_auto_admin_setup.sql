-- 첫 번째 사용자를 자동으로 관리자로 설정하는 함수
CREATE OR REPLACE FUNCTION set_first_user_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- 현재 사용자가 첫 번째 사용자인지 확인
  IF (SELECT COUNT(*) FROM profiles) = 1 THEN
    -- 첫 번째 사용자를 관리자로 설정
    NEW.role = 'admin';
  ELSE
    -- 기본값은 일반 사용자
    NEW.role = COALESCE(NEW.role, 'user');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (profiles 테이블에 새 행이 삽입될 때 실행)
CREATE OR REPLACE TRIGGER auto_set_first_admin
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_first_user_as_admin();

-- 기존 사용자가 있다면 첫 번째 사용자를 관리자로 설정
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM profiles WHERE role = 'admin') THEN
    -- 이미 관리자가 있으면 아무것도 하지 않음
    RAISE NOTICE 'Admin user already exists';
  ELSE
    -- 첫 번째 사용자를 관리자로 설정
    UPDATE profiles 
    SET role = 'admin' 
    WHERE id = (
      SELECT id 
      FROM profiles 
      ORDER BY created_at ASC 
      LIMIT 1
    );
    
    IF FOUND THEN
      RAISE NOTICE 'First user has been set as admin';
    ELSE
      RAISE NOTICE 'No users found to set as admin';
    END IF;
  END IF;
END $$;