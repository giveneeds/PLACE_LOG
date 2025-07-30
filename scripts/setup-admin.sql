-- 관리자 계정 설정 스크립트
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. 특정 이메일을 관리자로 설정
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@example.com';

-- 2. 첫 번째 등록된 사용자를 관리자로 설정
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id 
  FROM profiles 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- 3. 현재 관리자 계정 확인
SELECT id, email, role, created_at 
FROM profiles 
WHERE role = 'admin';

-- 4. 모든 사용자 역할 확인
SELECT id, email, role, created_at 
FROM profiles 
ORDER BY created_at DESC;