# 🚀 네이버 플레이스 크롤러 설정 가이드

## 📋 개요

Python 기반 네이버 플레이스 크롤러가 구축되었습니다. 이 가이드에 따라 설정하면 자동으로 하루 2회 (오전 11:20, 오후 1:50) 크롤링이 실행됩니다.

## 🔧 1단계: GitHub Secrets 설정

GitHub Repository > Settings > Secrets and variables > Actions에서 다음 secrets를 추가하세요:

### 필수 Secrets

```
SUPABASE_URL=https://dqpffuqzafbolchlhsqz.supabase.co
SUPABASE_SERVICE_KEY=[Supabase 서비스 키]
GITHUB_TOKEN=[GitHub Personal Access Token]
```

### Supabase 서비스 키 찾기
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택 > Settings > API
3. "service_role" 키 복사 (anon key가 아님!)

### GitHub 토큰 생성
1. GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
2. "Generate new token (classic)" 클릭
3. 권한 선택: `repo`, `workflow`, `actions`
4. 생성된 토큰 복사

## 🐍 2단계: 로컬 Python 환경 설정 (선택사항)

로컬에서 테스트하려면:

```bash
# Python 3.11+ 설치 확인
python --version

# 의존성 설치
cd python-crawler
pip install -r requirements.txt

# 환경변수 설정
# .env 파일에 SUPABASE_SERVICE_KEY 추가

# 테스트 실행
python test_crawler.py
```

## 🎯 3단계: 관리자 패널에서 플레이스 등록

1. `/admin/places`에서 플레이스 등록
2. 키워드, URL, 이름 입력
3. `is_active = true` 상태 확인

## 🤖 4단계: 자동 크롤링 확인

### 스케줄
- **오전 11:20 (KST)**: GitHub Actions 자동 실행
- **오후 1:50 (KST)**: GitHub Actions 자동 실행

### 수동 실행
- `/admin/crawler` 페이지에서 "지금 실행" 버튼 클릭
- GitHub Actions에서 workflow 직접 실행

## 🔍 5단계: 결과 확인

1. **대시보드**: `/dashboard`에서 크롤링 결과 확인
2. **데이터베이스**: `crawler_results` 테이블에 저장됨
3. **GitHub Actions**: Actions 탭에서 실행 로그 확인

## 🚨 문제해결

### "Failed to fetch keywords" 에러
```bash
# Supabase 연결 확인
# 1. .env.local 파일의 URL/키 확인
# 2. 관리자 권한 확인
# 3. 데이터베이스 테이블 존재 확인
```

### 크롤링 실패
```bash
이유:
1. GitHub Secrets 미설정
2. Supabase 서비스 키 오류
3. 네이버 API 구조 변경
4. tracked_places 테이블 비어있음
```

### 네이버 차단 대응
```python
# crawler.py에서 요청 간격 조정
time.sleep(random.uniform(3, 8))  # 3-8초 랜덤 대기
```

## 📊 데이터 구조

### crawler_results 테이블
```sql
- tracked_place_id: 추적 플레이스 ID
- keyword: 검색 키워드
- place_name: 플레이스 이름
- rank: 검색 순위 (1-20)
- review_count: 리뷰 수
- crawled_at: 크롤링 시각
```

### tracked_places 테이블
```sql
- search_keyword: 크롤링할 키워드
- place_url: 네이버 플레이스 URL
- place_name: 플레이스 이름
- is_active: 활성화 상태 (true/false)
```

## ✅ 다음 단계

1. ✅ **GitHub Secrets 설정**
2. ✅ **테스트 플레이스 등록**
3. ✅ **수동 크롤링 실행**
4. ✅ **결과 확인**
5. ✅ **스케줄 크롤링 확인**

---

## 🎉 완료!

모든 설정이 완료되면 자동으로 하루 2회 크롤링이 실행되며, 결과는 대시보드에서 실시간으로 확인할 수 있습니다.