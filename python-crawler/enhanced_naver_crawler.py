import requests
import urllib.parse
from bs4 import BeautifulSoup
import json
import time
import random
import os
import logging
from supabase import create_client, Client
from bright_data_proxy_manager import create_bright_data_proxy_manager, BrightDataProxyManager
from proxy_monitor import get_proxy_monitor, log_proxy_request
from bright_data_api_config import setup_bright_data_from_api

class EnhancedNaverPlaceCrawler:
    """Bright Data 프록시를 사용하는 향상된 네이버 플레이스 크롤러"""
    
    def __init__(self, use_proxy=True):
        self.logger = logging.getLogger("EnhancedNaverPlaceCrawler")
        logging.basicConfig(level=logging.INFO)
        
        # 프록시 설정
        self.use_proxy = use_proxy and (os.getenv('BRIGHT_DATA_ENDPOINT') or os.getenv('BRIGHT_DATA_API_KEY'))
        self.proxy_manager = None
        
        if self.use_proxy:
            try:
                # API 키가 있으면 API를 통해 프록시 설정 가져오기
                if os.getenv('BRIGHT_DATA_API_KEY'):
                    self.logger.info("Fetching proxy configurations from Bright Data API...")
                    proxy_configs = setup_bright_data_from_api()
                    if proxy_configs:
                        self.proxy_manager = BrightDataProxyManager(proxy_configs)
                        self.logger.info(f"Proxy manager initialized with {len(proxy_configs)} proxies from API")
                    else:
                        # API 실패 시 환경변수에서 가져오기
                        self.logger.warning("Failed to get proxies from API, falling back to environment variables")
                        self.proxy_manager = create_bright_data_proxy_manager()
                else:
                    # API 키가 없으면 환경변수에서 직접 가져오기
                    self.proxy_manager = create_bright_data_proxy_manager()
                    self.logger.info("Proxy manager initialized from environment variables")
            except Exception as e:
                self.logger.warning(f"Failed to initialize proxy manager: {e}")
                self.use_proxy = False
        
        # 기본 헤더 (프록시가 없을 때 사용)
        self.default_headers = {
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
            self.logger.warning("Supabase credentials not found")
        
        # 프록시 모니터 초기화
        self.proxy_monitor = get_proxy_monitor()

    def build_url(self, keyword):
        """검색어를 기반으로 네이버 모바일 지도 검색 URL을 생성"""
        encoded_keyword = urllib.parse.quote(keyword)
        # 여러 URL 패턴 시도
        urls = [
            f"https://m.place.naver.com/restaurant/list?query={encoded_keyword}&entry=plt",
            f"https://pcmap.place.naver.com/place/list?query={encoded_keyword}",
            f"https://m.map.naver.com/search2/search.naver?query={encoded_keyword}&sm=hty&style=v5"
        ]
        return urls

    def make_request_with_fallback(self, urls, **kwargs):
        """프록시와 일반 요청을 모두 시도하는 요청 메서드"""
        
        # 1. 프록시 사용 시도
        if self.use_proxy and self.proxy_manager:
            for url in urls:
                start_time = time.time()
                try:
                    self.logger.info(f"Trying proxy request to: {url}")
                    response, proxy = self.proxy_manager.make_request(url, **kwargs)
                    response_time = time.time() - start_time
                    
                    if response and response.status_code == 200:
                        self.logger.info(f"Proxy request successful: {url}")
                        # 성공 로깅
                        log_proxy_request(
                            proxy_endpoint=proxy.endpoint if proxy else "unknown",
                            request_url=url,
                            status_code=response.status_code,
                            response_time=response_time,
                            success=True,
                            session_id=proxy.session_id if proxy else None,
                            country=proxy.country if proxy else "KR"
                        )
                        return response, 'proxy'
                    else:
                        # 실패 로깅
                        log_proxy_request(
                            proxy_endpoint=proxy.endpoint if proxy else "unknown",
                            request_url=url,
                            status_code=response.status_code if response else None,
                            response_time=response_time,
                            success=False,
                            error_message=f"HTTP {response.status_code}" if response else "No response",
                            session_id=proxy.session_id if proxy else None,
                            country=proxy.country if proxy else "KR"
                        )
                        
                except Exception as e:
                    response_time = time.time() - start_time
                    self.logger.warning(f"Proxy request failed for {url}: {e}")
                    # 에러 로깅
                    log_proxy_request(
                        proxy_endpoint="unknown",
                        request_url=url,
                        status_code=None,
                        response_time=response_time,
                        success=False,
                        error_message=str(e)
                    )
                    continue
            
            # 프록시 실패 시 리셋 시도
            self.logger.info("Resetting failed proxies and retrying...")
            self.proxy_manager.reset_failed_proxies()
        
        # 2. 일반 요청 시도 (fallback)
        self.logger.info("Falling back to direct requests")
        session = requests.Session()
        session.headers.update(self.default_headers)
        
        for url in urls:
            try:
                self.logger.info(f"Trying direct request to: {url}")
                response = session.get(url, timeout=15, **kwargs)
                
                if response.status_code == 200:
                    self.logger.info(f"Direct request successful: {url}")
                    return response, 'direct'
                    
            except Exception as e:
                self.logger.warning(f"Direct request failed for {url}: {e}")
                continue
        
        return None, None

    def search_place_rank(self, keyword, shop_name):
        """
        키워드로 검색하여 특정 상호명의 순위를 찾음
        """
        result = {
            "keyword": keyword,
            "shop_name": shop_name,
            "rank": -1,
            "success": False,
            "message": "",
            "search_time": time.strftime("%Y-%m-%d %H:%M:%S"),
            "found_shops": [],
            "request_method": "unknown"
        }
        
        try:
            # 검색 URL 목록 생성
            urls = self.build_url(keyword)
            self.logger.info(f"Searching for '{shop_name}' with keyword: '{keyword}'")
            
            # 요청 실행 (프록시 + fallback)
            response, method = self.make_request_with_fallback(urls)
            result["request_method"] = method
            
            if not response:
                result["message"] = "모든 요청 방법이 실패했습니다."
                self.logger.error(result["message"])
                return result
            
            # HTML 파싱
            soup = BeautifulSoup(response.text, "html.parser")
            
            # 디버깅을 위한 HTML 저장 (개발 환경에서만)
            if os.getenv('DEBUG_MODE') == 'true':
                with open(f"debug_response_{int(time.time())}.html", "w", encoding="utf-8") as f:
                    f.write(response.text)
            
            # 장소 목록 찾기 - 다양한 선택자 시도
            place_items = self._extract_place_items(soup)
            
            if not place_items:
                result["message"] = "장소 목록을 찾을 수 없습니다."
                self.logger.warning(result["message"])
                return result
            
            # 장소 순위 찾기
            rank, found_shops = self._find_place_rank(place_items, shop_name)
            
            result["found_shops"] = found_shops[:20]
            
            if rank > 0:
                result["rank"] = rank
                result["success"] = True
                result["message"] = f"'{shop_name}'은(는) '{keyword}' 검색 결과에서 {rank}위입니다."
                self.logger.info(result["message"])
            else:
                result["message"] = f"'{shop_name}'을(를) 상위 {len(place_items)}개 결과에서 찾을 수 없습니다."
                self.logger.info(result["message"])
            
            # 프록시 통계 로깅
            if self.use_proxy and self.proxy_manager:
                stats = self.proxy_manager.get_proxy_stats()
                self.logger.info(f"Proxy stats: {stats['active']}/{stats['total']} active")
                
        except Exception as e:
            result["message"] = f"오류 발생: {type(e).__name__} - {e}"
            self.logger.error(result["message"])
            import traceback
            traceback.print_exc()
        
        return result

    def _extract_place_items(self, soup):
        """다양한 선택자로 장소 목록 추출"""
        place_items = []
        
        # 모바일과 데스크톱 선택자들
        selectors = [
            # 모바일 선택자
            "li[data-index]",
            "li.place_item", 
            "div.place_list li",
            "ul.list_place li",
            ".search_result li",
            ".place_result li",
            
            # 데스크톱 선택자
            "li.UEzoS",
            "li.VLTHu", 
            "div.Ryr1F#_pcmap_list_scroll_container > ul > li",
            "ul._3l82D > li",
            "ul._1s-8x > li",
            ".search_list li",
            
            # 일반적인 선택자
            ".result_list li",
            ".place_list_result li",
            "[data-place-id]"
        ]
        
        for selector in selectors:
            items = soup.select(selector)
            if items:
                self.logger.info(f"선택자 '{selector}'로 {len(items)}개 항목 발견")
                place_items = items
                break
        
        # 선택자로 찾을 수 없으면 모든 li 태그 시도
        if not place_items:
            all_lis = soup.find_all("li")
            place_items = [li for li in all_lis if li.get_text().strip() and len(li.get_text()) > 10]
            self.logger.info(f"모든 li 태그에서 {len(place_items)}개 항목 발견")
        
        return place_items

    def _find_place_rank(self, place_items, shop_name):
        """장소 목록에서 상호명의 순위 찾기"""
        rank = 0
        found_shops = []
        
        for item in place_items[:500]:  # 상위 500개까지 확인
            text = item.get_text()
            
            # 광고 제외
            if any(ad_word in text for ad_word in ["광고", "AD", "Sponsored", "스폰서"]):
                continue
            
            rank += 1
            
            # 텍스트 정리
            clean_text = text.replace("\n", " ").strip()
            found_shops.append(clean_text[:50])  # 처음 50자만 저장
            
            # 매칭 시도
            if self._is_place_match(clean_text, shop_name):
                return rank, found_shops
        
        return -1, found_shops

    def _is_place_match(self, text, shop_name):
        """텍스트와 상호명이 일치하는지 확인"""
        # 1. 직접 포함 여부 확인
        if shop_name.lower() in text.lower():
            return True
        
        # 2. 공백 제거 후 확인
        text_no_space = text.replace(" ", "").replace("\t", "")
        shop_no_space = shop_name.replace(" ", "").replace("\t", "")
        
        if shop_no_space.lower() in text_no_space.lower():
            return True
        
        # 3. 특수문자 제거 후 확인
        import re
        text_clean = re.sub(r'[^\w가-힣]', '', text)
        shop_clean = re.sub(r'[^\w가-힣]', '', shop_name)
        
        if shop_clean.lower() in text_clean.lower():
            return True
        
        return False

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
                    'error_message': result['message'] if not result['success'] else None,
                    'request_method': result.get('request_method', 'unknown')
                }
                
                response = self.supabase.table('crawler_results').insert(insert_data).execute()
                
                # rankings 테이블에도 저장 (성공한 경우만)
                if tracked_place_id and result['success']:
                    ranking_data = {
                        'place_id': tracked_place_id,  # place_id 컬럼 사용
                        'rank': result['rank'],
                        'checked_at': result['search_time']
                    }
                    self.supabase.table('rankings').insert(ranking_data).execute()
                    
            self.logger.info(f"Saved {len(results)} results to Supabase")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to save to Supabase: {str(e)}")
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
            
            if not tracked_places:
                self.logger.warning("No active tracked places found")
                return
            
            success_count = 0
            total_count = len(tracked_places)
            
            for i, place in enumerate(tracked_places, 1):
                keyword = place['search_keyword']
                place_name = place['place_name']
                place_id = place['id']
                
                self.logger.info(f"\n[{i}/{total_count}] 크롤링 시작: {place_name} (키워드: {keyword})")
                
                # 검색 실행
                result = self.search_place_rank(keyword, place_name)
                
                # 결과 저장
                if self.save_to_supabase([result], place_id):
                    if result['success']:
                        success_count += 1
                        self.logger.info(f"✅ 성공: {place_name} - {result['rank']}위")
                    else:
                        self.logger.warning(f"❌ 실패: {place_name} - {result['message']}")
                
                # 요청 간격 조정 (프록시 사용 여부에 따라)
                if self.use_proxy:
                    delay = random.uniform(1, 3)  # 프록시 사용 시 짧은 대기
                else:
                    delay = random.uniform(5, 10)  # 직접 요청 시 긴 대기
                
                if i < total_count:  # 마지막이 아니면 대기
                    self.logger.info(f"다음 요청까지 {delay:.1f}초 대기...")
                    time.sleep(delay)
            
            # 최종 결과 리포트
            self.logger.info(f"\n🎯 크롤링 완료: {success_count}/{total_count} 성공")
            
            # 프록시 통계 출력 및 모니터링 리포트 생성
            if self.use_proxy and self.proxy_manager:
                stats = self.proxy_manager.get_proxy_stats()
                self.logger.info(f"📊 프록시 통계: {stats}")
                
                # 세션별 모니터링 리포트 생성
                monitor_stats = self.proxy_monitor.get_usage_stats(hours=1)  # 최근 1시간
                monitor_report = self.proxy_monitor.export_usage_report(hours=1, format='text')
                self.logger.info(f"\n{monitor_report}")
                
                # 일일 요약 저장 (선택적)
                if os.getenv('SAVE_DAILY_SUMMARY', 'false').lower() == 'true':
                    self.proxy_monitor.save_daily_summary()
                
        except Exception as e:
            self.logger.error(f"Crawl tracked places failed: {str(e)}")
            import traceback
            traceback.print_exc()

def main():
    """메인 실행 함수"""
    # 로깅 설정
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # 프록시 사용 여부 결정
    use_proxy = os.getenv('USE_BRIGHT_DATA_PROXY', 'true').lower() == 'true'
    
    crawler = EnhancedNaverPlaceCrawler(use_proxy=use_proxy)
    
    # 환경변수로 모드 결정
    mode = os.getenv('CRAWLER_MODE', 'tracked')
    
    if mode == 'test':
        # 테스트 모드
        keyword = os.getenv('TEST_KEYWORD', '서울 상암 맛집')
        shop_name = os.getenv('TEST_SHOP_NAME', '맥도날드상암DMC점')
        
        print(f"🔍 테스트 크롤링 시작: {shop_name} (키워드: {keyword})")
        result = crawler.search_place_rank(keyword, shop_name)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    else:
        # 실제 크롤링 모드
        print("🚀 실제 크롤링 시작")
        crawler.crawl_tracked_places()

if __name__ == "__main__":
    main()