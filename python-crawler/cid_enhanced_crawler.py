#!/usr/bin/env python3
"""
CID 기반 정확한 매칭을 지원하는 네이버 플레이스 크롤러
가이드 문서의 CID 추출 및 매칭 시스템 구현
"""
import time
import re
import random
import os
import logging
import json
from typing import Dict, List, Optional, Tuple
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from supabase import create_client, Client

class CIDEnhancedNaverCrawler:
    """CID 기반 정확한 매칭을 지원하는 네이버 플레이스 크롤러"""
    
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
        return logging.getLogger("CIDEnhancedNaverCrawler")
    
    def setup_driver(self, headless):
        """Chrome WebDriver 설정 (가이드 문서 기반)"""
        options = Options()
        
        if headless:
            options.add_argument('--headless')
        
        # 네이버 차단 우회 설정 (가이드 문서 참조)
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        # 모바일 User-Agent 설정 (가이드 문서 권장)
        options.add_argument('--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1')
        
        # 추가 설정
        options.add_argument('--disable-gpu')
        options.add_argument('--window-size=375,812')
        options.add_argument('--disable-web-security')
        options.add_argument('--allow-running-insecure-content')
        
        try:
            self.driver = webdriver.Chrome(options=options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            self.logger.info("Chrome WebDriver initialized with CID support")
        except Exception as e:
            self.logger.error(f"Failed to initialize WebDriver: {e}")
            raise
    
    def extract_place_cid(self, place_url: str) -> Optional[str]:
        """
        네이버 플레이스 URL에서 CID 추출 (가이드 문서 구현)
        
        Args:
            place_url (str): 네이버 플레이스 URL
            
        Returns:
            str: CID 또는 None
        """
        if not place_url:
            return None
        
        # URL 형식들: 
        # https://map.naver.com/p/12345678
        # https://place.map.naver.com/restaurant/12345678
        # https://m.place.naver.com/place/12345678
        cid_patterns = [
            r'/p/(\d+)',
            r'/restaurant/(\d+)',
            r'/place/(\d+)',
            r'id=(\d+)',
            r'cid=(\d+)'
        ]
        
        for pattern in cid_patterns:
            match = re.search(pattern, place_url)
            if match:
                cid = match.group(1)
                self.logger.debug(f"Extracted CID: {cid} from URL: {place_url}")
                return cid
        
        self.logger.warning(f"Could not extract CID from URL: {place_url}")
        return None
    
    def get_place_rank_by_cid(self, keyword: str, target_cid: str, max_depth=300) -> Dict:
        """
        CID를 기반으로 정확한 순위를 찾는 메인 함수 (가이드 문서 기반)
        
        Args:
            keyword (str): 검색 키워드
            target_cid (str): 찾을 플레이스의 CID
            max_depth (int): 최대 검색 깊이
            
        Returns:
            dict: 검색 결과
        """
        result = {
            'keyword': keyword,
            'target_cid': target_cid,
            'rank': None,
            'success': False,
            'message': '',
            'total_results': 0,
            'is_ad': False,
            'search_time': time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        try:
            self.logger.info(f"Starting CID-based search for CID '{target_cid}' with keyword '{keyword}'")
            
            # 모바일 네이버 검색 페이지 접속 (가이드 문서 URL)
            search_url = f"https://m.search.naver.com/search.naver?where=m&sm=top_sly.hst&fbm=0&acr=1&ie=utf8&query={keyword}"
            self.driver.get(search_url)
            self._random_delay()
            
            # 플레이스 더보기 버튼 클릭
            if not self._click_place_more_button():
                result['message'] = 'No place section found'
                return result
            
            # CID 기반 순위 검색
            rank_result = self._search_rank_with_cid_scroll(target_cid, max_depth)
            result.update(rank_result)
            
            if result['success']:
                self.logger.info(f"Found CID '{target_cid}' at rank {result['rank']}")
            else:
                self.logger.warning(f"Could not find CID '{target_cid}' in top {max_depth} results")
                
        except Exception as e:
            result['message'] = f"Error: {str(e)}"
            self.logger.error(f"Error in get_place_rank_by_cid: {e}")
        
        return result
    
    def _click_place_more_button(self) -> bool:
        """플레이스 섹션 더보기 버튼 클릭 (가이드 문서 기반)"""
        try:
            # 가이드 문서에서 제시한 선택자
            more_button_selector = "#place-main-section-root > div > div.rdX0R.POx9H > div > a"
            
            try:
                more_button = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.CSS_SELECTOR, more_button_selector))
                )
                
                self.logger.info(f"Found more button: {more_button.text}")
                more_button.click()
                self._random_delay()
                return True
                
            except TimeoutException:
                # 대안 선택자들 시도
                alternative_selectors = [
                    "a[href*='place']",
                    ".place_area .more_btn",
                    ".place_section .more",
                    "a:contains('더보기')"
                ]
                
                for selector in alternative_selectors:
                    try:
                        if selector.endswith("('더보기')"):
                            elements = self.driver.find_elements(By.XPATH, "//a[contains(text(), '더보기')]")
                            if elements:
                                element = elements[0]
                            else:
                                continue
                        else:
                            element = self.driver.find_element(By.CSS_SELECTOR, selector)
                        
                        href = element.get_attribute('href') or ''
                        if 'place' in href.lower():
                            self.logger.info(f"Using alternative selector: {selector}")
                            element.click()
                            self._random_delay()
                            return True
                            
                    except:
                        continue
            
            self.logger.warning("Could not find place more button")
            return False
            
        except Exception as e:
            self.logger.error(f"Error clicking place more button: {e}")
            return False
    
    def _search_rank_with_cid_scroll(self, target_cid: str, max_depth: int) -> Dict:
        """
        무한 스크롤을 통한 CID 기반 순위 검색 (가이드 문서 구현)
        """
        current_rank = 1
        found_rank = None
        is_advertisement = False
        scroll_attempts = 0
        max_scroll_attempts = 20
        total_results = 0
        
        while current_rank <= max_depth and scroll_attempts < max_scroll_attempts:
            # 현재 로드된 플레이스 아이템들 가져오기 (가이드 문서 선택자)
            place_items = self.driver.find_elements(By.CSS_SELECTOR, 'li[data-nclick*="plc"]')
            
            if not place_items:
                # 대안 선택자들
                alternative_selectors = [
                    'li[data-place-id]',
                    '.place_list li',
                    'ul.list_place li',
                    '.search_list_item'
                ]
                
                for selector in alternative_selectors:
                    place_items = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if place_items:
                        break
            
            if not place_items:
                self.logger.warning("No place items found")
                break
            
            total_results = len(place_items)
            
            for item in place_items[current_rank-1:]:
                try:
                    # CID 추출 시도
                    item_cid = self._extract_cid_from_item(item)
                    
                    if item_cid and item_cid == target_cid:
                        found_rank = current_rank
                        
                        # 광고 여부 확인 (가이드 문서 기반)
                        ad_indicators = item.find_elements(By.CSS_SELECTOR, '.ad_marker, .sponsor, [class*="ad"]')
                        is_advertisement = len(ad_indicators) > 0
                        
                        return {
                            'rank': found_rank,
                            'total_results': total_results,
                            'is_ad': is_advertisement,
                            'success': True,
                            'message': f'Found at rank {found_rank}'
                        }
                    
                    current_rank += 1
                    
                except Exception as e:
                    self.logger.debug(f"Error processing item at rank {current_rank}: {e}")
                    current_rank += 1
                    continue
            
            # 더 많은 결과를 위해 스크롤 (가이드 문서 방식)
            if not self._scroll_for_more_results():
                break
                
            scroll_attempts += 1
            self._random_delay()
        
        # 찾지 못한 경우
        return {
            'rank': None,
            'total_results': current_rank - 1,
            'is_ad': False,
            'success': False,
            'message': f'Not found in top {current_rank-1} results'
        }
    
    def _extract_cid_from_item(self, item) -> Optional[str]:
        """플레이스 아이템에서 CID 추출"""
        try:
            # data-nclick 속성에서 CID 추출 (가이드 문서 방식)
            nclick_attr = item.get_attribute('data-nclick')
            if nclick_attr and target_cid in nclick_attr:
                # CID 패턴 매칭
                cid_match = re.search(r'cid:(\d+)', nclick_attr)
                if cid_match:
                    return cid_match.group(1)
            
            # 링크에서 CID 추출
            links = item.find_elements(By.TAG_NAME, 'a')
            for link in links:
                href = link.get_attribute('href')
                if href:
                    cid = self.extract_place_cid(href)
                    if cid:
                        return cid
            
            # data-place-id 속성
            place_id = item.get_attribute('data-place-id')
            if place_id:
                return place_id
                
        except Exception as e:
            self.logger.debug(f"Error extracting CID from item: {e}")
        
        return None
    
    def _scroll_for_more_results(self) -> bool:
        """
        페이지 스크롤하여 더 많은 결과 로드 (가이드 문서 방식)
        """
        try:
            # ActionChains를 사용한 모바일 스크롤 (가이드 문서 구현)
            actions = ActionChains(self.driver)
            actions.scroll_by_amount(200, 20000).perform()  # 시작점에서 20000px 아래로 스크롤
            
            time.sleep(3)  # 로딩 대기
            return True
            
        except Exception as e:
            self.logger.debug(f"Scroll failed: {e}")
            return False
    
    def extract_multiple_place_cids(self, keyword: str, max_results=50) -> List[Dict]:
        """
        특정 키워드로 검색된 모든 플레이스의 CID를 추출 (가이드 문서 구현)
        
        Args:
            keyword (str): 검색 키워드
            max_results (int): 최대 추출할 플레이스 수
            
        Returns:
            list: [{'name': str, 'cid': str, 'category': str, 'address': str}]
        """
        places_data = []
        processed_cids = set()
        
        try:
            search_url = f"https://m.search.naver.com/search.naver?where=m&query={keyword}"
            self.driver.get(search_url)
            time.sleep(3)
            
            # 플레이스 더보기 클릭
            self._click_place_more_button()
            
            for _ in range(10):  # 최대 10번 스크롤
                place_items = self.driver.find_elements(By.CSS_SELECTOR, 'li[data-nclick*="plc"]')
                
                # 대안 선택자
                if not place_items:
                    place_items = self.driver.find_elements(By.CSS_SELECTOR, '.place_list li')
                
                for item in place_items:
                    if len(places_data) >= max_results:
                        break
                        
                    try:
                        # CID 추출
                        cid = self._extract_cid_from_item(item)
                        
                        if not cid or cid in processed_cids:
                            continue
                        
                        processed_cids.add(cid)
                        
                        # 플레이스 정보 추출
                        name_element = item.find_element(By.CSS_SELECTOR, '.place_name, .name, h3')
                        name = name_element.text.strip() if name_element else ''
                        
                        # 카테고리 추출
                        try:
                            category_element = item.find_element(By.CSS_SELECTOR, '.category, .etc_info')
                            category = category_element.text.strip()
                        except:
                            category = ''
                        
                        # 주소 추출
                        try:
                            address_element = item.find_element(By.CSS_SELECTOR, '.addr, .address')
                            address = address_element.text.strip()
                        except:
                            address = ''
                        
                        if name:
                            places_data.append({
                                'name': name,
                                'cid': cid,
                                'category': category,
                                'address': address
                            })
                        
                    except Exception as e:
                        self.logger.debug(f"Error processing place item: {e}")
                        continue
                
                if len(places_data) >= max_results:
                    break
                    
                # 다음 페이지 로드를 위한 스크롤
                self._scroll_for_more_results()
            
            self.logger.info(f"Extracted {len(places_data)} places with CIDs")
            return places_data
        
        except Exception as e:
            self.logger.error(f"Error extracting multiple place CIDs: {e}")
            return places_data
    
    def _random_delay(self):
        """랜덤 지연으로 차단 방지"""
        delay = random.uniform(*self.delay_range)
        time.sleep(delay)
    
    def save_to_supabase(self, results: List[Dict], tracked_place_id: Optional[int] = None) -> bool:
        """결과를 Supabase에 저장 (CID 정보 포함)"""
        if not self.supabase or not results:
            return False
            
        try:
            for result in results:
                # crawler_results 테이블에 저장
                insert_data = {
                    'tracked_place_id': tracked_place_id,
                    'keyword': result['keyword'],
                    'place_name': result.get('target_place_name', ''),
                    'place_cid': result.get('target_cid', ''),
                    'rank': result['rank'] if result['success'] else None,
                    'review_count': 0,
                    'visitor_review_count': 0,
                    'blog_review_count': 0,
                    'crawled_at': result['search_time'],
                    'success': result['success'],
                    'is_advertisement': result.get('is_ad', False),
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
        """등록된 tracked_places를 CID 기반으로 크롤링"""
        if not self.supabase:
            self.logger.error("Supabase not configured")
            return
            
        try:
            # CID가 있는 활성화된 tracked_places 가져오기
            response = self.supabase.table('tracked_places').select('*').eq('is_active', True).execute()
            tracked_places = response.data
            
            self.logger.info(f"Found {len(tracked_places)} active tracked places")
            
            results = []
            
            for place in tracked_places:
                keyword = place['search_keyword']
                place_name = place['place_name']
                place_cid = place.get('place_cid')  # CID가 있는 경우
                place_id = place['id']
                
                self.logger.info(f"Crawling: {place_name} (keyword: {keyword}, CID: {place_cid})")
                
                if place_cid:
                    # CID 기반 정확한 검색
                    result = self.get_place_rank_by_cid(keyword, place_cid)
                    result['target_place_name'] = place_name
                else:
                    # 기존 방식 (플레이스명 기반)
                    self.logger.warning(f"No CID found for {place_name}, using name-based search")
                    # 여기서 기존 크롤러의 search_place_rank 메소드 호출 가능
                    continue
                
                results.append(result)
                
                # 결과 즉시 저장
                self.save_to_supabase([result], place_id)
                
                # 요청 간격
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
    crawler = CIDEnhancedNaverCrawler(headless=False)  # 디버깅을 위해 headless=False
    
    try:
        # 환경변수로 모드 결정
        mode = os.getenv('CRAWLER_MODE', 'test')
        
        if mode == 'test':
            # 테스트 모드
            keyword = os.getenv('TEST_KEYWORD', '서울 상암 맛집')
            
            # 1. CID 추출 테스트
            print("=== CID 추출 테스트 ===")
            places = crawler.extract_multiple_place_cids(keyword, max_results=10)
            
            if places:
                print(f"추출된 플레이스 ({len(places)}개):")
                for i, place in enumerate(places, 1):
                    print(f"  {i}. {place['name']} (CID: {place['cid']})")
                
                # 첫 번째 플레이스로 순위 검색 테스트
                test_place = places[0]
                print(f"\n=== 순위 검색 테스트 ===")
                print(f"테스트 플레이스: {test_place['name']} (CID: {test_place['cid']})")
                
                result = crawler.get_place_rank_by_cid(keyword, test_place['cid'])
                
                print(f"키워드: {result['keyword']}")
                print(f"CID: {result['target_cid']}")
                print(f"성공: {result['success']}")
                print(f"순위: {result['rank']}")
                print(f"메시지: {result['message']}")
                print(f"광고 여부: {result['is_ad']}")
            else:
                print("플레이스를 찾을 수 없습니다.")
            
        elif mode == 'extract':
            # CID 추출 모드
            keyword = os.getenv('TEST_KEYWORD', '서울 상암 맛집')
            places = crawler.extract_multiple_place_cids(keyword, max_results=50)
            
            # JSON 파일로 저장
            with open('extracted_places.json', 'w', encoding='utf-8') as f:
                json.dump(places, f, ensure_ascii=False, indent=2)
            
            print(f"추출된 {len(places)}개 플레이스를 extracted_places.json에 저장했습니다.")
            
        else:
            # 실제 크롤링 모드
            crawler.crawl_tracked_places()
            
    finally:
        crawler.close()

if __name__ == "__main__":
    main()