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
    """네이버 플레이스 모바일 크롤러 - iframe 방식 사용"""
    
    def __init__(self):
        self.logger = logging.getLogger("NaverPlaceCrawler")
        # 모바일 User-Agent 사용
        self.headers = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
            "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": "https://m.map.naver.com/"
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
        """검색어를 기반으로 네이버 모바일 지도 검색 URL을 생성"""
        encoded_keyword = urllib.parse.quote(keyword)
        # 모바일 지도 URL 사용
        return f"https://m.map.naver.com/search2/search.naver?query={encoded_keyword}&sm=hty&style=v5"

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
            
            # 첫 번째 접근: 직접 모바일 리스트 URL 시도
            list_url = f"https://m.place.naver.com/restaurant/list?query={urllib.parse.quote(keyword)}&entry=plt"
            print(f"리스트 URL: {list_url}")
            
            # 리스트 페이지 요청
            list_response = session.get(list_url, timeout=10)
            
            if list_response.status_code != 200:
                # 대체 방법: 데스크톱 iframe 방식
                iframe_url = f"https://pcmap.place.naver.com/place/list?query={urllib.parse.quote(keyword)}"
                print(f"대체 iframe URL: {iframe_url}")
                
                list_response = session.get(iframe_url, timeout=10)
                
                if list_response.status_code != 200:
                    result["message"] = f"리스트 요청 실패: 상태 코드 {list_response.status_code}"
                    print(result["message"])
                    return result
            
            # HTML 파싱
            soup = BeautifulSoup(list_response.text, "html.parser")
            
            # 장소 목록 찾기 - 다양한 선택자 시도
            place_items = []
            
            # 모바일 선택자들
            mobile_selectors = [
                "li[data-index]",  # 가장 일반적인 모바일 선택자
                "li.place_item",
                "div.place_list li",
                "ul.list_place li",
                "li.UEzoS",  # 데스크톱 선택자도 시도
                "li.VLTHu",
                "div.Ryr1F#_pcmap_list_scroll_container > ul > li",
                "ul._3l82D > li",
                "ul._1s-8x > li",
            ]
            
            for selector in mobile_selectors:
                place_items = soup.select(selector)
                if place_items:
                    print(f"선택자 '{selector}'로 {len(place_items)}개 항목 발견")
                    break
            
            if not place_items:
                # 모든 li 태그 시도 (최후의 수단)
                all_lis = soup.find_all("li")
                place_items = [li for li in all_lis if li.get_text().strip()]
                print(f"모든 li 태그에서 {len(place_items)}개 항목 발견")
            
            if not place_items:
                result["message"] = "장소 목록을 찾을 수 없습니다."
                print(result["message"])
                return result
            
            # 장소 순위 찾기
            rank = 0
            found_shops = []
            
            for item in place_items[:300]:  # 상위 300개까지 확인
                # 광고 확인
                text = item.get_text()
                if any(ad_word in text for ad_word in ["광고", "AD", "Sponsored"]):
                    continue
                
                rank += 1
                
                # 상점명 추출 - 다양한 방법 시도
                shop_text = text.strip()
                
                # 간단한 텍스트 정리
                shop_text = shop_text.replace("\n", " ").strip()
                
                # 처음 30자만 기록 (디버깅용)
                found_shops.append(shop_text[:30])
                
                # 부분 일치 검색 (대소문자 구분 없이)
                if shop_name.lower() in shop_text.lower():
                    result["rank"] = rank
                    result["success"] = True
                    result["message"] = f"'{shop_name}'은(는) '{keyword}' 검색 결과에서 {rank}위입니다."
                    result["found_shops"] = found_shops[:10]
                    print(result["message"])
                    return result
                
                # 정확한 매치가 안 되면 더 유연한 매칭 시도
                # 예: "맥도날드상암DMC점" vs "맥도날드 상암DMC점"
                shop_name_parts = shop_name.replace(" ", "")
                shop_text_parts = shop_text.replace(" ", "")
                
                if shop_name_parts.lower() in shop_text_parts.lower():
                    result["rank"] = rank
                    result["success"] = True
                    result["message"] = f"'{shop_name}'은(는) '{keyword}' 검색 결과에서 {rank}위입니다."
                    result["found_shops"] = found_shops[:10]
                    print(result["message"])
                    return result
            
            # 디버깅: 찾은 상점 목록 출력
            print(f"검색된 상점 목록 (상위 10개):")
            for i, shop in enumerate(found_shops[:10], 1):
                print(f"  {i}. {shop}")
            
            result["found_shops"] = found_shops[:20]
            result["message"] = f"'{shop_name}'을(를) 상위 {rank}개 결과에서 찾을 수 없습니다."
            print(result["message"])
            
        except Exception as e:
            result["message"] = f"오류 발생: {type(e).__name__} - {e}"
            print(result["message"])
            import traceback
            traceback.print_exc()
        
        return result

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
                    'review_count': 0,
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
    mode = os.getenv('CRAWLER_MODE', 'tracked')
    
    if mode == 'test':
        # 테스트 모드
        keyword = os.getenv('TEST_KEYWORD', '서울 상암 맛집')
        shop_name = os.getenv('TEST_SHOP_NAME', '맥도날드상암DMC점')
        result = crawler.search_place_rank(keyword, shop_name)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        # 실제 크롤링 모드
        crawler.crawl_tracked_places()

if __name__ == "__main__":
    main()