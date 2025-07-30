#!/usr/bin/env python3
"""
2025년 5월 네이버 업데이트 반영 + IP 로테이션 지원 크롤러
- 최신 셀렉터: li[data-nclick*="plc"]
- IP 로테이션 및 CAPTCHA 회피
- 500 요청/일 제한 고려한 요청 관리
"""
import time
import re
import random
import os
import logging
import json
import hashlib
from typing import Dict, List, Optional, Union
from datetime import datetime, timedelta
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.proxy import Proxy, ProxyType
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
from supabase import create_client, Client

class Updated2025NaverCrawler:
    """
    2025년 5월 네이버 업데이트 반영 크롤러
    - 최신 HTML 구조 지원
    - IP 로테이션 시스템
    - CAPTCHA 회피 전략
    """
    
    def __init__(self, headless=True, delay_range=(5, 15), use_proxy=False, proxy_list=None):
        self.delay_range = delay_range
        self.use_proxy = use_proxy
        self.proxy_list = proxy_list or []
        self.current_proxy_index = 0
        self.request_count = 0
        self.daily_request_limit = 450  # 안전 마진을 두고 450개로 제한
        self.last_reset_date = datetime.now().date()
        
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
        
        # 사용자 에이전트 풀 (2025년 5월 기준 최신)
        self.user_agents = [
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1",
            "Mozilla/5.0 (Android 14; Mobile; rv:109.0) Gecko/109.0 Firefox/115.0",
            "Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/109.0 Firefox/114.0",
            "Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
            "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36"
        ]
    
    def _setup_logging(self):
        """로깅 설정"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        return logging.getLogger("Updated2025NaverCrawler")
    
    def _check_daily_limit(self):
        """일일 요청 제한 확인"""
        today = datetime.now().date()
        
        # 날짜가 바뀌면 카운터 리셋
        if today > self.last_reset_date:
            self.request_count = 0
            self.last_reset_date = today
            self.logger.info("Daily request counter reset")
        
        if self.request_count >= self.daily_request_limit:
            self.logger.warning(f"Daily request limit ({self.daily_request_limit}) reached. Switching IP or waiting...")
            
            if self.use_proxy and len(self.proxy_list) > 1:
                self._rotate_proxy()
                self.request_count = 0  # 프록시 변경 시 카운터 리셋
            else:
                # 프록시가 없으면 다음 날까지 대기
                tomorrow = datetime.combine(today + timedelta(days=1), datetime.min.time())
                wait_seconds = (tomorrow - datetime.now()).total_seconds()
                self.logger.info(f"Waiting {wait_seconds/3600:.1f} hours until tomorrow...")
                time.sleep(min(wait_seconds, 3600))  # 최대 1시간만 대기
                return False
        
        return True
    
    def _rotate_proxy(self):
        """프록시 로테이션"""
        if not self.proxy_list:
            return False
        
        self.current_proxy_index = (self.current_proxy_index + 1) % len(self.proxy_list)
        new_proxy = self.proxy_list[self.current_proxy_index]
        
        self.logger.info(f"Rotating to proxy: {new_proxy}")
        
        # WebDriver 재시작
        if self.driver:
            self.driver.quit()
        
        self.setup_driver(headless=True, proxy=new_proxy)
        return True
    
    def setup_driver(self, headless, proxy=None):
        """Chrome WebDriver 설정 (2025년 5월 최적화)"""
        options = Options()
        
        if headless:
            options.add_argument('--headless')
        
        # 2025년 5월 기준 최신 봇 탐지 우회 설정
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--disable-features=VizDisplayCompositor')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        # 추가 탐지 우회 설정
        options.add_argument('--disable-web-security')
        options.add_argument('--allow-running-insecure-content')
        options.add_argument('--disable-extensions')
        options.add_argument('--disable-plugins')
        options.add_argument('--disable-images')  # 이미지 로딩 비활성화로 속도 향상
        options.add_argument('--disable-javascript')  # 일부 JS 비활성화
        
        # 랜덤 User-Agent 선택
        user_agent = random.choice(self.user_agents)
        options.add_argument(f'--user-agent={user_agent}')
        
        # 모바일 뷰포트 설정
        mobile_sizes = [
            (375, 812),  # iPhone 13 mini
            (390, 844),  # iPhone 14
            (393, 873),  # Pixel 7
            (360, 800),  # Galaxy S21
        ]
        width, height = random.choice(mobile_sizes)
        options.add_argument(f'--window-size={width},{height}')
        
        # 프록시 설정
        if proxy and self.use_proxy:
            options.add_argument(f'--proxy-server={proxy}')
        
        # 추가 헤더 설정
        options.add_argument('--accept-lang=ko-KR,ko;q=0.9,en;q=0.8')
        
        try:
            self.driver = webdriver.Chrome(options=options)
            
            # 추가 봇 탐지 우회 스크립트
            self.driver.execute_script("""
                Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
                Object.defineProperty(navigator, 'languages', {get: () => ['ko-KR', 'ko', 'en-US', 'en']});
                window.chrome = {runtime: {}};
            """)
            
            self.driver.implicitly_wait(10)
            self.logger.info(f"Chrome WebDriver initialized with User-Agent: {user_agent}")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize WebDriver: {e}")
            raise
    
    def search_place_rank(self, keyword: str, shop_name: str) -> Dict:
        """
        2025년 5월 네이버 업데이트 반영 검색 함수
        """
        # 일일 요청 제한 확인
        if not self._check_daily_limit():
            return {
                "keyword": keyword,
                "shop_name": shop_name,
                "rank": -1,
                "success": False,
                "message": "Daily request limit reached",
                "search_time": time.strftime("%Y-%m-%d %H:%M:%S"),
                "found_shops": []
            }
        
        self.request_count += 1
        
        result = {
            "keyword": keyword,
            "shop_name": shop_name,
            "rank": -1,
            "success": False,
            "message": "",
            "search_time": time.strftime("%Y-%m-%d %H:%M:%S"),
            "found_shops": [],
            "request_count": self.request_count
        }
        
        try:
            self.logger.info(f"Starting search [{self.request_count}/{self.daily_request_limit}]: '{shop_name}' with keyword '{keyword}'")
            
            # 2025년 5월 기준 네이버 모바일 검색 URL
            search_url = f"https://m.search.naver.com/search.naver?where=m&sm=top_sly.hst&fbm=0&acr=1&ie=utf8&query={keyword}"
            
            self.driver.get(search_url)
            self._enhanced_random_delay()
            
            # CAPTCHA 감지
            if self._detect_captcha():
                result["message"] = "CAPTCHA detected - need to rotate IP"
                self.logger.warning("CAPTCHA detected!")
                
                if self.use_proxy:
                    self._rotate_proxy()
                
                return result
            
            # 플레이스 섹션으로 이동
            if not self._navigate_to_place_list_2025():
                result["message"] = "플레이스 섹션을 찾을 수 없습니다."
                return result
            
            # 2025년 5월 업데이트된 순위 검색
            rank_result = self._find_place_rank_2025(shop_name)
            result.update(rank_result)
            
            if result["success"]:
                self.logger.info(f"Found '{shop_name}' at rank {result['rank']}")
            else:
                self.logger.warning(f"Could not find '{shop_name}'")
                
        except Exception as e:
            result["message"] = f"오류 발생: {type(e).__name__} - {e}"
            self.logger.error(f"Error in search_place_rank: {e}")
        
        return result
    
    def _detect_captcha(self) -> bool:
        """CAPTCHA 감지"""
        try:
            # URL 기반 감지
            current_url = self.driver.current_url.lower()
            if any(keyword in current_url for keyword in ['captcha', 'block', 'verify', 'robot']):
                return True
            
            # 페이지 텍스트 기반 감지
            page_text = self.driver.page_source.lower()
            captcha_keywords = [
                'captcha', '보안문자', '자동입력', '로봇', 'robot',
                'verify', '인증', 'block', '차단', 'access denied'
            ]
            
            for keyword in captcha_keywords:
                if keyword in page_text:
                    return True
            
            # 특정 요소 기반 감지
            captcha_selectors = [
                "[class*='captcha']",
                "[id*='captcha']", 
                "[class*='verify']",
                "[class*='robot']"
            ]
            
            for selector in captcha_selectors:
                if self.driver.find_elements(By.CSS_SELECTOR, selector):
                    return True
            
            return False
            
        except Exception:
            return False
    
    def _navigate_to_place_list_2025(self) -> bool:
        """2025년 5월 업데이트된 플레이스 리스트 이동"""
        try:
            # 방법 1: 플레이스 더보기 버튼 (2025년 5월 업데이트된 선택자)
            place_more_selectors = [
                "a[href*='place'][href*='list']",
                ".place_area a[href*='more']",
                "#place-main-section-root a",
                ".place_section a:contains('더보기')",
                "a[data-nclick*='place']"
            ]
            
            for selector in place_more_selectors:
                try:
                    if "contains" in selector:
                        elements = self.driver.find_elements(By.XPATH, "//a[contains(text(), '더보기') and contains(@href, 'place')]")
                    else:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    
                    for element in elements:
                        try:
                            href = element.get_attribute('href') or ''
                            text = element.text.strip().lower()
                            
                            if 'place' in href and ('더보기' in text or 'more' in text or len(text) == 0):
                                self.logger.info(f"Clicking place more button: {href}")
                                self.driver.execute_script("arguments[0].click();", element)
                                self._enhanced_random_delay()
                                return True
                        except:
                            continue
                except:
                    continue
            
            # 방법 2: 직접 플레이스 리스트 URL (2025년 5월 패턴)
            current_url = self.driver.current_url
            if 'm.search.naver.com' in current_url:
                import urllib.parse
                parsed = urllib.parse.urlparse(current_url)
                query_params = urllib.parse.parse_qs(parsed.query)
                query = query_params.get('query', [''])[0]
                
                if query:
                    # 2025년 5월 기준 플레이스 리스트 URL 패턴들
                    place_urls = [
                        f"https://m.place.naver.com/list?query={query}&entry=pll",
                        f"https://m.place.naver.com/restaurant/list?query={query}",
                        f"https://m.search.naver.com/search.naver?where=place&query={query}&sm=tab_opt"
                    ]
                    
                    for place_url in place_urls:
                        try:
                            self.logger.info(f"Trying direct URL: {place_url}")
                            self.driver.get(place_url)
                            self._enhanced_random_delay()
                            
                            # 2025년 5월 업데이트된 선택자로 플레이스 아이템 확인
                            if self._get_place_items_2025():
                                return True
                        except:
                            continue
            
            return False
            
        except Exception as e:
            self.logger.error(f"Error navigating to place list: {e}")
            return False
    
    def _get_place_items_2025(self) -> List:
        """2025년 5월 업데이트된 플레이스 아이템 선택자"""
        # 2025년 5월 기준 최신 선택자들 (우선순위 순)
        selectors_2025 = [
            'li[data-nclick*="plc"]',  # 🎯 메인 선택자 (2025년 5월 업데이트)
            'li.place_unit',           # 백업 선택자 1
            'li[data-place-id]',       # 백업 선택자 2
            'ul.list_place li',        # 백업 선택자 3
            '.place_list li',          # 백업 선택자 4
            'li.place_item',           # 백업 선택자 5
        ]
        
        for selector in selectors_2025:
            try:
                items = self.driver.find_elements(By.CSS_SELECTOR, selector)
                
                # 텍스트가 있는 실제 아이템만 필터링
                valid_items = []
                for item in items:
                    try:
                        text = item.text.strip()
                        if text and len(text) > 10:  # 최소 10자 이상의 텍스트가 있어야 유효
                            valid_items.append(item)
                    except:
                        continue
                
                if valid_items and len(valid_items) >= 3:  # 최소 3개 이상의 유효한 아이템
                    self.logger.info(f"Found {len(valid_items)} items with selector: {selector}")
                    return valid_items
                    
            except Exception as e:
                self.logger.debug(f"Error with selector {selector}: {e}")
                continue
        
        self.logger.warning("No place items found with any 2025 selectors")
        return []
    
    def _find_place_rank_2025(self, target_shop_name: str) -> Dict:
        """2025년 5월 업데이트 반영 순위 검색"""
        result = {
            "rank": -1,
            "success": False,
            "message": "",
            "found_shops": []
        }
        
        current_rank = 1
        found_shops = []
        scroll_count = 0
        max_scrolls = 8  # 스크롤 횟수 제한
        
        while scroll_count < max_scrolls and current_rank <= 50:  # 상위 50개까지만
            # 2025년 5월 업데이트된 플레이스 아이템 가져오기
            place_items = self._get_place_items_2025()
            
            if not place_items:
                self.logger.warning("No place items found")
                break
            
            # 새로운 아이템들만 처리
            for item in place_items[len(found_shops):]:
                try:
                    place_info = self._extract_place_info_2025(item)
                    if not place_info:
                        continue
                    
                    place_name = place_info['name']
                    is_ad = place_info.get('is_ad', False)
                    
                    # 광고가 아닌 경우만 순위에 포함
                    if not is_ad:
                        found_shops.append(place_name)
                        
                        # 유연한 매칭 (2025년 업데이트)
                        if self._is_match_2025(target_shop_name, place_name):
                            result.update({
                                "rank": current_rank,
                                "success": True,
                                "message": f"'{target_shop_name}'은(는) '{self._get_search_keyword()}' 검색 결과에서 {current_rank}위입니다.",
                                "found_shops": found_shops[:10]
                            })
                            return result
                        
                        current_rank += 1
                        
                        # 50위까지만 확인
                        if current_rank > 50:
                            break
                
                except Exception as e:
                    self.logger.debug(f"Error processing place item: {e}")
                    continue
            
            # 더 많은 결과를 위한 스크롤
            if not self._scroll_with_loading_wait():
                break
            
            scroll_count += 1
            self._enhanced_random_delay(min_delay=2, max_delay=5)
        
        # 찾지 못한 경우
        result.update({
            "found_shops": found_shops[:20],
            "message": f"'{target_shop_name}'을(를) 상위 {min(current_rank-1, 50)}개 결과에서 찾을 수 없습니다."
        })
        
        return result
    
    def _extract_place_info_2025(self, item) -> Optional[Dict]:
        """2025년 5월 업데이트된 플레이스 정보 추출"""
        try:
            # 2025년 5월 기준 플레이스명 선택자들
            name_selectors_2025 = [
                ".place_bluelink",         # 메인 선택자
                ".place_name",             # 백업 1
                ".name",                   # 백업 2
                "a[href*='place'] span",   # 백업 3
                "strong",                  # 백업 4
                "h3",                      # 백업 5
                ".title"                   # 백업 6
            ]
            
            place_name = None
            for selector in name_selectors_2025:
                try:
                    element = item.find_element(By.CSS_SELECTOR, selector)
                    text = element.text.strip()
                    if text and len(text) > 1 and not text.isdigit():
                        place_name = text
                        break
                except:
                    continue
            
            # 선택자로 찾지 못한 경우 전체 텍스트에서 추출
            if not place_name:
                full_text = item.text.strip()
                if full_text:
                    lines = [line.strip() for line in full_text.split('\n') if line.strip()]
                    if lines:
                        # 첫 번째 줄에서 가장 긴 텍스트 추출
                        place_name = max(lines[0].split(), key=len) if lines[0] else None
            
            if not place_name or len(place_name) < 2:
                return None
            
            # 2025년 5월 업데이트된 광고 감지
            is_ad = self._is_advertisement_2025(item)
            
            return {
                'name': place_name,
                'is_ad': is_ad
            }
            
        except Exception as e:
            self.logger.debug(f"Error extracting place info: {e}")
            return None
    
    def _is_advertisement_2025(self, item) -> bool:
        """2025년 5월 업데이트된 광고 감지"""
        try:
            # 2025년 5월 기준 광고 패턴들
            ad_patterns_2025 = [
                "[class*='ad']",
                "[class*='sponsor']",
                "[class*='promotion']",
                ".ad_marker",
                ".ad_badge",
                "[data-ad]",
                "[data-sponsor]"
            ]
            
            # CSS 선택자 기반 감지
            for pattern in ad_patterns_2025:
                if item.find_elements(By.CSS_SELECTOR, pattern):
                    return True
            
            # 텍스트 기반 감지 (2025년 패턴)
            item_text = item.text.lower()
            ad_keywords_2025 = [
                '광고', 'ad', 'sponsored', 'promotion', 
                '홍보', '협찬', 'pr', '스폰서'
            ]
            
            for keyword in ad_keywords_2025:
                if keyword in item_text:
                    return True
            
            # data-nclick 속성에서 광고 감지
            nclick_attr = item.get_attribute('data-nclick')
            if nclick_attr and any(ad_word in nclick_attr.lower() for ad_word in ['ad', 'sponsor', 'promotion']):
                return True
            
            return False
            
        except Exception:
            return False
    
    def _is_match_2025(self, target_name: str, found_name: str) -> bool:
        """2025년 업데이트된 유연한 매칭 로직"""
        if not target_name or not found_name:
            return False
        
        # 정규화 함수 (한글, 영문, 숫자만)
        def normalize_2025(text):
            # 특수문자 제거 후 소문자 변환
            normalized = re.sub(r'[^\w가-힣0-9]', '', text.lower())
            return normalized
        
        target_norm = normalize_2025(target_name)
        found_norm = normalize_2025(found_name)
        
        # 1. 정확한 매치
        if target_norm == found_norm:
            return True
        
        # 2. 포함 관계 (최소 4글자)
        if len(target_norm) >= 4 and len(found_norm) >= 4:
            if target_norm in found_norm or found_norm in target_norm:
                return True
        
        # 3. Jaccard 유사도 (2글자 조합)
        if len(target_norm) >= 4 and len(found_norm) >= 4:
            target_bigrams = set(target_norm[i:i+2] for i in range(len(target_norm)-1))
            found_bigrams = set(found_norm[i:i+2] for i in range(len(found_norm)-1))
            
            if target_bigrams and found_bigrams:
                intersection = target_bigrams.intersection(found_bigrams)
                union = target_bigrams.union(found_bigrams)
                similarity = len(intersection) / len(union)
                
                if similarity >= 0.7:  # 70% 이상 유사
                    return True
        
        # 4. 핵심 키워드 매치 (브랜드명 등)
        target_keywords = re.findall(r'[가-힣]{2,}|[a-zA-Z]{3,}', target_name)
        found_keywords = re.findall(r'[가-힣]{2,}|[a-zA-Z]{3,}', found_name)
        
        for target_kw in target_keywords:
            for found_kw in found_keywords:
                if target_kw.lower() in found_kw.lower() or found_kw.lower() in target_kw.lower():
                    if len(target_kw) >= 3:  # 최소 3글자 키워드
                        return True
        
        return False
    
    def _scroll_with_loading_wait(self) -> bool:
        """로딩 대기가 포함된 스크롤"""
        try:
            # 현재 아이템 개수 저장
            initial_items = len(self._get_place_items_2025())
            
            # 스크롤 실행
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            
            # 로딩 대기 (최대 10초)
            for _ in range(20):  # 0.5초씩 20번 = 10초
                time.sleep(0.5)
                current_items = len(self._get_place_items_2025())
                
                if current_items > initial_items:
                    self.logger.debug(f"New items loaded: {initial_items} -> {current_items}")
                    return True
            
            return False  # 새 아이템이 로드되지 않음
            
        except Exception as e:
            self.logger.debug(f"Scroll failed: {e}")
            return False
    
    def _enhanced_random_delay(self, min_delay=None, max_delay=None):
        """향상된 랜덤 지연 (CAPTCHA 회피)"""
        if min_delay is None or max_delay is None:
            min_delay, max_delay = self.delay_range
        
        # 기본 지연
        delay = random.uniform(min_delay, max_delay)
        
        # 요청 횟수에 따른 추가 지연 (CAPTCHA 회피)
        if self.request_count > 100:
            delay += random.uniform(5, 10)  # 100회 이후 5-10초 추가
        elif self.request_count > 200:
            delay += random.uniform(10, 20)  # 200회 이후 10-20초 추가
        elif self.request_count > 300:
            delay += random.uniform(20, 40)  # 300회 이후 20-40초 추가
        
        self.logger.debug(f"Waiting {delay:.2f} seconds...")
        time.sleep(delay)
    
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
    
    def save_to_supabase(self, results: Union[List[Dict], Dict], tracked_place_id: Optional[int] = None) -> bool:
        """결과를 Supabase에 저장 (요청 횟수 정보 포함)"""
        if not self.supabase:
            return False
        
        if isinstance(results, dict):
            results = [results]
            
        if not results:
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
                    'error_message': result['message'] if not result['success'] else None,
                    'request_count': result.get('request_count', self.request_count)  # 요청 횟수 추가
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
        """등록된 tracked_places를 모두 크롤링 (개선된 버전)"""
        if not self.supabase:
            self.logger.error("Supabase not configured")
            return
            
        try:
            # 활성화된 tracked_places 가져오기
            response = self.supabase.table('tracked_places').select('*').eq('is_active', True).execute()
            tracked_places = response.data
            
            self.logger.info(f"Found {len(tracked_places)} active tracked places")
            
            if len(tracked_places) > self.daily_request_limit - self.request_count:
                self.logger.warning(f"Too many places to crawl today. Limiting to {self.daily_request_limit - self.request_count}")
                tracked_places = tracked_places[:self.daily_request_limit - self.request_count]
            
            for i, place in enumerate(tracked_places, 1):
                keyword = place['search_keyword']
                place_name = place['place_name']
                place_id = place['id']
                
                self.logger.info(f"크롤링 [{i}/{len(tracked_places)}]: {place_name} (키워드: {keyword})")
                
                # 검색 실행
                result = self.search_place_rank(keyword, place_name)
                
                # 결과 저장
                self.save_to_supabase(result, place_id)
                
                # CAPTCHA 발생 시 중단
                if "CAPTCHA detected" in result.get('message', ''):
                    self.logger.error("CAPTCHA detected. Stopping crawling session.")
                    break
                
                # 일일 한도 도달 시 중단  
                if self.request_count >= self.daily_request_limit:
                    self.logger.info("Daily request limit reached. Stopping.")
                    break
                
                # 향상된 지연
                self._enhanced_random_delay()
                
        except Exception as e:
            self.logger.error(f"Crawl tracked places failed: {e}")
    
    def close(self):
        """리소스 정리"""
        try:
            if self.driver:
                self.driver.quit()
                self.logger.info(f"WebDriver closed. Total requests made: {self.request_count}")
        except Exception as e:
            self.logger.error(f"Error closing WebDriver: {e}")

def main():
    """메인 실행 함수 (2025년 5월 업데이트)"""
    
    # 프록시 리스트 (예시 - 실제 프록시로 교체 필요)
    proxy_list = [
        # "http://proxy1:port",
        # "http://proxy2:port", 
        # "http://proxy3:port"
    ]
    
    # 프록시 사용 여부
    use_proxy = len(proxy_list) > 0
    
    crawler = Updated2025NaverCrawler(
        headless=True, 
        delay_range=(8, 20),  # 더 긴 지연 시간
        use_proxy=use_proxy,
        proxy_list=proxy_list
    )
    
    try:
        mode = os.getenv('CRAWLER_MODE', 'test')
        
        if mode == 'test':
            # 테스트 모드
            keyword = os.getenv('TEST_KEYWORD', '서울 상암 맛집')
            shop_name = os.getenv('TEST_SHOP_NAME', '맥도날드상암DMC점')
            
            result = crawler.search_place_rank(keyword, shop_name)
            
            print("=== 2025년 5월 업데이트 크롤링 결과 ===")
            print(json.dumps(result, ensure_ascii=False, indent=2))
            
        else:
            # 실제 크롤링 모드
            crawler.crawl_tracked_places()
            
    finally:
        crawler.close()

if __name__ == "__main__":
    main()