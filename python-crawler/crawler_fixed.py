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
    """네이버 플레이스 크롤러 - 실제 작동하는 버전"""
    
    def __init__(self):
        self.logger = logging.getLogger("NaverPlaceCrawler")
        # 데스크톱 User-Agent 사용 (작동하는 크롤러와 동일)
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": "https://map.naver.com/"
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
        """검색어를 기반으로 네이버 지도 검색 URL을 생성"""
        encoded_keyword = urllib.parse.quote(keyword)
        return f"https://map.naver.com/p/search/{encoded_keyword}?searchType=place"

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
            
            # HTML 파싱 (iframe 내용 직접 요청)
            soup = BeautifulSoup(response.text, "html.parser")
            
            # iframe URL 추출 시도
            iframe_src = None
            for iframe in soup.find_all("iframe"):
                if iframe.get("id") == "searchIframe":
                    iframe_src = iframe.get("src")
                    break
            
            if not iframe_src:
                # iframe URL을 찾을 수 없는 경우 추정
                iframe_src = f"https://pcmap.place.naver.com/place/list?query={urllib.parse.quote(keyword)}"
            
            print(f"iframe URL: {iframe_src}")
            
            # iframe 내용 요청
            iframe_response = session.get(iframe_src, timeout=10)
            
            if iframe_response.status_code != 200:
                result["message"] = f"iframe 요청 실패: 상태 코드 {iframe_response.status_code}"
                print(result["message"])
                return result
            
            # iframe 내용 파싱
            iframe_soup = BeautifulSoup(iframe_response.text, "html.parser")
            
            # 장소 목록 찾기 (여러 선택자 시도)
            place_items = iframe_soup.select("div.Ryr1F#_pcmap_list_scroll_container > ul > li")
            
            if not place_items:
                place_items = iframe_soup.select("li.VLTHu")  # 대체 선택자
            
            if not place_items:
                place_items = iframe_soup.select("li.UEzoS")  # 또 다른 대체 선택자
                
            # 추가 선택자들
            if not place_items:
                place_items = iframe_soup.select("ul._3l82D > li")
                
            if not place_items:
                place_items = iframe_soup.select("ul._1s-8x > li")
                
            if not place_items:
                place_items = iframe_soup.select("div.place_section > ul > li")
                
            if not place_items:
                place_items = iframe_soup.select(".api_subject_bx > ul > li")
                
            if not place_items:
                place_items = iframe_soup.select("div._1EKsQ li.YjsMB")
            
            if not place_items:
                result["message"] = "장소 목록을 찾을 수 없습니다."
                print(result["message"])
                return result
            
            print(f"장소 항목 {len(place_items)}개 발견")
            
            # 장소 순위 찾기
            rank = 0
            found_shops = []  # 디버깅용 - 찾은 상점 목록
            
            for item in place_items:
                # 광고 건너뛰기 - 여러 선택자 시도
                ad_selectors = [".gU6bV._DHlh", ".ad_area", ".ad-badge", ".OErwL", "span.OErwL"]
                is_ad = False
                
                for ad_selector in ad_selectors:
                    ad_element = item.select_one(ad_selector)
                    if ad_element:
                        is_ad = True
                        break
                
                if is_ad:
                    continue
                
                rank += 1
                
                # 상점명 찾기 (여러 선택자 시도)
                shop_name_element = item.select_one(".place_bluelink.tWIhh > span.O_Uah")
                
                if not shop_name_element:
                    shop_name_element = item.select_one("span.place_bluelink")
                
                if not shop_name_element:
                    shop_name_element = item.select_one("span.TYaxT")
                    
                # 추가 선택자들
                if not shop_name_element:
                    shop_name_element = item.select_one("span.LDgIH")
                    
                if not shop_name_element:
                    shop_name_element = item.select_one("span.OXiLu")
                    
                if not shop_name_element:
                    shop_name_element = item.select_one("span._3Apve")
                    
                if not shop_name_element:
                    shop_name_element = item.select_one("span.place_bluelink._3Apve")
                    
                if not shop_name_element:
                    shop_name_element = item.select_one(".place_bluelink")
                    
                if not shop_name_element:
                    shop_name_element = item.select_one("a.place_link > span")
                
                if shop_name_element:
                    current_shop_name = shop_name_element.get_text().strip()
                    found_shops.append(current_shop_name)  # 디버깅용
                    
                    # 부분 일치 검색으로 변경 (대소문자 구분 없이)
                    if shop_name.lower() in current_shop_name.lower() or current_shop_name.lower() in shop_name.lower():
                        result["rank"] = rank
                        result["success"] = True
                        result["message"] = f"'{shop_name}'은(는) '{keyword}' 검색 결과에서 {rank}위입니다."
                        result["found_shops"] = found_shops[:10]  # 처음 10개만
                        print(result["message"])
                        return result
            
            # 로깅: 찾은 상점 목록 출력 (디버깅 도움)
            if found_shops:
                print(f"검색 결과 상점 목록: {', '.join(found_shops[:10])}" + (", ..." if len(found_shops) > 10 else ""))
            
            result["found_shops"] = found_shops[:20]  # 처음 20개만
            
            # 찾지 못한 경우
            result["message"] = f"'{shop_name}'을(를) 찾을 수 없습니다."
            print(result["message"])
            
        except Exception as e:
            result["message"] = f"오류 발생: {type(e).__name__} - {e}"
            print(result["message"])
        
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
        keyword = os.getenv('TEST_KEYWORD', '서울 상암 맛집')
        shop_name = os.getenv('TEST_SHOP_NAME', '맥도날드상암DMC점')
        result = crawler.search_place_rank(keyword, shop_name)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        # 실제 크롤링 모드: tracked_places 처리
        crawler.crawl_tracked_places()

if __name__ == "__main__":
    main()