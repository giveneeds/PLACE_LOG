import requests
import random
import time
import logging
from typing import List, Dict, Optional, Tuple
import os
from dataclasses import dataclass
from enum import Enum

class ProxyStatus(Enum):
    ACTIVE = "active"
    FAILED = "failed"
    RATE_LIMITED = "rate_limited"
    BANNED = "banned"

@dataclass
class ProxyConfig:
    """Bright Data 프록시 설정"""
    endpoint: str
    username: str
    password: str
    session_id: Optional[str] = None
    country: str = "KR"  # 한국
    status: ProxyStatus = ProxyStatus.ACTIVE
    fail_count: int = 0
    last_used: Optional[float] = None
    success_count: int = 0

class BrightDataProxyManager:
    """Bright Data 프록시 풀 관리자"""
    
    def __init__(self, config_list: List[Dict]):
        self.logger = logging.getLogger("BrightDataProxyManager")
        self.proxies = []
        self.current_proxy_index = 0
        self.max_fail_count = 3
        self.rate_limit_delay = 60  # 1분
        self.proxy_rotation_delay = 2  # 프록시 전환 시 2초 대기
        
        # Bright Data 설정 로드
        self._load_proxy_configs(config_list)
        
    def _load_proxy_configs(self, config_list: List[Dict]):
        """프록시 설정 로드"""
        for config in config_list:
            try:
                proxy_config = ProxyConfig(
                    endpoint=config.get('endpoint'),
                    username=config.get('username'),
                    password=config.get('password'),
                    session_id=config.get('session_id'),
                    country=config.get('country', 'KR')
                )
                self.proxies.append(proxy_config)
                self.logger.info(f"Loaded proxy: {proxy_config.endpoint}")
            except Exception as e:
                self.logger.error(f"Failed to load proxy config: {e}")
    
    def get_active_proxy(self) -> Optional[ProxyConfig]:
        """사용 가능한 프록시 반환"""
        active_proxies = [p for p in self.proxies if p.status == ProxyStatus.ACTIVE]
        
        if not active_proxies:
            self.logger.warning("No active proxies available")
            return None
            
        # 로드 밸런싱: 사용 빈도가 낮은 프록시 우선 선택
        active_proxies.sort(key=lambda p: (p.success_count, p.last_used or 0))
        
        return active_proxies[0]
    
    def get_next_proxy(self) -> Optional[ProxyConfig]:
        """다음 프록시로 로테이션"""
        if not self.proxies:
            return None
            
        # 현재 인덱스 기반 로테이션
        self.current_proxy_index = (self.current_proxy_index + 1) % len(self.proxies)
        proxy = self.proxies[self.current_proxy_index]
        
        # 실패한 프록시는 스킵
        if proxy.status != ProxyStatus.ACTIVE:
            return self.get_next_proxy()
            
        return proxy
    
    def create_session(self, proxy_config: ProxyConfig) -> requests.Session:
        """프록시를 사용하는 requests 세션 생성"""
        session = requests.Session()
        
        # Bright Data 프록시 설정
        proxy_url = f"http://{proxy_config.username}:{proxy_config.password}@{proxy_config.endpoint}"
        
        # 세션 ID가 있으면 추가
        if proxy_config.session_id:
            proxy_url = f"http://{proxy_config.username}-session-{proxy_config.session_id}:{proxy_config.password}@{proxy_config.endpoint}"
        
        session.proxies = {
            'http': proxy_url,
            'https': proxy_url
        }
        
        # 네이버 크롤링에 적합한 헤더 설정
        session.headers.update({
            'User-Agent': self._get_random_user_agent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
        
        return session
    
    def _get_random_user_agent(self) -> str:
        """랜덤 User-Agent 반환"""
        user_agents = [
            # 모바일 User-Agent
            "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1",
            "Mozilla/5.0 (Linux; Android 11; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
            "Mozilla/5.0 (Linux; Android 10; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36",
            
            # 데스크톱 User-Agent
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0"
        ]
        return random.choice(user_agents)
    
    def make_request(self, url: str, method: str = 'GET', **kwargs) -> Tuple[Optional[requests.Response], ProxyConfig]:
        """프록시를 통한 요청 실행"""
        max_retries = len(self.proxies) * 2  # 모든 프록시를 2번씩 시도
        
        for attempt in range(max_retries):
            proxy = self.get_active_proxy()
            if not proxy:
                self.logger.error("No active proxies available")
                break
                
            try:
                session = self.create_session(proxy)
                
                # 요청 실행
                self.logger.info(f"Making request to {url} via proxy {proxy.endpoint}")
                
                # 타임아웃 설정
                kwargs.setdefault('timeout', 30)
                
                if method.upper() == 'GET':
                    response = session.get(url, **kwargs)
                elif method.upper() == 'POST':
                    response = session.post(url, **kwargs)
                else:
                    raise ValueError(f"Unsupported method: {method}")
                
                # 성공적인 요청 처리
                if response.status_code == 200:
                    proxy.success_count += 1
                    proxy.last_used = time.time()
                    proxy.fail_count = 0  # 성공 시 실패 카운트 리셋
                    
                    self.logger.info(f"Request successful via proxy {proxy.endpoint}")
                    return response, proxy
                
                # 상태 코드별 처리
                elif response.status_code == 429:  # Rate Limited
                    self.logger.warning(f"Rate limited on proxy {proxy.endpoint}")
                    proxy.status = ProxyStatus.RATE_LIMITED
                    time.sleep(self.rate_limit_delay)
                    
                elif response.status_code in [403, 404, 503]:  # Potentially banned
                    self.logger.warning(f"Proxy {proxy.endpoint} may be banned (status: {response.status_code})")
                    self._mark_proxy_failed(proxy)
                    
                else:
                    self.logger.warning(f"Unexpected status code {response.status_code} from proxy {proxy.endpoint}")
                    self._mark_proxy_failed(proxy)
                    
            except requests.exceptions.ProxyError as e:
                self.logger.error(f"Proxy error with {proxy.endpoint}: {e}")
                self._mark_proxy_failed(proxy)
                
            except requests.exceptions.Timeout as e:
                self.logger.error(f"Timeout with proxy {proxy.endpoint}: {e}")
                self._mark_proxy_failed(proxy)
                
            except Exception as e:
                self.logger.error(f"Unexpected error with proxy {proxy.endpoint}: {e}")
                self._mark_proxy_failed(proxy)
            
            # 프록시 전환 시 잠시 대기
            time.sleep(self.proxy_rotation_delay)
        
        self.logger.error("All proxy attempts failed")
        return None, None
    
    def _mark_proxy_failed(self, proxy: ProxyConfig):
        """프록시 실패 처리"""
        proxy.fail_count += 1
        
        if proxy.fail_count >= self.max_fail_count:
            proxy.status = ProxyStatus.FAILED
            self.logger.warning(f"Proxy {proxy.endpoint} marked as failed after {proxy.fail_count} failures")
        
    def reset_failed_proxies(self):
        """실패한 프록시들을 다시 활성화"""
        for proxy in self.proxies:
            if proxy.status in [ProxyStatus.FAILED, ProxyStatus.RATE_LIMITED]:
                proxy.status = ProxyStatus.ACTIVE
                proxy.fail_count = 0
                self.logger.info(f"Reset proxy: {proxy.endpoint}")
    
    def get_proxy_stats(self) -> Dict:
        """프록시 풀 통계"""
        stats = {
            'total': len(self.proxies),
            'active': len([p for p in self.proxies if p.status == ProxyStatus.ACTIVE]),
            'failed': len([p for p in self.proxies if p.status == ProxyStatus.FAILED]),
            'rate_limited': len([p for p in self.proxies if p.status == ProxyStatus.RATE_LIMITED]),
            'banned': len([p for p in self.proxies if p.status == ProxyStatus.BANNED])
        }
        
        # 각 프록시별 상세 정보
        proxy_details = []
        for proxy in self.proxies:
            proxy_details.append({
                'endpoint': proxy.endpoint,
                'status': proxy.status.value,
                'success_count': proxy.success_count,
                'fail_count': proxy.fail_count,
                'last_used': proxy.last_used
            })
        
        stats['proxies'] = proxy_details
        return stats

def create_bright_data_proxy_manager():
    """환경변수에서 Bright Data 프록시 설정을 로드하여 매니저 생성"""
    
    # 환경변수에서 프록시 설정 로드
    proxy_configs = []
    
    # 기본 프록시 설정 (환경변수에서)
    if os.getenv('BRIGHT_DATA_ENDPOINT'):
        proxy_configs.append({
            'endpoint': os.getenv('BRIGHT_DATA_ENDPOINT'),
            'username': os.getenv('BRIGHT_DATA_USERNAME'),
            'password': os.getenv('BRIGHT_DATA_PASSWORD'),
            'session_id': os.getenv('BRIGHT_DATA_SESSION_ID'),
            'country': os.getenv('BRIGHT_DATA_COUNTRY', 'KR')
        })
    
    # 다중 프록시 설정 (BRIGHT_DATA_PROXIES_1, BRIGHT_DATA_PROXIES_2, ...)
    i = 1
    while True:
        endpoint = os.getenv(f'BRIGHT_DATA_ENDPOINT_{i}')
        if not endpoint:
            break
            
        proxy_configs.append({
            'endpoint': endpoint,
            'username': os.getenv(f'BRIGHT_DATA_USERNAME_{i}'),
            'password': os.getenv(f'BRIGHT_DATA_PASSWORD_{i}'),
            'session_id': os.getenv(f'BRIGHT_DATA_SESSION_ID_{i}'),
            'country': os.getenv(f'BRIGHT_DATA_COUNTRY_{i}', 'KR')
        })
        i += 1
    
    if not proxy_configs:
        raise ValueError("No Bright Data proxy configurations found in environment variables")
    
    return BrightDataProxyManager(proxy_configs)

# 사용 예시
if __name__ == "__main__":
    # 테스트용 설정
    test_configs = [
        {
            'endpoint': 'brd-customer-hl_YOUR_ID-zone-datacenter_proxy1:22225',
            'username': 'brd-customer-hl_YOUR_ID-zone-datacenter_proxy1',
            'password': 'YOUR_PASSWORD',
            'session_id': 'session_1',
            'country': 'KR'
        }
    ]
    
    manager = BrightDataProxyManager(test_configs)
    
    # 테스트 요청
    response, proxy = manager.make_request('https://httpbin.org/ip')
    if response:
        print(f"Response: {response.json()}")
        print(f"Used proxy: {proxy.endpoint}")
    
    # 통계 출력
    print("Proxy Stats:", manager.get_proxy_stats())