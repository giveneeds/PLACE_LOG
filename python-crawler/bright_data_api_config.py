import os
import requests
import json
import logging
from typing import Dict, List, Optional

class BrightDataAPIConfig:
    """Bright Data API를 통한 프록시 설정 자동 구성"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.logger = logging.getLogger("BrightDataAPIConfig")
        self.api_key = api_key or os.getenv('BRIGHT_DATA_API_KEY')
        self.base_url = "https://api.brightdata.com"
        
        if not self.api_key:
            raise ValueError("Bright Data API key not found in environment variables")
    
    def get_datacenter_proxies(self, country: str = "KR") -> List[Dict]:
        """데이터센터 프록시 목록 가져오기"""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # 데이터센터 프록시 정보 조회
            response = requests.get(
                f"{self.base_url}/zone/route_ips",
                headers=headers,
                params={"country": country}
            )
            
            if response.status_code == 200:
                data = response.json()
                proxies = []
                
                # Bright Data 응답 형식에 따라 파싱
                for zone in data.get('zones', []):
                    if zone.get('type') == 'datacenter':
                        proxy_config = {
                            'endpoint': f"{zone.get('host', 'brd.superproxy.io')}:{zone.get('port', 22225)}",
                            'username': zone.get('username'),
                            'password': zone.get('password'),
                            'country': country,
                            'session_id': None  # 자동 생성
                        }
                        proxies.append(proxy_config)
                
                self.logger.info(f"Found {len(proxies)} datacenter proxies for {country}")
                return proxies
            else:
                self.logger.error(f"Failed to get proxy info: {response.status_code}")
                return []
                
        except Exception as e:
            self.logger.error(f"Error getting proxy configuration: {e}")
            return []
    
    def get_residential_proxies(self, country: str = "KR") -> List[Dict]:
        """주거용 프록시 목록 가져오기 (프리미엄 옵션)"""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(
                f"{self.base_url}/zone/route_ips",
                headers=headers,
                params={"country": country, "type": "residential"}
            )
            
            if response.status_code == 200:
                data = response.json()
                proxies = []
                
                for zone in data.get('zones', []):
                    if zone.get('type') == 'residential':
                        proxy_config = {
                            'endpoint': f"{zone.get('host', 'brd.superproxy.io')}:{zone.get('port', 22225)}",
                            'username': zone.get('username'),
                            'password': zone.get('password'),
                            'country': country,
                            'session_id': None
                        }
                        proxies.append(proxy_config)
                
                self.logger.info(f"Found {len(proxies)} residential proxies for {country}")
                return proxies
            else:
                self.logger.error(f"Failed to get residential proxy info: {response.status_code}")
                return []
                
        except Exception as e:
            self.logger.error(f"Error getting residential proxy configuration: {e}")
            return []
    
    def create_proxy_configs(self) -> List[Dict]:
        """환경변수와 API를 결합하여 프록시 설정 생성"""
        proxy_configs = []
        
        # 1. 환경변수에서 수동 설정된 프록시 확인
        if os.getenv('BRIGHT_DATA_ENDPOINT'):
            manual_config = {
                'endpoint': os.getenv('BRIGHT_DATA_ENDPOINT'),
                'username': os.getenv('BRIGHT_DATA_USERNAME'),
                'password': os.getenv('BRIGHT_DATA_PASSWORD'),
                'session_id': os.getenv('BRIGHT_DATA_SESSION_ID'),
                'country': os.getenv('BRIGHT_DATA_COUNTRY', 'KR')
            }
            proxy_configs.append(manual_config)
            self.logger.info("Added manual proxy configuration from environment")
        
        # 2. API를 통해 추가 프록시 가져오기
        if self.api_key:
            # 데이터센터 프록시 추가
            dc_proxies = self.get_datacenter_proxies()
            proxy_configs.extend(dc_proxies)
            
            # 주거용 프록시 추가 (선택적)
            if os.getenv('USE_RESIDENTIAL_PROXIES', 'false').lower() == 'true':
                res_proxies = self.get_residential_proxies()
                proxy_configs.extend(res_proxies)
        
        # 3. 중복 제거
        unique_configs = []
        seen_endpoints = set()
        
        for config in proxy_configs:
            endpoint = config.get('endpoint')
            if endpoint and endpoint not in seen_endpoints:
                seen_endpoints.add(endpoint)
                unique_configs.append(config)
        
        self.logger.info(f"Total unique proxy configurations: {len(unique_configs)}")
        return unique_configs
    
    def test_proxy_connection(self, proxy_config: Dict) -> bool:
        """프록시 연결 테스트"""
        try:
            proxy_url = f"http://{proxy_config['username']}:{proxy_config['password']}@{proxy_config['endpoint']}"
            
            session = requests.Session()
            session.proxies = {
                'http': proxy_url,
                'https': proxy_url
            }
            
            # IP 확인을 통한 연결 테스트
            response = session.get('https://lumtest.com/myip.json', timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.logger.info(f"Proxy test successful - IP: {data.get('ip')}, Country: {data.get('country')}")
                return True
            else:
                self.logger.error(f"Proxy test failed with status: {response.status_code}")
                return False
                
        except Exception as e:
            self.logger.error(f"Proxy test error: {e}")
            return False

def setup_bright_data_from_api():
    """API를 사용하여 Bright Data 프록시 자동 설정"""
    try:
        api_config = BrightDataAPIConfig()
        proxy_configs = api_config.create_proxy_configs()
        
        if not proxy_configs:
            raise ValueError("No proxy configurations available")
        
        # 첫 번째 프록시 테스트
        if proxy_configs:
            test_proxy = proxy_configs[0]
            if api_config.test_proxy_connection(test_proxy):
                print(f"✅ Proxy connection successful!")
            else:
                print(f"❌ Proxy connection failed!")
        
        return proxy_configs
        
    except Exception as e:
        print(f"Error setting up Bright Data proxies: {e}")
        return []

# 사용 예시
if __name__ == "__main__":
    # API 키 테스트
    api_key = "e3c12c28e3fb28940ef0696d2ce61082a3d2a1bc82649dc19d898778dec42656"
    config = BrightDataAPIConfig(api_key)
    
    # 데이터센터 프록시 가져오기
    dc_proxies = config.get_datacenter_proxies("KR")
    print(f"Datacenter proxies: {json.dumps(dc_proxies, indent=2)}")
    
    # 프록시 테스트
    if dc_proxies:
        test_result = config.test_proxy_connection(dc_proxies[0])
        print(f"Test result: {test_result}")