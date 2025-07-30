#!/usr/bin/env python3
"""
2025년 현재 네이버에 최적화된 Selenium 기반 플레이스 순위 크롤러
가이드 문서 기반으로 실제 작동하는 버전으로 구현
"""
import time
import re
import random
import os
import logging
from typing import Dict, List, Optional
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from supabase import create_client, Client

class ModernNaverPlaceCrawler:
    """2025년 현재 네이버에 최적화된 플레이스 순위 크롤러"""
    
    def __init__(self, headless=True, delay_range=(2, 5)):
        """
        크롤러 초기화
        
        Args:
            headless (bool): 브라우저 창 숨김 여부
            delay_range (tuple): 요청 간 지연 시간 범위 (초)
        """
        self.delay_range = delay_range
        self.logger = self._setup_logging()
        self.driver = None
        self.setup_driver(headless)
        
        # Supabase 설정
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_SERVICE_KEY') 
        if url and key:
            self.supabase: Client = create_client(url, key)
        else:
            self.supabase = None
            self.logger.warning("Supabase credentials not found")
    
    def _setup_logging(self):
        """로깅 설정"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        return logging.getLogger("ModernNaverPlaceCrawler")
    
    def setup_driver(self, headless):
        """Chrome WebDriver 설정"""
        options = Options()
        
        if headless:
            options.add_argument('--headless')
        
        # 네이버 차단 우회 설정
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        # 모바일 User-Agent 설정 (가이드 문서 권장)
        options.add_argument('--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1')
        
        # 추가 설정
        options.add_argument('--disable-gpu')
        options.add_argument('--window-size=375,812')  # iPhone 크기
        options.add_argument('--disable-web-security')
        options.add_argument('--allow-running-insecure-content')
        
        try:
            self.driver = webdriver.Chrome(options=options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            self.logger.info("Chrome WebDriver initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize WebDriver: {e}")
            raise
    
    def get_place_rank(self, keyword: str, target_place_name: str, max_depth=100) -> Dict:
        """
        특정 키워드에서 플레이스의 순위를 찾는 메인 함수
        
        Args:
            keyword (str): 검색 키워드
            target_place_name (str): 찾을 플레이스명
            max_depth (int): 최대 검색 깊이
            
        Returns:
            dict: {'rank': int, 'success': bool, 'message': str, 'found_places': list}
        """
        result = {
            'keyword': keyword,
            'target_place_name': target_place_name,
            'rank': -1,
            'success': False,
            'message': '',
            'found_places': [],
            'search_time': time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        try:
            self.logger.info(f"Starting search for '{target_place_name}' with keyword '{keyword}'")
            
            # 1. 모바일 네이버 검색 페이지 접속
            search_url = f"https://m.search.naver.com/search.naver?where=m&sm=top_sly.hst&fbm=0&acr=1&ie=utf8&query={keyword}"
            self.driver.get(search_url)
            self._random_delay()
            
            # 2. 플레이스 섹션 찾고 더보기 클릭
            if not self._click_place_more_button():
                result['message'] = 'No place section found'
                return result
            
            # 3. 플레이스 리스트에서 순위 검색
            rank_result = self._search_rank_in_list(target_place_name, max_depth)
            result.update(rank_result)
            
            if result['success']:
                self.logger.info(f"Found '{target_place_name}' at rank {result['rank']}")
            else:
                self.logger.warning(f"Could not find '{target_place_name}' in top {max_depth} results")
                
        except Exception as e:
            result['message'] = f"Error: {str(e)}"
            self.logger.error(f"Error in get_place_rank: {e}")
        
        return result
    
    def _click_place_more_button(self) -> bool:
        """플레이스 섹션의 '더보기' 버튼 클릭"""
        try:
            # 다양한 플레이스 더보기 버튼 선택자 시도
            more_button_selectors = [
                "a[href*='place']",  # 플레이스 관련 링크
                ".area_place .more_btn",
                ".place_area .btn_more",
                "#place-main-section-root a",
                ".place_section .more",
                "a:contains('더보기')",
                ".place_more_btn"
            ]
            
            for selector in more_button_selectors:
                try:
                    if selector.startswith("a:contains"):
                        # XPath로 변환
                        elements = self.driver.find_elements(By.XPATH, "//a[contains(text(), '더보기')]")
                        if elements:
                            element = elements[0]
                        else:
                            continue
                    else:
                        element = WebDriverWait(self.driver, 5).until(
                            EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                        )
                    
                    # 플레이스 관련인지 확인
                    href = element.get_attribute('href') or ''
                    if 'place' in href.lower() or 'restaurant' in href.lower():
                        self.logger.info(f"Found place more button with selector: {selector}")
                        self.driver.execute_script("arguments[0].click();", element)
                        self._random_delay()
                        return True
                        
                except (TimeoutException, NoSuchElementException):
                    continue
            
            # 직접 플레이스 리스트 URL로 이동 (대안)
            current_url = self.driver.current_url
            if 'm.search.naver.com' in current_url:
                # 검색어 추출
                import urllib.parse
                parsed = urllib.parse.urlparse(current_url)
                query_params = urllib.parse.parse_qs(parsed.query)
                query = query_params.get('query', [''])[0]
                
                if query:
                    place_list_url = f"https://m.place.naver.com/list?query={query}"
                    self.logger.info(f"Trying direct place list URL: {place_list_url}")
                    self.driver.get(place_list_url)
                    self._random_delay()
                    return True
            
            self.logger.warning("Could not find place more button")
            return False
            
        except Exception as e:
            self.logger.error(f"Error clicking place more button: {e}")
            return False
    
    def _search_rank_in_list(self, target_place_name: str, max_depth: int) -> Dict:
        """플레이스 리스트에서 순위 검색"""
        result = {
            'rank': -1,
            'success': False,
            'message': '',
            'found_places': []
        }
        
        current_rank = 1
        scroll_attempts = 0
        max_scroll_attempts = 10
        found_places = []
        
        while current_rank <= max_depth and scroll_attempts < max_scroll_attempts:
            # 현재 로드된 플레이스 아이템들 가져오기
            place_items = self._get_place_items()
            
            if not place_items:
                self.logger.warning("No place items found")
                break
            
            # 새로 로드된 아이템들 처리
            for item in place_items[len(found_places):]:
                try:
                    place_info = self._extract_place_info(item)
                    if not place_info:
                        continue
                    
                    place_name = place_info['name']
                    found_places.append(place_name)
                    
                    # 광고 건너뛰기
                    if place_info.get('is_ad', False):
                        self.logger.debug(f"Skipping ad: {place_name}")
                        continue
                    
                    # 타겟 플레이스 매칭
                    if self._is_target_match(target_place_name, place_name):
                        result.update({
                            'rank': current_rank,
                            'success': True,
                            'message': f'Found at rank {current_rank}',
                            'found_places': found_places[:20]  # 처음 20개만
                        })
                        return result
                    
                    current_rank += 1
                    
                except Exception as e:
                    self.logger.debug(f"Error processing place item: {e}")
                    continue
            
            # 더 많은 결과를 위해 스크롤
            if not self._scroll_for_more_results():
                break
                
            scroll_attempts += 1
            self._random_delay()
        
        # 찾지 못한 경우
        result.update({
            'message': f'Not found in top {current_rank-1} results',
            'found_places': found_places[:20]
        })
        
        return result
    
    def _get_place_items(self) -> List:
        """현재 페이지의 플레이스 아이템들 가져오기"""
        selectors = [
            "ul.list_place li",  # 모바일 기본 선택자
            ".place_list li",
            "li[data-place-id]",
            ".search_list_item",
            ".place_item",
            "ul li:has(.place_name)",
            "div[role='listitem']",
            ".list_item"
        ]
        
        for selector in selectors:
            try:
                items = self.driver.find_elements(By.CSS_SELECTOR, selector)
                if items:
                    self.logger.debug(f"Found {len(items)} items with selector: {selector}")
                    return items
            except Exception:
                continue
        
        return []
    
    def _extract_place_info(self, item) -> Optional[Dict]:
        """플레이스 아이템에서 정보 추출"""
        try:
            # 플레이스명 추출
            name_selectors = [
                ".place_name",
                ".name",
                "h3",
                ".title",
                "a .place_bluelink",
                ".place_title",
                "strong"
            ]
            
            place_name = None
            for selector in name_selectors:
                try:
                    element = item.find_element(By.CSS_SELECTOR, selector)
                    place_name = element.text.strip()
                    if place_name:
                        break
                except:
                    continue
            
            if not place_name:
                return None
            
            # 광고 여부 확인
            is_ad = self._is_advertisement(item)
            
            return {
                'name': place_name,
                'is_ad': is_ad
            }
            
        except Exception as e:
            self.logger.debug(f"Error extracting place info: {e}")
            return None
    
    def _is_advertisement(self, item) -> bool:
        """광고 여부 확인"""
        ad_indicators = [
            ".ad_marker",
            ".sponsor", 
            "[class*='ad']",
            ".promotion",
            "span:contains('광고')",
            ".ad_badge"
        ]
        
        for indicator in ad_indicators:
            try:
                if indicator.startswith("span:contains"):
                    # XPath 사용
                    ad_elements = item.find_elements(By.XPATH, ".//span[contains(text(), '광고')]")
                    if ad_elements:
                        return True
                else:
                    ad_element = item.find_element(By.CSS_SELECTOR, indicator)
                    if ad_element:
                        return True
            except:
                continue
        
        return False
    
    def _is_target_match(self, target_name: str, found_name: str) -> bool:
        """타겟 플레이스명과 매칭 확인"""
        if not target_name or not found_name:
            return False
        
        target_clean = re.sub(r'[^\w]', '', target_name.lower())
        found_clean = re.sub(r'[^\w]', '', found_name.lower())
        
        # 정확한 매치
        if target_clean == found_clean:
            return True
        
        # 부분 매치 (양방향)
        if target_clean in found_clean or found_clean in target_clean:
            return True
        
        # 공백/특수문자 제거 후 매치
        target_simple = target_name.replace(' ', '').lower()
        found_simple = found_name.replace(' ', '').lower()
        
        if target_simple in found_simple or found_simple in target_simple:
            return True
        
        return False
    
    def _scroll_for_more_results(self) -> bool:
        """페이지 스크롤하여 더 많은 결과 로드"""
        try:
            # 현재 스크롤 위치 저장
            last_height = self.driver.execute_script("return document.body.scrollHeight")
            
            # 스크롤 다운
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)
            
            # 새로운 높이 확인
            new_height = self.driver.execute_script("return document.body.scrollHeight")
            
            return new_height > last_height
            
        except Exception as e:
            self.logger.debug(f"Scroll failed: {e}")
            return False
    
    def _random_delay(self):
        """랜덤 지연으로 차단 방지"""
        delay = random.uniform(*self.delay_range)
        time.sleep(delay)
    
    def save_to_supabase(self, results: List[Dict], tracked_place_id: Optional[int] = None) -> bool:
        """결과를 Supabase에 저장"""
        if not self.supabase or not results:
            return False
            
        try:
            for result in results:
                # crawler_results 테이블에 저장
                insert_data = {
                    'tracked_place_id': tracked_place_id,
                    'keyword': result['keyword'],
                    'place_name': result['target_place_name'],
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
                    
            self.logger.info(f"Saved {len(results)} results to Supabase")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to save to Supabase: {e}")
            return False
    
    def crawl_tracked_places(self):
        """등록된 tracked_places를 모두 크롤링"""
        if not self.supabase:
            self.logger.error("Supabase not configured")
            return
            
        try:
            # 활성화된 tracked_places 가져오기
            response = self.supabase.table('tracked_places').select('*').eq('is_active', True).execute()
            tracked_places = response.data
            
            self.logger.info(f"Found {len(tracked_places)} active tracked places")
            
            results = []
            
            for place in tracked_places:
                keyword = place['search_keyword']
                place_name = place['place_name']
                place_id = place['id']
                
                self.logger.info(f"Crawling: {place_name} (keyword: {keyword})")
                
                # 검색 실행
                result = self.get_place_rank(keyword, place_name)
                results.append(result)
                
                # 결과 즉시 저장
                self.save_to_supabase([result], place_id)
                
                # 요청 간격 (네이버 서버 부하 방지)
                self._random_delay()
            
            return results
                
        except Exception as e:
            self.logger.error(f"Crawl tracked places failed: {e}")
            return []
    
    def close(self):
        """리소스 정리"""
        if self.driver:
            self.driver.quit()
            self.logger.info("WebDriver closed")

def main():
    """메인 실행 함수"""
    crawler = ModernNaverPlaceCrawler(headless=True)
    
    try:
        # 환경변수로 모드 결정
        mode = os.getenv('CRAWLER_MODE', 'test')
        
        if mode == 'test':
            # 테스트 모드
            keyword = os.getenv('TEST_KEYWORD', '서울 상암 맛집')
            shop_name = os.getenv('TEST_SHOP_NAME', '맥도날드상암DMC점')
            
            result = crawler.get_place_rank(keyword, shop_name, max_depth=50)
            
            print("=== 크롤링 결과 ===")
            print(f"키워드: {result['keyword']}")
            print(f"찾는 상점: {result['target_place_name']}")
            print(f"성공: {result['success']}")
            print(f"순위: {result['rank']}")
            print(f"메시지: {result['message']}")
            
            if result['found_places']:
                print(f"\n발견된 상점들 (상위 10개):")
                for i, place in enumerate(result['found_places'][:10], 1):
                    print(f"  {i}. {place}")
            
        else:
            # 실제 크롤링 모드
            crawler.crawl_tracked_places()
            
    finally:
        crawler.close()

if __name__ == "__main__":
    main()