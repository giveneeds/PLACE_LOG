import os
import sys
from dotenv import load_dotenv

# .env.local 파일 로드
load_dotenv('.env.local')

# API 키 설정
api_key = "e3c12c28e3fb28940ef0696d2ce61082a3d2a1bc82649dc19d898778dec42656"
os.environ['BRIGHT_DATA_API_KEY'] = api_key

print("🔍 Bright Data API 테스트 시작...")
print(f"API Key: {api_key[:10]}...{api_key[-10:]}")

try:
    from bright_data_api_config import BrightDataAPIConfig
    
    # API 설정 초기화
    config = BrightDataAPIConfig(api_key)
    
    print("\n📡 데이터센터 프록시 조회 중...")
    dc_proxies = config.get_datacenter_proxies("KR")
    
    if dc_proxies:
        print(f"✅ {len(dc_proxies)}개의 데이터센터 프록시를 찾았습니다.")
        for i, proxy in enumerate(dc_proxies[:3], 1):  # 처음 3개만 표시
            print(f"\n프록시 #{i}:")
            print(f"  - Endpoint: {proxy.get('endpoint')}")
            print(f"  - Username: {proxy.get('username')}")
            print(f"  - Country: {proxy.get('country')}")
    else:
        print("❌ 프록시를 찾을 수 없습니다.")
    
    # 프록시 연결 테스트
    if dc_proxies:
        print("\n🧪 첫 번째 프록시 연결 테스트 중...")
        test_result = config.test_proxy_connection(dc_proxies[0])
        if test_result:
            print("✅ 프록시 연결 성공!")
        else:
            print("❌ 프록시 연결 실패!")
    
except Exception as e:
    print(f"\n❌ 오류 발생: {e}")
    import traceback
    traceback.print_exc()

print("\n🎯 테스트 완료!")

# 크롤러 테스트
print("\n" + "="*60)
print("🕷️ 네이버 플레이스 크롤러 테스트")
print("="*60)

try:
    from enhanced_naver_crawler import EnhancedNaverPlaceCrawler
    
    # 크롤러 초기화
    crawler = EnhancedNaverPlaceCrawler(use_proxy=True)
    
    # 테스트 크롤링
    keyword = "서울 강남 맛집"
    shop_name = "스타벅스"
    
    print(f"\n🔍 테스트 검색: '{keyword}' 에서 '{shop_name}' 찾기")
    result = crawler.search_place_rank(keyword, shop_name)
    
    print(f"\n📊 결과:")
    print(f"  - 성공 여부: {result['success']}")
    print(f"  - 순위: {result['rank']}")
    print(f"  - 메시지: {result['message']}")
    print(f"  - 요청 방법: {result['request_method']}")
    
except Exception as e:
    print(f"\n❌ 크롤러 테스트 오류: {e}")
    import traceback
    traceback.print_exc()