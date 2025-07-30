import requests
from bs4 import BeautifulSoup
import json
import time
import random
from urllib.parse import quote
import os
from supabase import create_client, Client

class NaverPlaceCrawler:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        
        # Supabase 설정
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_SERVICE_KEY')
        if url and key:
            self.supabase: Client = create_client(url, key)
        else:
            self.supabase = None
            print("Warning: Supabase credentials not found")

    def search_places(self, keyword: str, max_results: int = 20) -> list:
        """네이버 플레이스에서 키워드로 검색"""
        try:
            # 네이버 플레이스 검색 URL
            search_url = f"https://map.naver.com/v5/search/{quote(keyword)}"
            
            print(f"Searching for: {keyword}")
            response = self.session.get(search_url)
            response.raise_for_status()
            
            # 실제 검색 결과는 AJAX로 로드되므로 API 엔드포인트 찾기
            # 네이버 지도 API 패턴 분석 필요
            api_url = "https://map.naver.com/v5/api/search"
            params = {
                'caller': 'pcweb',
                'query': keyword,
                'type': 'all',
                'page': 1,
                'displayCount': max_results,
                'isPlaceRecommendationReplace': 'true'
            }
            
            api_response = self.session.get(api_url, params=params)
            
            if api_response.status_code == 200:
                data = api_response.json()
                return self._parse_search_results(data, keyword)
            else:
                print(f"API request failed: {api_response.status_code}")
                return []

        except Exception as e:
            print(f"Search failed for '{keyword}': {str(e)}")
            return []

    def _parse_search_results(self, data: dict, keyword: str) -> list:
        """검색 결과 파싱"""
        results = []
        
        try:
            places = data.get('result', {}).get('place', {}).get('list', [])
            
            for idx, place in enumerate(places):
                result = {
                    'keyword': keyword,
                    'rank': idx + 1,
                    'place_id': place.get('id', ''),
                    'place_name': place.get('name', ''),
                    'category': place.get('category', ''),
                    'address': place.get('address', ''),
                    'phone': place.get('phone', ''),
                    'rating': place.get('rating', 0),
                    'review_count': place.get('reviewCount', 0),
                    'visitor_review_count': place.get('visitorReviewCount', 0),
                    'blog_review_count': place.get('blogReviewCount', 0),
                    'place_url': f"https://map.naver.com/v5/entry/place/{place.get('id', '')}",
                    'crawled_at': time.strftime('%Y-%m-%d %H:%M:%S')
                }
                results.append(result)
                
        except Exception as e:
            print(f"Parsing failed: {str(e)}")
            
        return results

    def save_to_supabase(self, results: list, tracked_place_id: str = None):
        """결과를 Supabase에 저장"""
        if not self.supabase or not results:
            return False
            
        try:
            for result in results:
                # crawler_results 테이블에 저장
                insert_data = {
                    'tracked_place_id': tracked_place_id,
                    'keyword': result['keyword'],
                    'place_name': result['place_name'],
                    'rank': result['rank'],
                    'review_count': result['review_count'],
                    'visitor_review_count': result['visitor_review_count'],
                    'blog_review_count': result['blog_review_count'],
                    'crawled_at': result['crawled_at']
                }
                
                response = self.supabase.table('crawler_results').insert(insert_data).execute()
                
                # rankings 테이블에도 저장 (기존 테이블과 호환성)
                if tracked_place_id:
                    ranking_data = {
                        'tracked_place_id': tracked_place_id,
                        'rank': result['rank'],
                        'checked_at': result['crawled_at']
                    }
                    self.supabase.table('rankings').insert(ranking_data).execute()
                    
            print(f"Saved {len(results)} results to Supabase")
            return True
            
        except Exception as e:
            print(f"Failed to save to Supabase: {str(e)}")
            return False

    def crawl_tracked_places(self):
        """등록된 tracked_places를 모두 크롤링"""
        if not self.supabase:
            print("Supabase not configured")
            return
            
        try:
            # 활성화된 tracked_places 가져오기
            response = self.supabase.table('tracked_places').select('*').eq('is_active', True).execute()
            tracked_places = response.data
            
            print(f"Found {len(tracked_places)} active tracked places")
            
            for place in tracked_places:
                keyword = place['search_keyword']
                place_id = place['id']
                
                print(f"Crawling: {keyword} (ID: {place_id})")
                
                # 검색 실행
                results = self.search_places(keyword)
                
                # 해당 place_url과 일치하는 결과 찾기
                target_place = None
                place_url = place.get('place_url', '')
                
                for result in results:
                    if place_url in result['place_url'] or result['place_url'] in place_url:
                        target_place = result
                        break
                
                if target_place:
                    # 해당 플레이스만 저장
                    self.save_to_supabase([target_place], place_id)
                else:
                    print(f"Place not found in search results: {place_url}")
                
                # 요청 간격 (네이버 서버 부하 방지)
                time.sleep(random.uniform(2, 5))
                
        except Exception as e:
            print(f"Crawl tracked places failed: {str(e)}")

def main():
    """메인 실행 함수"""
    crawler = NaverPlaceCrawler()
    
    # 환경변수로 모드 결정
    mode = os.getenv('CRAWLER_MODE', 'tracked')  # 'tracked' or 'test'
    
    if mode == 'test':
        # 테스트 모드: 키워드 직접 입력
        keyword = os.getenv('TEST_KEYWORD', '강남 맛집')
        results = crawler.search_places(keyword)
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        # 실제 크롤링 모드: tracked_places 처리
        crawler.crawl_tracked_places()

if __name__ == "__main__":
    main()