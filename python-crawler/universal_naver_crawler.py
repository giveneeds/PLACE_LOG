#!/usr/bin/env python3
"""
범용 네이버 플레이스 크롤러 (2025년 5월 업데이트)
- 모든 지역, 모든 업종, 모든 키워드 지원
- 하드코딩 제거한 완전 동적 처리
- 대량 배치 처리 최적화
"""
import time
import re
import random
import os
import logging
import json
import hashlib
from typing import Dict, List, Optional, Union, Tuple
from datetime import datetime, timedelta
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
from supabase import create_client, Client

class UniversalNaverCrawler:
    """
    범용 네이버 플레이스 크롤러
    - 모든 지역/업종 지원
    - 완전 동적 처리
    - 배치 최적화
    """
    
    def __init__(self, headless=True, delay_range=(5, 15), use_proxy=False, proxy_list=None):
        self.delay_range = delay_range
        self.use_proxy = use_proxy
        self.proxy_list = proxy_list or []
        self.current_proxy_index = 0
        self.request_count = 0
        self.daily_request_limit = 450
        self.last_reset_date = datetime.now().date()
        
        self.logger = self._setup_logging()
        
        # 2025년 5월 최신 User-Agent 풀 (setup_driver보다 먼저 정의)
        self.user_agents = [
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
            "Mozilla/5.0 (Android 14; Mobile; rv:125.0) Gecko/125.0 Firefox/125.0",
            "Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
            "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
        ]
        
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
        
        # 성능 통계
        self.stats = {
            'total_searches': 0,
            'successful_searches': 0,
            'failed_searches': 0,
            'captcha_encounters': 0,
            'avg_response_time': 0.0,
            'search_history': []
        }
    
    def _setup_logging(self):
        """로깅 설정"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        return logging.getLogger("UniversalNaverCrawler")
    
    def setup_driver(self, headless, proxy=None):
        """Chrome WebDriver 설정"""
        options = Options()
        
        if headless:
            options.add_argument('--headless')
        
        # 봇 탐지 우회 설정
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--disable-features=VizDisplayCompositor')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        # 성능 최적화
        options.add_argument('--disable-extensions')
        options.add_argument('--disable-plugins')
        options.add_argument('--disable-images')
        options.add_argument('--disable-javascript')
        
        # 랜덤 User-Agent
        user_agent = random.choice(self.user_agents)
        options.add_argument(f'--user-agent={user_agent}')
        
        # 랜덤 뷰포트
        mobile_sizes = [(375, 812), (390, 844), (393, 873), (360, 800)]
        width, height = random.choice(mobile_sizes)
        options.add_argument(f'--window-size={width},{height}')
        
        # 프록시 설정
        if proxy and self.use_proxy:
            options.add_argument(f'--proxy-server={proxy}')
        
        try:
            self.driver = webdriver.Chrome(options=options)
            self.driver.execute_script("""
                Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
                Object.defineProperty(navigator, 'languages', {get: () => ['ko-KR', 'ko', 'en-US', 'en']});
            """)
            self.driver.implicitly_wait(10)
            self.logger.info(f"WebDriver initialized")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize WebDriver: {e}")
            raise
    
    def search_place_rank(self, keyword: str, target_place_name: str, max_rank: int = 50) -> Dict:
        """
        범용 플레이스 순위 검색
        
        Args:
            keyword (str): 검색 키워드 (예: "강남 맛집", "홍대 카페", "부산 치킨" 등)
            target_place_name (str): 찾을 플레이스명 (예: "스타벅스", "맥도날드", "교촌치킨" 등)
            max_rank (int): 최대 검색 순위 (기본 50위)
            
        Returns:
            dict: 검색 결과
        """
        search_start_time = time.time()
        
        # 요청 제한 확인
        if not self._check_daily_limit():
            return self._create_error_result(keyword, target_place_name, "Daily request limit reached")
        
        self.request_count += 1
        self.stats['total_searches'] += 1
        
        result = {
            "keyword": keyword,
            "shop_name": target_place_name,
            "rank": -1,
            "success": False,
            "message": "",
            "search_time": time.strftime("%Y-%m-%d %H:%M:%S"),
            "found_shops": [],
            "request_count": self.request_count,
            "search_region": self._extract_region(keyword),
            "search_category": self._extract_category(keyword)
        }
        
        try:
            self.logger.info(f"Searching [{self.request_count}]: '{target_place_name}' in '{keyword}' (max rank: {max_rank})")
            
            # 네이버 모바일 검색 URL 구성
            search_url = f"https://m.search.naver.com/search.naver?where=m&sm=top_sly.hst&fbm=0&acr=1&ie=utf8&query={keyword}"
            
            self.driver.get(search_url)
            self._smart_delay()
            
            # CAPTCHA 감지
            if self._detect_captcha():
                self.stats['captcha_encounters'] += 1
                result["message"] = "CAPTCHA detected - IP rotation needed"
                self.logger.warning("CAPTCHA detected!")
                
                if self.use_proxy and len(self.proxy_list) > 1:
                    self._rotate_proxy()
                
                return result
            
            # 플레이스 섹션으로 이동
            if not self._navigate_to_place_list():
                result["message"] = "플레이스 섹션을 찾을 수 없습니다."
                return result
            
            # 순위 검색 실행
            rank_result = self._find_place_rank_universal(target_place_name, max_rank)
            result.update(rank_result)
            
            # 검색 시간 기록
            search_duration = time.time() - search_start_time
            result["search_duration"] = round(search_duration, 2)
            
            # 통계 업데이트
            if result["success"]:
                self.stats['successful_searches'] += 1
                self.logger.info(f"✅ Found '{target_place_name}' at rank {result['rank']} in {search_duration:.2f}s")
            else:
                self.stats['failed_searches'] += 1
                self.logger.warning(f"❌ Not found '{target_place_name}' in top {max_rank}")
            
            # 검색 히스토리 기록
            self.stats['search_history'].append({
                'keyword': keyword,
                'target': target_place_name,
                'success': result['success'],
                'rank': result['rank'],
                'duration': search_duration,
                'timestamp': result['search_time']
            })
            
            # 히스토리 크기 제한 (최근 100개만)
            if len(self.stats['search_history']) > 100:
                self.stats['search_history'] = self.stats['search_history'][-100:]
                
        except Exception as e:
            result["message"] = f"오류 발생: {type(e).__name__} - {e}"
            self.logger.error(f"❌ Error in search: {e}")
            self.stats['failed_searches'] += 1
        
        return result
    
    def batch_search(self, search_tasks: List[Dict], batch_size: int = 10) -> List[Dict]:
        """
        배치 검색 (대량 처리 최적화)
        
        Args:
            search_tasks: [{"keyword": "강남 맛집", "shop_name": "스타벅스", "max_rank": 30}, ...]
            batch_size: 배치 크기 (IP 로테이션 주기)
            
        Returns:
            List[Dict]: 검색 결과 리스트
        """
        self.logger.info(f"Starting batch search: {len(search_tasks)} tasks")
        
        results = []
        processed = 0
        
        for i in range(0, len(search_tasks), batch_size):
            batch = search_tasks[i:i+batch_size]
            batch_start_time = time.time()
            
            self.logger.info(f"Processing batch {i//batch_size + 1}: {len(batch)} tasks")
            
            for task in batch:
                keyword = task['keyword']
                shop_name = task['shop_name']
                max_rank = task.get('max_rank', 50)
                
                result = self.search_place_rank(keyword, shop_name, max_rank)
                results.append(result)
                processed += 1
                
                # CAPTCHA 발생 시 배치 중단
                if "CAPTCHA detected" in result.get('message', ''):
                    self.logger.error("CAPTCHA detected. Pausing batch processing.")
                    time.sleep(300)  # 5분 대기
                    break
                
                # 일일 한도 도달 시 중단
                if self.request_count >= self.daily_request_limit:
                    self.logger.info("Daily limit reached. Stopping batch.")
                    break
                
                # 배치 내 지연
                self._smart_delay(factor=0.5)  # 배치 내에서는 짧은 지연
            
            batch_duration = time.time() - batch_start_time
            self.logger.info(f"Batch completed in {batch_duration:.2f}s. Processed: {processed}/{len(search_tasks)}")
            
            # 배치 간 긴 지연 (IP 보호)
            if i + batch_size < len(search_tasks):
                inter_batch_delay = random.uniform(30, 60)
                self.logger.info(f"Inter-batch delay: {inter_batch_delay:.1f}s")
                time.sleep(inter_batch_delay)
                
                # IP 로테이션 (선택적)
                if self.use_proxy and len(self.proxy_list) > 1:
                    self._rotate_proxy()
        
        success_rate = sum(1 for r in results if r['success']) / len(results) * 100 if results else 0
        self.logger.info(f"Batch search completed. Success rate: {success_rate:.1f}%")
        
        return results
    
    def _extract_region(self, keyword: str) -> str:
        """키워드에서 지역 추출"""
        regions = [
            '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
            '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
            '강남', '홍대', '명동', '이태원', '신촌', '건대', '상암', '여의도',
            '해운대', '서면', '동성로', '중구', '남구', '북구', '동구', '서구'
        ]
        
        for region in regions:
            if region in keyword:
                return region
        
        return "전국"
    
    def _extract_category(self, keyword: str) -> str:
        """키워드에서 업종 추출"""
        categories = {
            '맛집': ['맛집', '음식점', '레스토랑'],
            '카페': ['카페', '커피', '디저트'],
            '치킨': ['치킨', '닭', '프라이드'],
            '피자': ['피자'],
            '중국음식': ['중국집', '중화요리', '짜장면'],
            '일식': ['일식', '초밥', '라멘', '우동'],
            '한식': ['한식', '불고기', '갈비', '김치찌개'],
            '분식': ['분식', '떡볶이', '순대', '김밥'],
            '술집': ['술집', '포차', '호프', '맥주'],
            '병원': ['병원', '의원', '클리닉'],
            '약국': ['약국'],
            '미용': ['미용실', '헤어샵', '네일샵'],
            '학원': ['학원', '교육'],
            '숙박': ['호텔', '모텔', '펜션', '게스트하우스']
        }
        
        keyword_lower = keyword.lower()
        for category, keywords in categories.items():
            for kw in keywords:
                if kw in keyword_lower:
                    return category
        
        return "기타"
    
    def _check_daily_limit(self) -> bool:
        """일일 요청 제한 확인"""
        today = datetime.now().date()
        
        if today > self.last_reset_date:
            self.request_count = 0
            self.last_reset_date = today
            self.logger.info("Daily request counter reset")
        
        if self.request_count >= self.daily_request_limit:
            self.logger.warning(f"Daily request limit ({self.daily_request_limit}) reached")
            return False
        
        return True
    
    def _rotate_proxy(self):
        """프록시 로테이션"""
        if not self.proxy_list:
            return
        
        self.current_proxy_index = (self.current_proxy_index + 1) % len(self.proxy_list)
        new_proxy = self.proxy_list[self.current_proxy_index]
        
        self.logger.info(f"Rotating to proxy: {new_proxy}")
        
        if self.driver:
            self.driver.quit()
        
        self.setup_driver(headless=True, proxy=new_proxy)
    
    def _detect_captcha(self) -> bool:
        """CAPTCHA 감지"""
        try:
            current_url = self.driver.current_url.lower()
            if any(keyword in current_url for keyword in ['captcha', 'block', 'verify', 'robot']):
                return True
            
            page_text = self.driver.page_source.lower()
            captcha_keywords = ['captcha', '보안문자', '자동입력', '로봇', 'verify', '인증', 'block', '차단']
            
            return any(keyword in page_text for keyword in captcha_keywords)
            
        except Exception:
            return False
    
    def _navigate_to_place_list(self) -> bool:
        """플레이스 리스트로 이동"""
        try:
            # 플레이스 더보기 버튼 찾기
            place_selectors = [
                "a[href*='place'][href*='list']",
                ".place_area a[href*='more']",
                "#place-main-section-root a"
            ]
            
            for selector in place_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for element in elements:
                        href = element.get_attribute('href') or ''
                        if 'place' in href:
                            self.driver.execute_script("arguments[0].click();", element)
                            self._smart_delay()
                            return True
                except:
                    continue
            
            # 직접 URL 구성
            current_url = self.driver.current_url
            if 'm.search.naver.com' in current_url:
                import urllib.parse
                parsed = urllib.parse.urlparse(current_url)
                query_params = urllib.parse.parse_qs(parsed.query)
                query = query_params.get('query', [''])[0]
                
                if query:
                    place_url = f"https://m.place.naver.com/list?query={query}&entry=pll"
                    self.driver.get(place_url)
                    self._smart_delay()
                    return True
            
            return False
            
        except Exception as e:
            self.logger.error(f"Error navigating to place list: {e}")
            return False
    
    def _find_place_rank_universal(self, target_place_name: str, max_rank: int) -> Dict:
        """범용 순위 검색"""
        result = {
            "rank": -1,
            "success": False,
            "message": "",
            "found_shops": []
        }
        
        current_rank = 1
        found_shops = []
        scroll_count = 0
        max_scrolls = min(max_rank // 10, 15)  # 효율적인 스크롤 제한
        
        while scroll_count < max_scrolls and current_rank <= max_rank:
            # 2025년 5월 최신 셀렉터로 플레이스 아이템 가져오기
            place_items = self._get_place_items_2025()
            
            if not place_items:
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
                        
                        # 범용 매칭 (모든 지역/업종 대응)
                        if self._is_universal_match(target_place_name, place_name):
                            result.update({
                                "rank": current_rank,
                                "success": True,
                                "message": f"'{target_place_name}' found at rank {current_rank}",
                                "found_shops": found_shops[:15]  # 상위 15개만
                            })
                            return result
                        
                        current_rank += 1
                        
                        if current_rank > max_rank:
                            break
                
                except Exception as e:
                    self.logger.debug(f"Error processing item: {e}")
                    continue
            
            # 다음 페이지 로드를 위한 스크롤
            if not self._scroll_with_loading_wait():
                break
            
            scroll_count += 1
            self._smart_delay(factor=0.3)  # 스크롤 간 짧은 지연
        
        # 찾지 못한 경우
        result.update({
            "found_shops": found_shops[:20],
            "message": f"'{target_place_name}' not found in top {min(current_rank-1, max_rank)} results"
        })
        
        return result
    
    def _get_place_items_2025(self) -> List:
        """2025년 5월 최신 플레이스 아이템 선택자"""
        selectors = [
            'li[data-nclick*="plc"]',  # 메인 (2025년 5월)
            'li.place_unit',           # 백업 1
            'li[data-place-id]',       # 백업 2
            'ul.list_place li',        # 백업 3
            '.place_list li'           # 백업 4
        ]
        
        for selector in selectors:
            try:
                items = self.driver.find_elements(By.CSS_SELECTOR, selector)
                valid_items = [item for item in items if item.text.strip() and len(item.text.strip()) > 10]
                
                if valid_items and len(valid_items) >= 3:
                    return valid_items
                    
            except Exception:
                continue
        
        return []
    
    def _extract_place_info_2025(self, item) -> Optional[Dict]:
        """2025년 5월 플레이스 정보 추출"""
        try:
            # 플레이스명 선택자들
            name_selectors = [
                ".place_bluelink",
                ".place_name", 
                ".name",
                "a[href*='place'] span",
                "strong",
                "h3"
            ]
            
            place_name = None
            for selector in name_selectors:
                try:
                    element = item.find_element(By.CSS_SELECTOR, selector)
                    text = element.text.strip()
                    if text and len(text) > 1 and not text.isdigit():
                        place_name = text
                        break
                except:
                    continue
            
            if not place_name:
                # 전체 텍스트에서 추출
                full_text = item.text.strip()
                if full_text:
                    lines = [line.strip() for line in full_text.split('\n') if line.strip()]
                    if lines:
                        place_name = lines[0]
            
            if not place_name or len(place_name) < 2:
                return None
            
            # 광고 감지
            is_ad = self._is_advertisement_2025(item)
            
            return {
                'name': place_name,
                'is_ad': is_ad
            }
            
        except Exception:
            return None
    
    def _is_advertisement_2025(self, item) -> bool:
        """2025년 5월 광고 감지"""
        try:
            # CSS 기반 감지
            ad_patterns = [
                "[class*='ad']", "[class*='sponsor']", "[class*='promotion']",
                ".ad_marker", ".ad_badge", "[data-ad]"
            ]
            
            for pattern in ad_patterns:
                if item.find_elements(By.CSS_SELECTOR, pattern):
                    return True
            
            # 텍스트 기반 감지
            item_text = item.text.lower()
            ad_keywords = ['광고', 'ad', 'sponsored', 'promotion', '홍보', '협찬']
            
            return any(keyword in item_text for keyword in ad_keywords)
            
        except Exception:
            return False
    
    def _is_universal_match(self, target_name: str, found_name: str) -> bool:
        """범용 매칭 로직 (모든 지역/업종 대응)"""
        if not target_name or not found_name:
            return False
        
        def normalize_text(text):
            # 특수문자, 공백 제거 후 소문자 변환
            normalized = re.sub(r'[^\w가-힣0-9]', '', text.lower())
            return normalized
        
        target_norm = normalize_text(target_name)
        found_norm = normalize_text(found_name)
        
        # 1. 정확한 매치
        if target_norm == found_norm:
            return True
        
        # 2. 포함 관계 (3글자 이상)
        if len(target_norm) >= 3 and len(found_norm) >= 3:
            if target_norm in found_norm or found_norm in target_norm:
                return True
        
        # 3. 브랜드명 매치 (프랜차이즈 대응)
        brand_patterns = [
            r'(스타벅스|스벅)',
            r'(맥도날드|맥날|McDonald)',
            r'(교촌치킨|교촌|KyoChon)',
            r'(롯데리아|Lotteria)',
            r'(버거킹|BurgerKing)',
            r'(파리바게뜨|Paris)',
            r'(뚜레쥬르|Tous)',
            r'(올리브영|Oliveyoung)',
            r'(이마트|E-mart)',
            r'(세븐일레븐|7-Eleven|711)',
            r'(CU편의점|CU)',
            r'(GS25|지에스25)'
        ]
        
        for pattern in brand_patterns:
            if re.search(pattern, target_name, re.IGNORECASE) and re.search(pattern, found_name, re.IGNORECASE):
                return True
        
        # 4. Jaccard 유사도 (고급 매칭)
        if len(target_norm) >= 4 and len(found_norm) >= 4:
            target_bigrams = set(target_norm[i:i+2] for i in range(len(target_norm)-1))
            found_bigrams = set(found_norm[i:i+2] for i in range(len(found_norm)-1))
            
            if target_bigrams and found_bigrams:
                intersection = target_bigrams.intersection(found_bigrams)
                union = target_bigrams.union(found_bigrams)
                similarity = len(intersection) / len(union)
                
                if similarity >= 0.6:  # 60% 이상 유사
                    return True
        
        return False
    
    def _scroll_with_loading_wait(self) -> bool:
        """로딩 대기 포함 스크롤"""
        try:
            initial_items = len(self._get_place_items_2025())
            
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            
            for _ in range(15):  # 최대 7.5초 대기
                time.sleep(0.5)
                current_items = len(self._get_place_items_2025())
                
                if current_items > initial_items:
                    return True
            
            return False
            
        except Exception:
            return False
    
    def _smart_delay(self, factor: float = 1.0):
        """지능형 지연 (요청 횟수와 성공률 고려)"""
        base_min, base_max = self.delay_range
        
        # 요청 횟수에 따른 지연 증가
        if self.request_count > 100:
            factor *= 1.5
        elif self.request_count > 200:
            factor *= 2.0
        elif self.request_count > 300:
            factor *= 3.0
        
        # 성공률에 따른 지연 조정
        if self.stats['total_searches'] > 5:
            success_rate = self.stats['successful_searches'] / self.stats['total_searches']
            if success_rate < 0.5:  # 성공률 50% 미만 시 지연 증가
                factor *= 1.5
        
        min_delay = base_min * factor
        max_delay = base_max * factor
        
        delay = random.uniform(min_delay, max_delay)
        time.sleep(delay)
    
    def _create_error_result(self, keyword: str, shop_name: str, message: str) -> Dict:
        """에러 결과 생성"""
        return {
            "keyword": keyword,
            "shop_name": shop_name,
            "rank": -1,
            "success": False,
            "message": message,
            "search_time": time.strftime("%Y-%m-%d %H:%M:%S"),
            "found_shops": [],
            "request_count": self.request_count
        }
    
    def get_statistics(self) -> Dict:
        """크롤링 통계 반환"""
        return {
            **self.stats,
            'success_rate': (self.stats['successful_searches'] / self.stats['total_searches'] * 100) if self.stats['total_searches'] > 0 else 0,
            'requests_remaining': self.daily_request_limit - self.request_count,
            'current_date': datetime.now().date().isoformat()
        }
    
    def save_to_supabase(self, results: Union[List[Dict], Dict], tracked_place_id: Optional[int] = None) -> bool:
        """Supabase 저장 (기존 호환)"""
        if not self.supabase:
            return False
        
        if isinstance(results, dict):
            results = [results]
            
        try:
            for result in results:
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
                    'search_region': result.get('search_region', ''),
                    'search_category': result.get('search_category', ''),
                    'search_duration': result.get('search_duration', 0)
                }
                
                self.supabase.table('crawler_results').insert(insert_data).execute()
                
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
        """추적 플레이스 크롤링 (기존 호환)"""
        if not self.supabase:
            self.logger.error("Supabase not configured")
            return
        
        try:
            response = self.supabase.table('tracked_places').select('*').eq('is_active', True).execute()
            tracked_places = response.data
            
            self.logger.info(f"Found {len(tracked_places)} active tracked places")
            
            for place in tracked_places:
                keyword = place['search_keyword']
                place_name = place['place_name']
                place_id = place['id']
                
                result = self.search_place_rank(keyword, place_name)
                self.save_to_supabase(result, place_id)
                
                if "CAPTCHA detected" in result.get('message', ''):
                    break
                
                if self.request_count >= self.daily_request_limit:
                    break
                
        except Exception as e:
            self.logger.error(f"Crawl tracked places failed: {e}")
    
    def close(self):
        """리소스 정리"""
        try:
            if self.driver:
                self.driver.quit()
                self.logger.info(f"WebDriver closed. Final stats: {self.get_statistics()}")
        except Exception as e:
            self.logger.error(f"Error closing WebDriver: {e}")

def main():
    """메인 실행 함수"""
    crawler = UniversalNaverCrawler(
        headless=True,
        delay_range=(10, 25),
        use_proxy=False  # 프록시 리스트가 있으면 True로 변경
    )
    
    try:
        mode = os.getenv('CRAWLER_MODE', 'test')
        
        if mode == 'test':
            # 다양한 지역/업종 테스트
            test_cases = [
                {"keyword": "강남 맛집", "shop_name": "스타벅스"},
                {"keyword": "홍대 치킨", "shop_name": "교촌치킨"},
                {"keyword": "부산 해운대 카페", "shop_name": "이디야"},
                {"keyword": "대구 동성로 피자", "shop_name": "피자헛"},
                {"keyword": "제주 중문 맛집", "shop_name": "맥도날드"}
            ]
            
            for test_case in test_cases:
                result = crawler.search_place_rank(
                    test_case['keyword'], 
                    test_case['shop_name']
                )
                
                print(f"\n=== {test_case['keyword']} - {test_case['shop_name']} ===")
                print(f"성공: {result['success']}")
                print(f"순위: {result['rank']}")
                print(f"지역: {result['search_region']}")
                print(f"업종: {result['search_category']}")
                print(f"메시지: {result['message']}")
                
        elif mode == 'batch':
            # 배치 처리 테스트
            search_tasks = [
                {"keyword": "서울 강남 맛집", "shop_name": "스타벅스", "max_rank": 30},
                {"keyword": "부산 서면 카페", "shop_name": "이디야", "max_rank": 20},
                {"keyword": "대전 중구 치킨", "shop_name": "교촌치킨", "max_rank": 25}
            ]
            
            results = crawler.batch_search(search_tasks, batch_size=5)
            
            print(f"\n=== 배치 처리 결과 ===")
            for result in results:
                print(f"{result['keyword']} - {result['shop_name']}: {result['rank']}")
            
        else:
            # 실제 크롤링
            crawler.crawl_tracked_places()
            
        # 최종 통계
        stats = crawler.get_statistics()
        print(f"\n=== 크롤링 통계 ===")
        print(json.dumps(stats, ensure_ascii=False, indent=2))
            
    finally:
        crawler.close()

if __name__ == "__main__":
    main()