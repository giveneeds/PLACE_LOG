#!/usr/bin/env python3
"""
2025년 현재 네이버 페이지 구조 실시간 분석
실패 원인을 정확히 파악하기 위한 디버깅 스크립트
"""
import time
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import json

def analyze_current_naver_structure():
    """현재 네이버 페이지 구조 분석"""
    print("🔍 2025년 현재 네이버 페이지 구조 분석")
    print("=" * 80)
    
    keyword = "서울 상암 맛집"
    target_shop = "맥도날드상암DMC점"
    
    # 1. requests 방식으로 확인
    print("\n📡 1. Requests 방식 분석")
    print("-" * 40)
    
    headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1"
    }
    
    urls_to_test = [
        f"https://m.search.naver.com/search.naver?where=m&query={keyword}",
        f"https://m.place.naver.com/list?query={keyword}",
        f"https://m.place.naver.com/restaurant/list?query={keyword}",
        f"https://search.naver.com/search.naver?where=nexearch&query={keyword}",
    ]
    
    for i, url in enumerate(urls_to_test, 1):
        print(f"\n🌐 URL {i}: {url}")
        try:
            response = requests.get(url, headers=headers, timeout=10)
            print(f"   Status: {response.status_code}")
            print(f"   Content Length: {len(response.text):,} bytes")
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 맥도날드 텍스트 확인
            has_mcdonalds = "맥도날드" in response.text
            print(f"   Contains '맥도날드': {has_mcdonalds}")
            
            if has_mcdonalds:
                mcd_count = response.text.count("맥도날드")
                print(f"   '맥도날드' 언급 횟수: {mcd_count}")
            
            # iframe 확인
            iframes = soup.find_all('iframe')
            print(f"   iframes: {len(iframes)}")
            for j, iframe in enumerate(iframes[:3]):
                src = iframe.get('src', '')
                print(f"     iframe {j+1}: {src[:100]}")
            
            # JavaScript 확인
            scripts = soup.find_all('script')
            js_urls = [script.get('src') for script in scripts if script.get('src')]
            print(f"   External JS files: {len(js_urls)}")
            
        except Exception as e:
            print(f"   Error: {e}")
    
    # 2. Selenium 방식으로 확인
    print(f"\n🤖 2. Selenium 방식 분석")
    print("-" * 40)
    
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument(f'--user-agent={headers["User-Agent"]}')
    
    driver = None
    try:
        driver = webdriver.Chrome(options=options)
        
        for i, url in enumerate(urls_to_test[:2], 1):  # 처음 2개만 테스트
            print(f"\n🚗 Selenium URL {i}: {url}")
            
            try:
                driver.get(url)
                time.sleep(5)  # 페이지 로딩 대기
                
                page_source_length = len(driver.page_source)
                print(f"   Page source length: {page_source_length:,} bytes")
                
                # 맥도날드 텍스트 확인
                has_mcdonalds = "맥도날드" in driver.page_source
                print(f"   Contains '맥도날드': {has_mcdonalds}")
                
                if has_mcdonalds:
                    mcd_count = driver.page_source.count("맥도날드")
                    print(f"   '맥도날드' 언급 횟수: {mcd_count}")
                
                # 플레이스 관련 요소들 찾기
                place_selectors = [
                    "li", "ul", "div[class*='place']", "div[class*='list']",
                    "a[href*='place']", "[data-place-id]", ".place_name"
                ]
                
                print("   🔍 요소 분석:")
                for selector in place_selectors:
                    try:
                        elements = driver.find_elements(By.CSS_SELECTOR, selector)
                        text_elements = [el for el in elements if el.text.strip()]
                        print(f"     {selector:20}: {len(elements):3d}개 (텍스트: {len(text_elements):3d}개)")
                        
                        # 맥도날드가 포함된 요소 찾기
                        mcd_elements = [el for el in text_elements if "맥도날드" in el.text]
                        if mcd_elements:
                            print(f"       🍟 맥도날드 포함: {len(mcd_elements)}개")
                            for j, el in enumerate(mcd_elements[:3]):
                                print(f"         {j+1}. {el.text[:50]}...")
                                
                    except Exception as e:
                        print(f"     {selector:20}: Error - {e}")
                
                # 현재 URL 확인 (리다이렉트 되었는지)
                current_url = driver.current_url
                if current_url != url:
                    print(f"   🔄 Redirected to: {current_url}")
                
                # 페이지 HTML 샘플 저장
                with open(f"naver_page_sample_{i}.html", "w", encoding="utf-8") as f:
                    f.write(driver.page_source)
                print(f"   💾 Page saved to: naver_page_sample_{i}.html")
                
            except Exception as e:
                print(f"   Error with Selenium: {e}")
    
    except Exception as e:
        print(f"❌ Selenium 초기화 실패: {e}")
        print("Chrome 브라우저가 설치되어 있는지 확인하세요.")
    
    finally:
        if driver:
            driver.quit()
    
    # 3. 네이버 플레이스 API 분석
    print(f"\n🔗 3. 네이버 플레이스 API 패턴 분석")
    print("-" * 40)
    
    # 실제 네이버에서 사용하는 API 패턴들
    api_patterns = [
        "https://pcmap.place.naver.com/place/list",
        "https://map.naver.com/p/api/search",
        "https://m.place.naver.com/api/search",
        "https://shopping.naver.com/api/place"
    ]
    
    for pattern in api_patterns:
        print(f"   🔍 {pattern}")
        try:
            test_url = f"{pattern}?query={keyword}"
            response = requests.get(test_url, headers=headers, timeout=5)
            print(f"     Status: {response.status_code}")
            
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                print(f"     Content-Type: {content_type}")
                
                if 'json' in content_type:
                    try:
                        data = response.json()
                        print(f"     JSON Keys: {list(data.keys())}")
                    except:
                        print(f"     JSON Parse Error")
                else:
                    print(f"     Content Length: {len(response.text)} bytes")
                    
        except Exception as e:
            print(f"     Error: {e}")

def analyze_failure_patterns():
    """실패 패턴 분석"""
    print(f"\n❌ 4. 일반적인 실패 원인 분석")
    print("-" * 40)
    
    failure_patterns = {
        "JavaScript 렌더링": "네이버가 React/Vue 등으로 동적 렌더링하는 경우",
        "봇 탐지": "User-Agent, 요청 패턴으로 봇을 감지하여 차단",
        "CAPTCHA": "자동화 도구 감지 시 CAPTCHA 표시",
        "Rate Limiting": "너무 빠른 요청으로 인한 일시적 차단",
        "URL 변경": "네이버가 URL 구조를 변경한 경우",
        "선택자 변경": "CSS 클래스명이나 구조가 변경된 경우",
        "지역 제한": "특정 지역에서만 접근 가능한 콘텐츠",
        "로그인 필요": "일부 기능이 로그인을 요구하는 경우"
    }
    
    for pattern, description in failure_patterns.items():
        print(f"   📍 {pattern:15}: {description}")
    
    print(f"\n💡 해결 방안:")
    solutions = [
        "Selenium + 충분한 대기 시간",
        "다양한 User-Agent 로테이션", 
        "프록시 사용",
        "요청 간격 랜덤화 (3-10초)",
        "모바일 버전 우선 사용",
        "iframe 내부 콘텐츠 확인",
        "네트워크 탭에서 실제 API 호출 분석"
    ]
    
    for i, solution in enumerate(solutions, 1):
        print(f"   {i}. {solution}")

if __name__ == "__main__":
    analyze_current_naver_structure()
    analyze_failure_patterns()
    
    print(f"\n📋 다음 단계:")
    print("1. 저장된 HTML 파일들을 확인하세요")
    print("2. 브라우저 개발자 도구로 실제 네이버 페이지를 분석하세요")
    print("3. Network 탭에서 실제 API 호출을 확인하세요")
    print("4. 분석 결과를 바탕으로 크롤러를 수정하세요")