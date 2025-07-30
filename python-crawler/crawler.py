import requests
import urllib.parse
from bs4 import BeautifulSoup
import json
import time
import random
import os
import logging
from supabase import create_client, Client

class NaverPlaceCrawler:
    """개선된 네이버 플레이스 크롤러 (실제 작동하는 버전)"""
    
    def __init__(self):
        self.logger = logging.getLogger("NaverPlaceCrawler")
        # 모바일 User-Agent 사용 (모바일 순위가 더 중요함)
        self.headers = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
            "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": "https://m.place.naver.com/",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
        }
        
        # Supabase 설정
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_SERVICE_KEY')
        if url and key:
            self.supabase: Client = create_client(url, key)
        else:
            self.supabase = None
            print("Warning: Supabase credentials not found")

    def build_url(self, keyword):
        """검색어를 기반으로 네이버 모바일 플레이스 리스트 URL을 생성"""
        encoded_keyword = urllib.parse.quote(keyword)
        # 올바른 네이버 플레이스 리스트 URL (더보기 페이지)
        return f"https://m.place.naver.com/restaurant/list?query={encoded_keyword}"

    def search_place_rank(self, keyword, shop_name):
        """
        키워드로 검색하여 특정 상호명의 순위를 찾음
        
        Args:
            keyword (str): 검색 키워드
            shop_name (str): 찾을 상호명
            
        Returns:
            dict: 검색 결과 (순위, 성공 여부, 메시지 등)
        """
        result = {
            "keyword": keyword,
            "shop_name": shop_name,
            "rank": -1,
            "success": False,
            "message": "",
            "search_time": time.strftime("%Y-%m-%d %H:%M:%S"),
            "found_shops": []
        }
        
        try:
            # 검색 URL 생성
            url = self.build_url(keyword)
            print(f"검색 URL: {url}")
            
            # 세션 사용
            session = requests.Session()
            session.headers.update(self.headers)
            
            # 페이지 요청
            response = session.get(url, timeout=10)
            
            if response.status_code != 200:
                result["message"] = f"페이지 요청 실패: 상태 코드 {response.status_code}"
                print(result["message"])
                return result
            
            # 네이버 플레이스 리스트 페이지 직접 파싱
            soup = BeautifulSoup(response.text, "html.parser")
            
            # 장소 목록 찾기 (다양한 선택자 시도)
            place_items = self._find_place_items(soup)
            
            if not place_items:
                result["message"] = "장소 목록을 찾을 수 없습니다."
                print(result["message"])
                return result
            
            # 장소 순위 찾기
            rank = 0
            found_shops = []
            
            for item in place_items:
                # 광고 건너뛰기
                if self._is_advertisement(item):
                    continue
                
                rank += 1
                
                # 상점명 찾기
                current_shop_name = self._extract_shop_name(item)
                
                if current_shop_name:
                    found_shops.append(current_shop_name)
                    
                    # 부분 일치 검색 (대소문자 구분 없이)
                    if (shop_name.lower() in current_shop_name.lower() or 
                        current_shop_name.lower() in shop_name.lower()):
                        result["rank"] = rank
                        result["success"] = True
                        result["message"] = f"'{shop_name}'은(는) '{keyword}' 검색 결과에서 {rank}위입니다."
                        result["found_shops"] = found_shops[:10]  # 처음 10개만
                        print(result["message"])
                        return result
            
            # 찾은 상점 목록 기록
            result["found_shops"] = found_shops[:20]  # 처음 20개만
            print(f"검색 결과 상점 목록: {', '.join(found_shops[:10])}" + 
                  (f", ... (총 {len(found_shops)}개)" if len(found_shops) > 10 else ""))
            
            # 찾지 못한 경우
            result["message"] = f"'{shop_name}'을(를) 찾을 수 없습니다."
            print(result["message"])
            
        except Exception as e:
            result["message"] = f"오류 발생: {type(e).__name__} - {e}"
            print(result["message"])
        
        return result

    def _find_place_items(self, soup):
        """모바일 버전 선택자로 장소 아이템 찾기"""
        # 모바일 네이버 플레이스의 선택자들
        mobile_selectors = [
            # 모바일 검색 결과 리스트
            "div.list_place li",
            "ul.list_place li", 
            "li.place_item",
            "div.place_list li",
            "div.search_list li",
            ".PlaceListView li",
            ".search-result li",
            "li[data-place-id]",
            "li.place",
            # 일반적인 리스트 아이템들
            "ul li:has(.place_title)",
            "ul li:has(.place_name)",
            "ul li:has(h3)",
            "ul li:has(.name)",
            # 백업 선택자들
            "ul li",
            "div[role='list'] > div",
            ".list > li",
        ]
        
        for selector in mobile_selectors:
            try:
                items = soup.select(selector)
                if items and len(items) >= 3:  # 최소 3개 이상의 아이템이 있어야 유효한 리스트
                    print(f"모바일 장소 목록 발견: {selector} ({len(items)}개)")
                    return items
            except Exception as e:
                print(f"선택자 '{selector}' 오류: {e}")
                continue
        
        print("장소 목록을 찾을 수 없습니다. HTML 구조 확인 필요")
        return []

    def _is_advertisement(self, item):
        """모바일 버전 광고 확인"""
        mobile_ad_selectors = [
            # 모바일 광고 표시
            ".ad",
            ".ad_area", 
            ".ad-badge",
            ".advertisement",
            ".sponsored",
            "[data-ad='true']",
            "[data-ad]",
            ".place_ad",
            ".ad_place",
            # 광고 텍스트 포함
            ":contains('광고')",
            ":contains('AD')",
            ":contains('Sponsored')",
        ]
        
        # 텍스트 기반 광고 감지
        item_text = item.get_text().lower()
        if any(ad_text in item_text for ad_text in ['광고', 'ad', 'sponsored']):
            return True
        
        for ad_selector in mobile_ad_selectors:
            try:
                if item.select_one(ad_selector):
                    return True
            except:
                continue
        return False

    def _extract_shop_name(self, item):
        """모바일 버전 상점명 추출"""
        mobile_shop_name_selectors = [
            # 모바일 플레이스 상호명 선택자들
            ".place_title",
            ".place_name", 
            ".name",
            ".title",
            "h3",
            "h2",
            "strong",
            ".business_name",
            ".shop_name",
            # 링크 안의 텍스트
            "a[href*='place'] span",
            "a[href*='place']",
            "a.place_link",
            ".place_bluelink",
            # 일반적인 선택자들
            ".text_bold",
            ".font_bold",
            "[data-place-name]",
            # 백업 선택자들
            "div:first-child",
            "span:first-child",
        ]
        
        for selector in mobile_shop_name_selectors:
            try:
                element = item.select_one(selector)
                if element:
                    name = element.get_text().strip()
                    # 유효한 이름인지 확인 (너무 짧거나 숫자만 있는 경우 제외)
                    if name and len(name) > 1 and not name.isdigit():
                        return name
            except Exception as e:
                continue
        
        return None

    def save_to_supabase(self, results, tracked_place_id=None):
        """결과를 Supabase에 저장"""
        if not self.supabase or not results:
            return False
            
        try:
            for result in results:
                # crawler_results 테이블에 저장
                insert_data = {
                    'tracked_place_id': tracked_place_id,
                    'keyword': result['keyword'],
                    'place_name': result['shop_name'],
                    'rank': result['rank'] if result['success'] else None,
                    'review_count': 0,  # 이 버전에서는 리뷰 수 미수집
                    'visitor_review_count': 0,
                    'blog_review_count': 0,
                    'crawled_at': result['search_time'],
                    'success': result['success'],
                    'error_message': result['message'] if not result['success'] else None
                }
                
                response = self.supabase.table('crawler_results').insert(insert_data).execute()
                
                # rankings 테이블에도 저장 (성공한 경우만)
                if tracked_place_id and result['success']:
                    ranking_data = {
                        'tracked_place_id': tracked_place_id,
                        'rank': result['rank'],
                        'checked_at': result['search_time']
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
                place_name = place['place_name']
                place_id = place['id']
                
                print(f"\n크롤링 시작: {place_name} (키워드: {keyword})")
                
                # 검색 실행
                result = self.search_place_rank(keyword, place_name)
                
                # 결과 저장
                self.save_to_supabase([result], place_id)
                
                # 요청 간격 (네이버 서버 부하 방지)
                time.sleep(random.uniform(3, 7))
                
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
        shop_name = os.getenv('TEST_SHOP_NAME', '테스트 상점')
        result = crawler.search_place_rank(keyword, shop_name)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        # 실제 크롤링 모드: tracked_places 처리
        crawler.crawl_tracked_places()

if __name__ == "__main__":
    main()