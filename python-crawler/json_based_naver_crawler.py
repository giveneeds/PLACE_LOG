# -*- coding: utf-8 -*-
"""
JSON-based Naver Place Crawler (2025)
- Based on actual Naver structure analysis
- Parses __APOLLO_STATE__ JSON data
- No traditional HTML parsing needed
"""
import time
import re
import random
import json
import logging
import urllib.parse
from typing import Dict, List, Optional
from datetime import datetime

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

class JsonBasedNaverCrawler:
    """
    JSON 기반 네이버 플레이스 크롤러 (2025년 실제 구조 기반)
    """
    
    def __init__(self, headless=True, delay_range=(5, 10)):
        self.delay_range = delay_range
        self.logger = self._setup_logging()
        
        # Mobile user agents for 2025
        self.user_agents = [
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
            "Mozilla/5.0 (Android 14; Mobile; rv:125.0) Gecko/125.0 Firefox/125.0",
        ]
        
        self.driver = None
        self.setup_driver(headless)
        
        # Statistics
        self.stats = {
            'total_searches': 0,
            'successful_searches': 0,
            'failed_searches': 0,
            'json_extractions': 0,
            'captcha_encounters': 0
        }
    
    def _setup_logging(self):
        """Setup logging"""
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        return logging.getLogger("JsonBasedNaverCrawler")
    
    def setup_driver(self, headless):
        """Setup Chrome WebDriver"""
        options = Options()
        
        if headless:
            options.add_argument('--headless=new')
        
        # Bot detection avoidance
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        # Performance optimization
        options.add_argument('--disable-extensions')
        options.add_argument('--disable-images')
        
        # Random user agent
        user_agent = random.choice(self.user_agents)
        options.add_argument(f'--user-agent={user_agent}')
        
        # Mobile viewport
        mobile_sizes = [(375, 812), (390, 844), (393, 873)]
        width, height = random.choice(mobile_sizes)
        options.add_argument(f'--window-size={width},{height}')
        
        try:
            self.driver = webdriver.Chrome(options=options)
            self.driver.execute_script("""
                Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
                Object.defineProperty(navigator, 'languages', {get: () => ['ko-KR', 'ko', 'en-US', 'en']});
            """)
            self.driver.implicitly_wait(10)
            self.logger.info("WebDriver initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize WebDriver: {e}")
            raise
    
    def search_place_rank(self, keyword: str, target_place_name: str, max_rank: int = 50) -> Dict:
        """
        JSON 기반 플레이스 순위 검색
        """
        search_start_time = time.time()
        self.stats['total_searches'] += 1
        
        result = {
            "keyword": keyword,
            "shop_name": target_place_name,
            "rank": -1,
            "success": False,
            "message": "",
            "search_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "found_shops": [],
            "search_region": self._extract_region(keyword),
            "search_category": self._extract_category(keyword),
            "search_duration": 0
        }
        
        try:
            self.logger.info(f"Searching for '{target_place_name}' in '{keyword}' (max rank: {max_rank})")
            
            # Use correct Naver mobile search URL
            encoded_keyword = urllib.parse.quote(keyword)
            search_url = f"https://m.search.naver.com/search.naver?where=m&sm=top_sly.hst&fbm=0&acr=1&ie=utf8&query={encoded_keyword}"
            
            self.logger.info(f"Loading URL: {search_url}")
            self.driver.get(search_url)
            self._smart_delay()
            
            # Check for CAPTCHA
            if self._detect_captcha():
                self.stats['captcha_encounters'] += 1
                result["message"] = "CAPTCHA detected - IP rotation needed"
                self.logger.warning("CAPTCHA detected!")
                return result
            
            # Extract JSON data from page
            json_data = self._extract_apollo_state()
            if not json_data:
                result["message"] = "Failed to extract JSON data from page"
                return result
            
            # Parse restaurant data from JSON
            restaurants = self._parse_restaurant_data(json_data)
            if not restaurants:
                result["message"] = "No restaurant data found in JSON"
                return result
            
            self.logger.info(f"Found {len(restaurants)} restaurants in JSON data")
            
            # Find target restaurant and rank
            rank_result = self._find_target_restaurant(restaurants, target_place_name, max_rank)
            result.update(rank_result)
            
            # Update statistics
            search_duration = time.time() - search_start_time
            result["search_duration"] = round(search_duration, 2)
            
            if result["success"]:
                self.stats['successful_searches'] += 1
                self.logger.info(f"SUCCESS: Found '{target_place_name}' at rank {result['rank']} in {search_duration:.2f}s")
            else:
                self.stats['failed_searches'] += 1
                self.logger.info(f"NOT FOUND: '{target_place_name}' not found in top {max_rank}")
                
        except Exception as e:
            result["message"] = f"Error during search: {type(e).__name__} - {e}"
            self.logger.error(f"Search error: {e}")
            self.stats['failed_searches'] += 1
        
        return result
    
    def _extract_apollo_state(self) -> Optional[Dict]:
        """Extract __APOLLO_STATE__ JSON data from page"""
        try:
            # Look for __APOLLO_STATE__ in page source
            page_source = self.driver.page_source
            
            # Find the JSON data
            apollo_pattern = r'naver\.search\.ext\.nmb\.salt\.__APOLLO_STATE__\s*=\s*({.*?});'
            match = re.search(apollo_pattern, page_source, re.DOTALL)
            
            if match:
                json_str = match.group(1)
                apollo_data = json.loads(json_str)
                self.stats['json_extractions'] += 1
                self.logger.info("Successfully extracted Apollo State JSON data")
                return apollo_data
            else:
                self.logger.warning("Could not find __APOLLO_STATE__ in page source")
                return None
                
        except json.JSONDecodeError as e:
            self.logger.error(f"JSON parsing error: {e}")
            return None
        except Exception as e:
            self.logger.error(f"Apollo state extraction error: {e}")
            return None
    
    def _parse_restaurant_data(self, apollo_data: Dict) -> List[Dict]:
        """Parse restaurant data from Apollo state JSON"""
        restaurants = []
        
        try:
            for key, value in apollo_data.items():
                # Look for RestaurantListSummary objects
                if key.startswith('RestaurantListSummary:') and isinstance(value, dict):
                    restaurant_info = {
                        'id': value.get('id', ''),
                        'name': value.get('name', ''),
                        'category': value.get('category', ''),
                        'address': value.get('commonAddress', ''),
                        'distance': value.get('distance', ''),
                        'review_count': value.get('visitorReviewCount', ''),
                        'booking_category': value.get('naverBookingCategory', ''),
                        'business_hours': value.get('businessHours', ''),
                        'options': value.get('options', ''),
                        'full_address': value.get('fullAddress', ''),
                        'apollo_key': key
                    }
                    restaurants.append(restaurant_info)
            
            # Sort by distance or other criteria (Naver's default ordering)
            restaurants.sort(key=lambda x: self._parse_distance(x.get('distance', '999km')))
            
            self.logger.info(f"Parsed {len(restaurants)} restaurants from JSON data")
            return restaurants
            
        except Exception as e:
            self.logger.error(f"Error parsing restaurant data: {e}")
            return []
    
    def _parse_distance(self, distance_str: str) -> float:
        """Parse distance string like '8.2km' to float"""
        try:
            if 'km' in distance_str:
                return float(distance_str.replace('km', ''))
            elif 'm' in distance_str:
                return float(distance_str.replace('m', '')) / 1000
            else:
                return 999.0  # Default large distance
        except:
            return 999.0
    
    def _find_target_restaurant(self, restaurants: List[Dict], target_name: str, max_rank: int) -> Dict:
        """Find target restaurant in the list"""
        result = {
            "rank": -1,
            "success": False,
            "message": "",
            "found_shops": []
        }
        
        found_shops = []
        
        for i, restaurant in enumerate(restaurants[:max_rank], 1):
            restaurant_name = restaurant.get('name', '')
            found_shops.append(restaurant_name)
            
            # Use flexible matching
            if self._is_name_match(target_name, restaurant_name):
                result.update({
                    "rank": i,
                    "success": True,
                    "message": f"Found '{target_name}' at rank {i}",
                    "found_shops": found_shops[:15]  # Top 15 only
                })
                return result
        
        # Not found
        result.update({
            "found_shops": found_shops[:20],  # Top 20 for debugging
            "message": f"'{target_name}' not found in top {min(len(restaurants), max_rank)} results"
        })
        
        return result
    
    def _is_name_match(self, target_name: str, found_name: str) -> bool:
        """Flexible name matching logic"""
        if not target_name or not found_name:
            return False
        
        def normalize_text(text):
            # Remove special characters and normalize
            normalized = re.sub(r'[^\w가-힣0-9]', '', text.lower())
            return normalized
        
        target_norm = normalize_text(target_name)
        found_norm = normalize_text(found_name)
        
        # Exact match
        if target_norm == found_norm:
            return True
        
        # Substring match (3+ characters)
        if len(target_norm) >= 3:
            if target_norm in found_norm or found_norm in target_norm:
                return True
        
        # Brand matching patterns
        brand_patterns = [
            r'(스타벅스|starbucks)',
            r'(맥도날드|McDonald|맥날)',
            r'(교촌치킨|교촌|KyoChon)',
            r'(롯데리아|Lotteria)',
            r'(버거킹|BurgerKing)',
            r'(파리바게뜨|Paris)',
            r'(이디야|Ediya)',
            r'(커피빈|CoffeeBean)',
        ]
        
        for pattern in brand_patterns:
            if re.search(pattern, target_name, re.IGNORECASE) and re.search(pattern, found_name, re.IGNORECASE):
                return True
        
        return False
    
    def _extract_region(self, keyword: str) -> str:
        """Extract region from keyword"""
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
        """Extract category from keyword"""
        categories = {
            '맛집': ['맛집', '음식점', '레스토랑'],
            '카페': ['카페', '커피', '디저트'],
            '치킨': ['치킨', '닭', '프라이드'],
            '피자': ['피자'],
            '중국음식': ['중국집', '중화요리', '짜장면'],
            '일식': ['일식', '초밥', '라멘', '우동'],
            '한식': ['한식', '불고기', '갈비', '김치찌개'],
            '분식': ['분식', '떡볶이', '순대', '김밥'],
            '패스트푸드': ['패스트푸드', '햄버거', '버거'],
        }
        
        keyword_lower = keyword.lower()
        for category, keywords in categories.items():
            for kw in keywords:
                if kw in keyword_lower:
                    return category
        
        return "기타"
    
    def _detect_captcha(self) -> bool:
        """Detect CAPTCHA on page"""
        try:
            current_url = self.driver.current_url.lower()
            if any(keyword in current_url for keyword in ['captcha', 'block', 'verify', 'robot']):
                return True
            
            page_text = self.driver.page_source.lower()
            captcha_keywords = ['captcha', '보안문자', '자동입력', '로봇', 'verify', '인증', 'block', '차단']
            
            return any(keyword in page_text for keyword in captcha_keywords)
            
        except Exception:
            return False
    
    def _smart_delay(self):
        """Smart delay between requests"""
        min_delay, max_delay = self.delay_range
        delay = random.uniform(min_delay, max_delay)
        time.sleep(delay)
    
    def get_statistics(self) -> Dict:
        """Get crawler statistics"""
        return {
            **self.stats,
            'success_rate': (self.stats['successful_searches'] / self.stats['total_searches'] * 100) if self.stats['total_searches'] > 0 else 0
        }
    
    def close(self):
        """Close WebDriver"""
        try:
            if self.driver:
                self.driver.quit()
                self.logger.info(f"WebDriver closed. Final stats: {self.get_statistics()}")
        except Exception as e:
            self.logger.error(f"Error closing WebDriver: {e}")

def main():
    """Test the JSON-based crawler"""
    print("JSON-based Naver Place Crawler Test")
    print("=" * 50)
    
    crawler = JsonBasedNaverCrawler(headless=True, delay_range=(3, 8))
    
    try:
        # Test cases
        test_cases = [
            {"keyword": "강남 맛집", "shop_name": "스타벅스"},
            {"keyword": "홍대 치킨", "shop_name": "교촌치킨"},
            {"keyword": "부산 해운대 카페", "shop_name": "이디야"},
        ]
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\nTest {i}: {test_case['keyword']} - {test_case['shop_name']}")
            
            result = crawler.search_place_rank(
                test_case['keyword'], 
                test_case['shop_name'], 
                max_rank=20
            )
            
            print(f"Success: {result['success']}")
            print(f"Rank: {result['rank']}")
            print(f"Message: {result['message']}")
            print(f"Duration: {result['search_duration']}s")
            
            if result['found_shops']:
                print(f"Found shops (top 5): {', '.join(result['found_shops'][:5])}")
            
            # Wait between tests
            if i < len(test_cases):
                time.sleep(5)
        
        # Final statistics
        stats = crawler.get_statistics()
        print(f"\nFinal Statistics:")
        print(json.dumps(stats, indent=2))
        
    finally:
        crawler.close()

if __name__ == "__main__":
    main()