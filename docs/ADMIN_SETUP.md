# 관리자 계정 설정 가이드

## 개요
Place Log 시스템에서 관리자 권한은 `profiles` 테이블의 `role` 필드를 통해 관리됩니다.

## 설정 방법

### 방법 1: Supabase Dashboard (가장 쉬운 방법)

1. **Supabase Dashboard** 접속
2. **Table Editor** → `profiles` 테이블 선택
3. 관리자로 만들고 싶은 사용자 찾기
4. `role` 컬럼을 `'admin'`으로 변경
5. 저장

### 방법 2: SQL 쿼리 실행

Supabase SQL Editor에서 다음 쿼리 실행:

```sql
-- 특정 이메일을 관리자로 설정
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-admin@example.com';

-- 또는 사용자 ID로 설정
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'user-uuid-here';

-- 첫 번째 등록된 사용자를 관리자로 설정
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id 
  FROM profiles 
  ORDER BY created_at ASC 
  LIMIT 1
);
```

### 방법 3: 자동 설정 (마이그레이션)

프로젝트에 포함된 자동 설정 스크립트 사용:

```bash
# 자동 관리자 설정 마이그레이션 실행
supabase db push
```

## 관리자 권한

관리자 계정으로 로그인하면 다음 기능에 접근할 수 있습니다:

- ✅ **플레이스 추가**: 새로운 네이버 플레이스 등록
- ✅ **키워드 관리**: 검색 키워드 추가/수정/삭제
- ✅ **크롤링 결과**: 모든 사용자의 크롤링 데이터 조회
- ✅ **사용자 관리**: 사용자 역할 변경 (향후 기능)
- ✅ **마케팅 메모**: 작업 메모 작성/편집 (향후 기능)

## 확인 방법

관리자 설정이 완료되었는지 확인:

```sql
-- 현재 관리자 계정 확인
SELECT id, email, role, created_at 
FROM profiles 
WHERE role = 'admin';

-- 모든 사용자 역할 확인
SELECT id, email, role, created_at 
FROM profiles 
ORDER BY created_at DESC;
```

## 주의사항

- 관리자 계정은 신중하게 설정하세요
- 최소 1명의 관리자는 항상 유지해야 합니다
- 역할 변경 후 로그아웃 후 다시 로그인해야 권한이 적용됩니다

## 문제 해결

### 권한이 적용되지 않는 경우

1. 브라우저에서 로그아웃 후 다시 로그인
2. 브라우저 캐시 삭제
3. `profiles` 테이블에서 `role` 값 확인

### 관리자 메뉴가 보이지 않는 경우

1. 개발자 도구에서 네트워크 탭 확인
2. 콘솔에서 에러 메시지 확인
3. Supabase 연결 상태 확인