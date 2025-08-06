# 🌐 Bright Data 프록시를 활용한 네이버 플레이스 크롤링 설정 가이드

## 📋 개요

Bright Data의 전용 프록시 풀을 활용하여 네이버 플레이스 순위 크롤링의 안정성과 성능을 대폭 향상시킵니다.

## ✨ 주요 특징

- **프록시 로테이션**: 자동 프록시 전환으로 IP 차단 방지
- **Fallback 시스템**: 프록시 실패 시 직접 요청으로 자동 전환
- **실시간 모니터링**: 프록시 사용량 및 성능 추적
- **한국 IP 지원**: 국내 IP를 통한 자연스러운 크롤링
- **세션 관리**: 세션 ID를 통한 지속적인 연결 유지

## 🔧 1단계: Bright Data 계정 설정

### 1.1 Bright Data 계정 생성
1. [Bright Data](https://brightdata.com) 방문
2. 계정 생성 및 로그인
3. Dashboard → Proxy & Scraping Infrastructure → Proxy Products

### 1.2 Data Center Proxy 설정
1. **Create Proxy** 클릭
2. **Data Center** 선택
3. 설정:
   - **Country**: Korea (KR) 선택
   - **Session type**: Session
   - **Pool**: Shared pool (비용 효율적)

### 1.3 프록시 정보 확인
생성된 프록시에서 다음 정보를 메모해주세요:
- **Endpoint**: `brd-customer-hl_XXXXXX-zone-datacenter_proxyXX:22225`
- **Username**: `brd-customer-hl_XXXXXX-zone-datacenter_proxyXX`
- **Password**: 개인 비밀번호

## 🔑 2단계: GitHub Secrets 설정

GitHub Repository → Settings → Secrets and variables → Actions에서 추가:

### 필수 Secrets (API 키 방식 - 권장)
```
# 기존 Supabase 설정
SUPABASE_URL=https://dqpffuqzafbolchlhsqz.supabase.co
SUPABASE_SERVICE_KEY=[Supabase 서비스 키]

# Bright Data API 키 (프록시 자동 구성)
BRIGHT_DATA_API_KEY=[Bright Data API 키]
```

### 선택사항 Secrets (수동 프록시 설정)
```
# Bright Data 프록시 수동 설정 (API 키가 없을 때)
BRIGHT_DATA_ENDPOINT=brd-customer-hl_XXXXXX-zone-datacenter_proxy1:22225
BRIGHT_DATA_USERNAME=brd-customer-hl_XXXXXX-zone-datacenter_proxy1
BRIGHT_DATA_PASSWORD=[프록시 비밀번호]
BRIGHT_DATA_SESSION_ID=session_1
BRIGHT_DATA_COUNTRY=KR
```

### 추가 Secrets (다중 프록시 사용 시)
```
# 2번째 프록시
BRIGHT_DATA_ENDPOINT_1=brd-customer-hl_XXXXXX-zone-datacenter_proxy1:22225
BRIGHT_DATA_USERNAME_1=brd-customer-hl_XXXXXX-zone-datacenter_proxy1
BRIGHT_DATA_PASSWORD_1=[프록시 비밀번호 1]
BRIGHT_DATA_SESSION_ID_1=session_1
BRIGHT_DATA_COUNTRY_1=KR

# 3번째 프록시
BRIGHT_DATA_ENDPOINT_2=brd-customer-hl_XXXXXX-zone-datacenter_proxy2:22225
BRIGHT_DATA_USERNAME_2=brd-customer-hl_XXXXXX-zone-datacenter_proxy2
BRIGHT_DATA_PASSWORD_2=[프록시 비밀번호 2]
BRIGHT_DATA_SESSION_ID_2=session_2
BRIGHT_DATA_COUNTRY_2=KR
```

## 🐍 3단계: 로컬 환경 설정

### 3.1 환경변수 파일 생성
```bash
cd python-crawler
cp .env.example .env
```

### 3.2 .env 파일 편집

#### 방법 1: API 키 사용 (권장)
```bash
# Bright Data API 키
BRIGHT_DATA_API_KEY=e3c12c28e3fb28940ef0696d2ce61082a3d2a1bc82649dc19d898778dec42656

# 프록시 사용 활성화
USE_BRIGHT_DATA_PROXY=true
```

#### 방법 2: 수동 프록시 설정
```bash
# Bright Data 프록시 수동 설정
BRIGHT_DATA_ENDPOINT=brd-customer-hl_XXXXXX-zone-datacenter_proxy1:22225
BRIGHT_DATA_USERNAME=brd-customer-hl_XXXXXX-zone-datacenter_proxy1
BRIGHT_DATA_PASSWORD=[실제 비밀번호]
BRIGHT_DATA_SESSION_ID=session_1
BRIGHT_DATA_COUNTRY=KR

# 프록시 사용 활성화
USE_BRIGHT_DATA_PROXY=true
```

### 3.3 의존성 설치
```bash
pip install -r requirements_proxy.txt
```

## 🚀 4단계: 테스트 실행

### 4.1 프록시 연결 테스트

#### API 키 테스트
```bash
# Bright Data API 연결 테스트
python test_bright_data_api.py
```

#### 직접 프록시 테스트
```bash
python -c "
from bright_data_proxy_manager import create_bright_data_proxy_manager
manager = create_bright_data_proxy_manager()
response, proxy = manager.make_request('https://httpbin.org/ip')
print(f'Response: {response.json()}')
print(f'Used proxy: {proxy.endpoint}')
"
```

### 4.2 네이버 크롤링 테스트
```bash
# 테스트 모드로 실행
CRAWLER_MODE=test python enhanced_naver_crawler.py
```

### 4.3 전체 크롤링 테스트
```bash
# 실제 모드로 실행
CRAWLER_MODE=tracked python enhanced_naver_crawler.py
```

## 📊 5단계: 모니터링 및 로깅

### 5.1 실시간 모니터링
크롤링 실행 시 자동으로 다음 정보가 로깅됩니다:
- 각 프록시별 요청 성공/실패율
- 평균 응답 시간
- 에러 유형별 집계
- 프록시 로테이션 현황

### 5.2 로그 파일 확인
```bash
# 일별 프록시 사용 로그
cat logs/proxy_usage_YYYYMMDD.log

# 일별 요약 리포트
cat logs/daily_summary_YYYYMMDD.json
```

### 5.3 Supabase 모니터링 테이블
다음 테이블들이 자동 생성됩니다:
- `proxy_usage_logs`: 개별 요청 로그
- `daily_proxy_summaries`: 일일 요약 통계

## ⚙️ 6단계: 고급 설정

### 6.1 프록시 풀 확장
더 많은 프록시를 추가하려면:
1. Bright Data에서 추가 프록시 생성
2. GitHub Secrets에 `BRIGHT_DATA_ENDPOINT_N` 형식으로 추가
3. 자동으로 로드밸런싱 적용

### 6.2 성능 최적화
```bash
# .env 파일에 추가
DEBUG_MODE=false                 # 프로덕션 모드
SAVE_DAILY_SUMMARY=true         # 일일 요약 저장
MAX_PROXY_FAIL_COUNT=3          # 프록시 실패 허용 횟수
PROXY_ROTATION_DELAY=2          # 프록시 전환 대기 시간(초)
```

### 6.3 에러 처리 최적화
```python
# 특정 에러에 대한 재시도 로직
RETRY_ON_ERRORS=["timeout", "connection_error", "502", "503"]
MAX_RETRIES_PER_PROXY=2
```

## 🔍 7단계: 문제해결

### 7.1 프록시 연결 실패
```bash
# 1. 프록시 설정 확인
echo $BRIGHT_DATA_ENDPOINT
echo $BRIGHT_DATA_USERNAME

# 2. 프록시 상태 확인 (Bright Data Dashboard)
# 3. IP 화이트리스트 확인
```

### 7.2 인증 오류
```bash
# 비밀번호 재확인
# Bright Data Dashboard에서 새 비밀번호 생성
```

### 7.3 성능 저하
```python
# 프록시 통계 확인
from proxy_monitor import get_proxy_monitor
monitor = get_proxy_monitor()
stats = monitor.get_usage_stats(hours=24)
print(monitor.export_usage_report(format='text'))
```

### 7.4 한국 IP 사용 확인
```bash
# IP 위치 확인
curl -x "username:password@endpoint" "https://httpbin.org/ip"
```

## 💰 8단계: 비용 관리

### 8.1 사용량 모니터링
- Bright Data Dashboard에서 실시간 사용량 확인
- 월별 트래픽 리미트 설정
- 알림 설정으로 초과 방지

### 8.2 최적화 팁
- 불필요한 요청 최소화
- 캐시 활용으로 중복 요청 방지
- 실패한 프록시 빠른 전환으로 비용 절약

## 🎯 9단계: 프로덕션 배포

### 9.1 GitHub Actions 자동 실행
기존 스케줄 유지:
- 오전 11:20 (KST)
- 오후 1:50 (KST)

### 9.2 성능 모니터링
```yaml
# GitHub Actions에서 성공률 추적
- name: Check Success Rate
  run: |
    success_rate=$(python -c "from proxy_monitor import get_proxy_monitor; print(get_proxy_monitor().get_usage_stats()['success_rate'])")
    echo "Success Rate: $success_rate%"
    if (( $(echo "$success_rate < 80.0" | bc -l) )); then
      echo "Warning: Low success rate!"
    fi
```

## 📈 예상 성능 개선

### Before (직접 요청)
- 성공률: ~60-70%
- IP 차단 빈발
- 느린 응답 속도

### After (Bright Data 프록시)
- 성공률: ~90-95%
- IP 차단 방지
- 빠른 응답 속도 (한국 IP)
- 안정적인 24/7 운영

## 🆘 지원 및 문의

### Bright Data 지원
- [Support Portal](https://help.brightdata.com/)
- 실시간 채팅 지원
- 기술 문서 확인

### 크롤러 문제
- GitHub Issues 등록
- 로그 파일 첨부
- 프록시 통계 정보 포함