#!/usr/bin/env python3
"""
IP 로테이션 및 프록시 관리 시스템
- 프록시 풀 관리
- 자동 IP 로테이션
- CAPTCHA 감지 및 대응
- 요청 제한 관리
"""
import time
import random
import logging
import json
import requests
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import threading

@dataclass
class ProxyInfo:
    """프록시 정보 클래스"""
    host: str
    port: int
    username: Optional[str] = None
    password: Optional[str] = None
    protocol: str = "http"
    requests_made: int = 0
    last_used: Optional[datetime] = None
    is_blocked: bool = False
    success_rate: float = 1.0
    response_time: float = 0.0

class ProxyManager:
    """프록시 관리자"""
    
    def __init__(self, proxy_list: List[Dict] = None, max_requests_per_proxy: int = 400):
        self.logger = logging.getLogger("ProxyManager")
        self.max_requests_per_proxy = max_requests_per_proxy
        self.proxies: List[ProxyInfo] = []
        self.current_proxy_index = 0
        self.lock = threading.Lock()
        
        # 프록시 리스트 초기화
        if proxy_list:
            self._load_proxy_list(proxy_list)
        
        # 요청 통계
        self.total_requests = 0
        self.successful_requests = 0
        self.blocked_requests = 0
        
    def _load_proxy_list(self, proxy_list: List[Dict]):
        """프록시 리스트 로드"""
        for proxy_data in proxy_list:
            try:
                proxy = ProxyInfo(
                    host=proxy_data['host'],
                    port=proxy_data['port'],
                    username=proxy_data.get('username'),
                    password=proxy_data.get('password'),
                    protocol=proxy_data.get('protocol', 'http')
                )
                self.proxies.append(proxy)
            except KeyError as e:
                self.logger.error(f"Invalid proxy data: {proxy_data}, missing key: {e}")
        
        self.logger.info(f"Loaded {len(self.proxies)} proxies")
    
    def get_next_proxy(self) -> Optional[ProxyInfo]:
        """다음 사용 가능한 프록시 반환"""
        with self.lock:
            if not self.proxies:
                return None
            
            # 사용 가능한 프록시 찾기
            attempts = 0
            while attempts < len(self.proxies):
                proxy = self.proxies[self.current_proxy_index]
                
                # 프록시 상태 확인
                if self._is_proxy_available(proxy):
                    return proxy
                
                # 다음 프록시로 이동
                self.current_proxy_index = (self.current_proxy_index + 1) % len(self.proxies)
                attempts += 1
            
            self.logger.warning("No available proxies found")
            return None
    
    def _is_proxy_available(self, proxy: ProxyInfo) -> bool:
        """프록시 사용 가능 여부 확인"""
        # 차단된 프록시는 제외
        if proxy.is_blocked:
            # 1시간 후 차단 해제
            if proxy.last_used and datetime.now() - proxy.last_used > timedelta(hours=1):
                proxy.is_blocked = False
                proxy.requests_made = 0
                self.logger.info(f"Unblocked proxy: {proxy.host}:{proxy.port}")
            else:
                return False
        
        # 요청 제한 확인
        if proxy.requests_made >= self.max_requests_per_proxy:
            # 24시간 후 카운터 리셋
            if proxy.last_used and datetime.now() - proxy.last_used > timedelta(hours=24):
                proxy.requests_made = 0
                self.logger.info(f"Reset request counter for proxy: {proxy.host}:{proxy.port}")
            else:
                return False
        
        return True
    
    def mark_proxy_used(self, proxy: ProxyInfo, success: bool = True, response_time: float = 0.0):
        """프록시 사용 기록"""
        with self.lock:
            proxy.requests_made += 1
            proxy.last_used = datetime.now()
            proxy.response_time = response_time
            
            # 성공률 업데이트 (이동 평균)
            if success:
                proxy.success_rate = proxy.success_rate * 0.9 + 0.1
                self.successful_requests += 1
            else:
                proxy.success_rate = proxy.success_rate * 0.9
            
            self.total_requests += 1
            
            self.logger.debug(f"Proxy {proxy.host}:{proxy.port} used. "
                            f"Requests: {proxy.requests_made}/{self.max_requests_per_proxy}, "
                            f"Success rate: {proxy.success_rate:.2f}")
    
    def mark_proxy_blocked(self, proxy: ProxyInfo):
        """프록시 차단 표시"""
        with self.lock:
            proxy.is_blocked = True
            proxy.last_used = datetime.now()
            self.blocked_requests += 1
            
            self.logger.warning(f"Proxy {proxy.host}:{proxy.port} marked as blocked")
    
    def get_proxy_url(self, proxy: ProxyInfo) -> str:
        """프록시 URL 생성"""
        if proxy.username and proxy.password:
            return f"{proxy.protocol}://{proxy.username}:{proxy.password}@{proxy.host}:{proxy.port}"
        else:
            return f"{proxy.protocol}://{proxy.host}:{proxy.port}"
    
    def test_proxy(self, proxy: ProxyInfo, timeout: int = 10) -> bool:
        """프록시 연결 테스트"""
        try:
            proxy_url = self.get_proxy_url(proxy)
            proxies = {
                'http': proxy_url,
                'https': proxy_url
            }
            
            start_time = time.time()
            response = requests.get(
                'http://httpbin.org/ip',
                proxies=proxies,
                timeout=timeout
            )
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                self.logger.info(f"Proxy {proxy.host}:{proxy.port} working. IP: {data.get('origin')}, Response time: {response_time:.2f}s")
                proxy.response_time = response_time
                return True
            else:
                self.logger.error(f"Proxy {proxy.host}:{proxy.port} returned status {response.status_code}")
                return False
                
        except Exception as e:
            self.logger.error(f"Proxy {proxy.host}:{proxy.port} test failed: {e}")
            return False
    
    def test_all_proxies(self) -> List[ProxyInfo]:
        """모든 프록시 테스트"""
        working_proxies = []
        
        for proxy in self.proxies:
            if self.test_proxy(proxy):
                working_proxies.append(proxy)
            else:
                proxy.is_blocked = True
        
        self.logger.info(f"Working proxies: {len(working_proxies)}/{len(self.proxies)}")
        return working_proxies
    
    def get_statistics(self) -> Dict:
        """프록시 사용 통계"""
        working_proxies = sum(1 for p in self.proxies if not p.is_blocked)
        blocked_proxies = sum(1 for p in self.proxies if p.is_blocked)
        
        return {
            "total_proxies": len(self.proxies),
            "working_proxies": working_proxies,
            "blocked_proxies": blocked_proxies,
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "blocked_requests": self.blocked_requests,
            "success_rate": self.successful_requests / self.total_requests if self.total_requests > 0 else 0,
            "proxies": [asdict(proxy) for proxy in self.proxies]
        }
    
    def save_statistics(self, filename: str = "proxy_stats.json"):
        """통계를 파일로 저장"""
        stats = self.get_statistics()
        stats["timestamp"] = datetime.now().isoformat()
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(stats, f, ensure_ascii=False, indent=2, default=str)
        
        self.logger.info(f"Proxy statistics saved to {filename}")

class MobileHotspotManager:
    """모바일 핫스팟 관리자 (휴대폰 테더링)"""
    
    def __init__(self):
        self.logger = logging.getLogger("MobileHotspotManager")
        self.is_using_mobile = False
        self.mobile_requests_made = 0
        self.mobile_request_limit = 300  # 모바일당 300 요청 제한
        
    def enable_mobile_hotspot(self) -> bool:
        """모바일 핫스팟 활성화"""
        try:
            # Windows에서 모바일 핫스팟 감지
            import subprocess
            result = subprocess.run(['netsh', 'wlan', 'show', 'profiles'], 
                                  capture_output=True, text=True)
            
            if 'Mobile Hotspot' in result.stdout or 'iPhone' in result.stdout:
                self.is_using_mobile = True
                self.logger.info("Mobile hotspot detected and enabled")
                return True
            else:
                self.logger.warning("No mobile hotspot detected")
                return False
                
        except Exception as e:
            self.logger.error(f"Failed to enable mobile hotspot: {e}")
            return False
    
    def check_mobile_limit(self) -> bool:
        """모바일 데이터 제한 확인"""
        if self.mobile_requests_made >= self.mobile_request_limit:
            self.logger.warning(f"Mobile request limit reached: {self.mobile_requests_made}/{self.mobile_request_limit}")
            return False
        return True
    
    def record_mobile_request(self):
        """모바일 요청 기록"""
        if self.is_using_mobile:
            self.mobile_requests_made += 1
            self.logger.debug(f"Mobile requests: {self.mobile_requests_made}/{self.mobile_request_limit}")

def create_proxy_list_from_config() -> List[Dict]:
    """설정 파일에서 프록시 리스트 생성"""
    # 예시 프록시 리스트 (실제 사용 시 유효한 프록시로 교체)
    return [
        # {
        #     "host": "proxy1.example.com",
        #     "port": 8080,
        #     "username": "user1",
        #     "password": "pass1",
        #     "protocol": "http"
        # },
        # {
        #     "host": "proxy2.example.com", 
        #     "port": 3128,
        #     "protocol": "http"
        # }
    ]

def main():
    """프록시 매니저 테스트"""
    logging.basicConfig(level=logging.INFO)
    
    # 프록시 리스트 로드
    proxy_list = create_proxy_list_from_config()
    
    if not proxy_list:
        print("⚠️  프록시 리스트가 비어있습니다.")
        print("proxy_manager.py의 create_proxy_list_from_config() 함수에서")
        print("실제 프록시 정보를 추가하세요.")
        return
    
    # 프록시 매니저 초기화
    manager = ProxyManager(proxy_list)
    
    # 모든 프록시 테스트
    print("🔍 프록시 연결 테스트 중...")
    working_proxies = manager.test_all_proxies()
    
    print(f"✅ 작동하는 프록시: {len(working_proxies)}개")
    
    # 통계 출력
    stats = manager.get_statistics()
    print(f"📊 프록시 통계: {json.dumps(stats, indent=2, ensure_ascii=False)}")
    
    # 모바일 핫스팟 매니저 테스트
    mobile_manager = MobileHotspotManager()
    if mobile_manager.enable_mobile_hotspot():
        print("📱 모바일 핫스팟이 감지되었습니다.")
    else:
        print("❌ 모바일 핫스팟을 찾을 수 없습니다.")

if __name__ == "__main__":
    main()