#!/usr/bin/env python3
"""
개선된 네이버 플레이스 크롤러 테스트
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from crawler import NaverPlaceCrawler

def test_basic_search():
    """기본 검색 기능 테스트"""
    print("=== 기본 검색 기능 테스트 ===")
    
    crawler = NaverPlaceCrawler()
    
    # 테스트 케이스들
    test_cases = [
        {"keyword": "강남 맛집", "shop_name": "미가연"},
        {"keyword": "홍대 카페", "shop_name": "스타벅스"},
        {"keyword": "명동 미용실", "shop_name": "준오헤어"},
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n테스트 {i}: {test_case['keyword']} -> {test_case['shop_name']}")
        
        result = crawler.search_place_rank(
            test_case['keyword'], 
            test_case['shop_name']
        )
        
        print(f"결과: {result['message']}")
        if result['success']:
            print(f"순위: {result['rank']}위")
        
        if result['found_shops']:
            print(f"발견된 상점들: {', '.join(result['found_shops'][:5])}")
        
        print("-" * 50)

def test_supabase_connection():
    """Supabase 연결 테스트"""
    print("\n=== Supabase 연결 테스트 ===")
    
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_KEY')
    
    print(f"Supabase URL: {url}")
    print(f"Service Key: {'✓ Set' if key else '✗ Missing'}")
    
    crawler = NaverPlaceCrawler()
    if crawler.supabase:
        print("✓ Supabase client initialized successfully")
        
        # 테스트 쿼리
        try:
            response = crawler.supabase.table('tracked_places').select('count', count='exact').execute()
            print(f"✓ Database connected - tracked_places count: {response.count}")
        except Exception as e:
            print(f"✗ Database query failed: {e}")
    else:
        print("✗ Supabase client initialization failed")

def test_with_environment():
    """환경변수를 사용한 테스트"""
    print("\n=== 환경변수 테스트 ===")
    
    # 환경변수 설정
    os.environ['CRAWLER_MODE'] = 'test'
    os.environ['TEST_KEYWORD'] = '강남 성형외과'
    os.environ['TEST_SHOP_NAME'] = '아이디병원'
    
    print(f"테스트 키워드: {os.getenv('TEST_KEYWORD')}")
    print(f"테스트 상점명: {os.getenv('TEST_SHOP_NAME')}")
    
    # 크롤러 실행
    from crawler import main
    main()

def test_html_parsing():
    """HTML 파싱 테스트 (디버깅용)"""
    print("\n=== HTML 파싱 테스트 ===")
    
    crawler = NaverPlaceCrawler()
    
    # 간단한 키워드로 테스트
    keyword = "스타벅스"
    url = crawler.build_url(keyword)
    
    print(f"검색 URL: {url}")
    
    try:
        import requests
        session = requests.Session()
        session.headers.update(crawler.headers)
        
        response = session.get(url, timeout=10)
        print(f"페이지 요청 결과: {response.status_code}")
        
        if response.status_code == 200:
            print("✓ 페이지 요청 성공")
            
            # iframe 찾기 테스트
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(response.text, "html.parser")
            iframes = soup.find_all("iframe")
            print(f"발견된 iframe 수: {len(iframes)}")
            
            for iframe in iframes:
                iframe_id = iframe.get("id")
                if iframe_id:
                    print(f"iframe ID: {iframe_id}")
        
    except Exception as e:
        print(f"테스트 실패: {e}")

def main():
    """모든 테스트 실행"""
    print("🧪 개선된 네이버 플레이스 크롤러 테스트 스위트")
    print("=" * 60)
    
    # 테스트 1: 기본 검색
    test_basic_search()
    
    # 테스트 2: Supabase 연결
    test_supabase_connection()
    
    # 테스트 3: HTML 파싱
    test_html_parsing()
    
    # 테스트 4: 환경변수 (선택사항)
    run_env_test = input("\n환경변수 테스트를 실행하시겠습니까? (y/n): ").lower()
    if run_env_test == 'y':
        test_with_environment()
    
    print("\n🎯 테스트 완료!")
    print("문제가 있다면 로그를 확인하고 네이버의 HTML 구조 변경을 의심해보세요.")

if __name__ == "__main__":
    main()