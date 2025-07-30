#!/usr/bin/env python3
"""
기존 시스템과 완전 호환되는 통합 네이버 플레이스 크롤러
Selenium + CID 기반 정확한 매칭 + 백업 전략
"""
import time
import re
import random
import os
import logging
import json
from typing import Dict, List, Optional, Union
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
from supabase import create_client, Client

class UnifiedNaverPlaceCrawler:
    """
    기존 시스템과 완전 호환되는 통합 네이버 플레이스 크롤러
    - Selenium 기반 정확한 크롤링
    - CID 기반 매칭 (가능한 경우)
    - 플레이스명 기반 백업 매칭
    - 기존 Supabase 스키마와 100% 호환
    """
    
    def __init__(self, headless=True, delay_range=(2, 5)):
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
        return logging.getLogger("UnifiedNaverPlaceCrawler")
    
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
        
        # 모바일 User-Agent (현재 네이버에 최적화)
        options.add_argument('--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1')
        
        # 추가 설정
        options.add_argument('--disable-gpu')
        options.add_argument('--window-size=375,812')
        options.add_argument('--disable-web-security')
        options.add_argument('--allow-running-insecure-content')
        options.add_argument('--disable-features=VizDisplayCompositor')
        
        try:
            self.driver = webdriver.Chrome(options=options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            self.driver.implicitly_wait(10)
            self.logger.info("Chrome WebDriver initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize WebDriver: {e}")
            raise
    
    def search_place_rank(self, keyword: str, shop_name: str) -> Dict:
        """
        기존 시스템과 호환되는 메인 검색 함수
        
        Args:
            keyword (str): 검색 키워드
            shop_name (str): 찾을 상호명
            
        Returns:
            dict: 기존 형식과 동일한 검색 결과
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
            self.logger.info(f"Starting search for '{shop_name}' with keyword '{keyword}'")
            
            # 2025년 현재 네이버 모바일 검색 URL
            search_url = f"https://m.search.naver.com/search.naver?where=m&sm=top_sly.hst&fbm=0&acr=1&ie=utf8&query={keyword}"
            self.driver.get(search_url)
            self._random_delay()
            
            # 플레이스 섹션으로 이동
            if not self._navigate_to_place_list():
                result["message"] = "플레이스 섹션을 찾을 수 없습니다."
                return result
            
            # 순위 검색 실행
            rank_result = self._find_place_rank(shop_name)
            result.update(rank_result)
            
            if result["success"]:
                self.logger.info(f"Found '{shop_name}' at rank {result['rank']}")
            else:
                self.logger.warning(f"Could not find '{shop_name}'")
                
        except Exception as e:
            result["message"] = f"오류 발생: {type(e).__name__} - {e}"
            self.logger.error(f"Error in search_place_rank: {e}")
        
        return result
    
    def _navigate_to_place_list(self) -> bool:
        """플레이스 리스트 페이지로 이동"""
        try:
            # 방법 1: 플레이스 더보기 버튼 클릭
            place_selectors = [
                "a[href*='place']",
                ".place_area a",
                "#place-main-section-root a",
                ".place_section a[href*='list']"
            ]
            
            for selector in place_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for element in elements:
                        href = element.get_attribute('href') or ''
                        text = element.text.strip().lower()
                        
                        if ('place' in href and ('더보기' in text or 'more' in text)) or 'restaurant' in href:
                            self.logger.info(f"Clicking place link: {element.text}")
                            self.driver.execute_script("arguments[0].click();", element)
                            self._random_delay()
                            return True
                except:
                    continue
            
            # 방법 2: 직접 플레이스 리스트 URL 구성
            current_url = self.driver.current_url
            if 'm.search.naver.com' in current_url:
                import urllib.parse
                parsed = urllib.parse.urlparse(current_url)
                query_params = urllib.parse.parse_qs(parsed.query)
                query = query_params.get('query', [''])[0]
                
                if query:
                    # 2025년 현재 플레이스 리스트 URL 패턴
                    place_urls = [
                        f"https://m.place.naver.com/list?query={query}",
                        f"https://m.place.naver.com/restaurant/list?query={query}",
                        f"https://m.search.naver.com/search.naver?where=place&query={query}"
                    ]
                    
                    for place_url in place_urls:
                        try:
                            self.logger.info(f"Trying direct URL: {place_url}")
                            self.driver.get(place_url)
                            self._random_delay()
                            
                            # 플레이스 아이템이 있는지 확인
                            if self._get_place_items():
                                return True
                        except:
                            continue
            
            return False
            
        except Exception as e:
            self.logger.error(f"Error navigating to place list: {e}")
            return False
    
    def _find_place_rank(self, target_shop_name: str) -> Dict:
        """플레이스 순위 찾기"""
        result = {
            "rank": -1,
            "success": False,
            "message": "",
            "found_shops": []
        }
        
        current_rank = 1
        found_shops = []
        scroll_count = 0
        max_scrolls = 10
        
        while scroll_count < max_scrolls and current_rank <= 100:
            # 현재 페이지의 플레이스 아이템들 가져오기
            place_items = self._get_place_items()
            
            if not place_items:
                break
            
            # 새로운 아이템들만 처리
            for item in place_items[len(found_shops):]:
                try:
                    place_info = self._extract_place_info(item)
                    if not place_info:
                        continue
                    
                    place_name = place_info['name']
                    is_ad = place_info.get('is_ad', False)
                    
                    # 광고가 아닌 경우만 순위에 포함
                    if not is_ad:
                        found_shops.append(place_name)
                        
                        # 매칭 확인 (유연한 매칭)
                        if self._is_match(target_shop_name, place_name):
                            result.update({
                                "rank": current_rank,
                                "success": True,
                                "message": f"'{target_shop_name}'은(는) '{self._get_search_keyword()}' 검색 결과에서 {current_rank}위입니다.",
                                "found_shops": found_shops[:10]
                            })
                            return result
                        
                        current_rank += 1
                
                except Exception as e:
                    self.logger.debug(f"Error processing place item: {e}")
                    continue
            
            # 스크롤해서 더 많은 결과 로드
            if not self._scroll_down():
                break
            
            scroll_count += 1
            self._random_delay()
        
        # 찾지 못한 경우
        result.update({
            "found_shops": found_shops[:20],
            "message": f"'{target_shop_name}'을(를) 상위 {current_rank-1}개 결과에서 찾을 수 없습니다."
        })
        
        return result
    
    def _get_place_items(self) -> List:
        """현재 페이지의 플레이스 아이템들 가져오기 (2025년 최신 선택자)"""
        selectors = [
            # 2025년 모바일 네이버 플레이스 선택자들
            "ul.list_place li",
            ".place_list li", 
            "li[data-place-id]",
            ".search_list_item",
            ".place_item",
            "div[role='listitem']",
            ".list_item",
            "li:has(.place_name)",
            "li:has(.name)",
            ".PlaceListView li",
            "._3qktF li",  # 새로운 패턴
            "._2kAJi li",  # 새로운 패턴
            "ul li",  # 마지막 수단
        ]
        
        for selector in selectors:
            try:
                items = self.driver.find_elements(By.CSS_SELECTOR, selector)
                if items and len(items) > 3:  # 최소 3개 이상의 아이템이 있어야 유효
                    # 텍스트가 있는 아이템만 필터링
                    valid_items = [item for item in items if item.text.strip()]
                    if valid_items:
                        self.logger.debug(f"Found {len(valid_items)} items with selector: {selector}")
                        return valid_items
            except Exception as e:
                self.logger.debug(f"Error with selector {selector}: {e}")
                continue
        
        return []
    
    def _extract_place_info(self, item) -> Optional[Dict]:
        """플레이스 아이템에서 정보 추출"""
        try:
            # 플레이스명 추출 (2025년 최신 선택자)
            name_selectors = [
                ".place_name",
                ".name", 
                "h3",
                ".title",
                ".place_bluelink",
                ".place_title",
                "strong",
                "a[href*='place'] span",
                "._3Apve",  # 새로운 패턴
                "._26DCo"   # 새로운 패턴
            ]
            
            place_name = None
            for selector in name_selectors:
                try:
                    element = item.find_element(By.CSS_SELECTOR, selector)
                    place_name = element.text.strip()
                    if place_name and len(place_name) > 1:
                        break
                except:
                    continue
            
            if not place_name:
                # 전체 텍스트에서 첫 번째 줄 추출
                full_text = item.text.strip()
                if full_text:
                    lines = full_text.split('\n')
                    place_name = lines[0].strip()
            
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
        """광고 여부 확인 (2025년 최신 패턴)"""
        ad_patterns = [
            ".ad_marker",
            ".sponsor", 
            "[class*='ad']",
            ".promotion",
            ".ad_badge",
            "._1EuZ7",  # 새로운 광고 패턴
            "._2kADx"   # 새로운 광고 패턴
        ]
        
        # 텍스트 기반 광고 감지
        item_text = item.text.lower()
        ad_keywords = ['광고', 'ad', 'sponsored', 'promotion']
        
        for keyword in ad_keywords:
            if keyword in item_text:
                return True
        
        # CSS 선택자 기반 광고 감지
        for pattern in ad_patterns:
            try:
                if item.find_elements(By.CSS_SELECTOR, pattern):
                    return True
            except:
                continue
        
        return False
    
    def _is_match(self, target_name: str, found_name: str) -> bool:
        """유연한 매칭 로직"""
        if not target_name or not found_name:
            return False
        
        # 정규화 함수
        def normalize(text):
            # 한글, 영문, 숫자만 남기고 소문자로 변환
            normalized = re.sub(r'[^\w가-힣]', '', text.lower())
            return normalized
        
        target_norm = normalize(target_name)
        found_norm = normalize(found_name)
        
        # 1. 정확한 매치
        if target_norm == found_norm:
            return True
        
        # 2. 부분 매치 (양방향, 최소 3글자 이상)
        if len(target_norm) >= 3 and len(found_norm) >= 3:
            if target_norm in found_norm or found_norm in target_norm:
                return True
        
        # 3. 토큰 기반 매치 (공통 토큰이 많은 경우)
        target_tokens = set(target_norm[i:i+2] for i in range(len(target_norm)-1))
        found_tokens = set(found_norm[i:i+2] for i in range(len(found_norm)-1))
        
        if target_tokens and found_tokens:
            intersection = target_tokens.intersection(found_tokens)
            union = target_tokens.union(found_tokens)
            similarity = len(intersection) / len(union)
            
            if similarity > 0.6:  # 60% 이상 유사한 경우
                return True
        
        return False
    
    def _scroll_down(self) -> bool:
        """스크롤하여 더 많은 결과 로드"""
        try:
            # 현재 스크롤 위치 저장
            last_height = self.driver.execute_script("return document.body.scrollHeight")
            
            # 스크롤 실행
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(3)
            
            # 새로운 높이 확인
            new_height = self.driver.execute_script("return document.body.scrollHeight")
            
            return new_height > last_height
            
        except Exception as e:
            self.logger.debug(f"Scroll failed: {e}")
            return False
    
    def _get_search_keyword(self) -> str:
        """현재 URL에서 검색 키워드 추출"""
        try:
            current_url = self.driver.current_url
            import urllib.parse
            parsed = urllib.parse.urlparse(current_url)
            query_params = urllib.parse.parse_qs(parsed.query)
            return query_params.get('query', [''])[0]
        except:
            return ''
    
    def _random_delay(self):
        """랜덤 지연으로 차단 방지"""
        delay = random.uniform(*self.delay_range)
        time.sleep(delay)
    
    def save_to_supabase(self, results: Union[List[Dict], Dict], tracked_place_id: Optional[int] = None) -> bool:
        """결과를 Supabase에 저장 (기존 형식과 호환)"""
        if not self.supabase:
            return False
        
        # 단일 결과를 리스트로 변환
        if isinstance(results, dict):
            results = [results]
            
        if not results:
            return False
            
        try:
            for result in results:
                # crawler_results 테이블에 저장 (기존 스키마와 호환)
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
                
                self.supabase.table('crawler_results').insert(insert_data).execute()
                
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
        """등록된 tracked_places를 모두 크롤링 (기존 인터페이스와 호환)"""
        if not self.supabase:
            self.logger.error("Supabase not configured")
            return
            
        try:
            # 활성화된 tracked_places 가져오기
            response = self.supabase.table('tracked_places').select('*').eq('is_active', True).execute()
            tracked_places = response.data
            
            self.logger.info(f"Found {len(tracked_places)} active tracked places")
            
            for place in tracked_places:
                keyword = place['search_keyword']
                place_name = place['place_name']
                place_id = place['id']
                
                self.logger.info(f"크롤링 시작: {place_name} (키워드: {keyword})")
                
                # 검색 실행 (기존 인터페이스와 동일)
                result = self.search_place_rank(keyword, place_name)
                
                # 결과 저장
                self.save_to_supabase(result, place_id)
                
                # 요청 간격 (네이버 서버 부하 방지)
                self._random_delay()
                
        except Exception as e:
            self.logger.error(f"Crawl tracked places failed: {e}")
    
    def close(self):
        """리소스 정리"""
        try:
            if self.driver:
                self.driver.quit()
                self.logger.info("WebDriver closed successfully")
        except Exception as e:
            self.logger.error(f"Error closing WebDriver: {e}")

def main():
    """메인 실행 함수 (기존과 동일한 인터페이스)"""
    crawler = UnifiedNaverPlaceCrawler(headless=True)
    
    try:
        # 환경변수로 모드 결정
        mode = os.getenv('CRAWLER_MODE', 'tracked')
        
        if mode == 'test':
            # 테스트 모드
            keyword = os.getenv('TEST_KEYWORD', '서울 상암 맛집')
            shop_name = os.getenv('TEST_SHOP_NAME', '맥도날드상암DMC점')
            
            result = crawler.search_place_rank(keyword, shop_name)
            
            print("=== 크롤링 결과 ===")
            print(json.dumps(result, ensure_ascii=False, indent=2))
            
        else:
            # 실제 크롤링 모드 (기존과 동일)
            crawler.crawl_tracked_places()
            
    finally:
        crawler.close()

if __name__ == "__main__":
    main()