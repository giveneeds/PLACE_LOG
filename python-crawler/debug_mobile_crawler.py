#!/usr/bin/env python3
"""
모바일 네이버 플레이스 크롤러 디버깅 도구
실제 HTML 구조와 선택자를 분석합니다.
"""
import requests
import urllib.parse
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime

class MobileCrawlerDebugger:
    def __init__(self):
        # 모바일 헤더 설정
        self.headers = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
            "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": "https://m.place.naver.com/",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
        }

    def debug_search(self, keyword):
        """키워드 검색 디버깅"""
        print(f"🔍 디버깅 시작: '{keyword}'")
        print("=" * 60)
        
        # 1. URL 생성 및 요청
        encoded_keyword = urllib.parse.quote(keyword)
        url = f"https://m.place.naver.com/search?query={encoded_keyword}"
        
        print(f"📍 검색 URL: {url}")
        print(f"📱 User-Agent: {self.headers['User-Agent'][:50]}...")
        
        try:
            session = requests.Session()
            session.headers.update(self.headers)
            
            response = session.get(url, timeout=15)
            print(f"📊 응답 상태: {response.status_code}")
            print(f"📊 응답 크기: {len(response.text)} bytes")
            
            if response.status_code != 200:
                print(f"❌ 요청 실패: {response.status_code}")
                return None
                
            # 2. HTML 구조 분석
            soup = BeautifulSoup(response.text, "html.parser")
            
            # HTML 파일로 저장 (분석용)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"debug_mobile_{keyword.replace(' ', '_')}_{timestamp}.html"
            
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(response.text)
            print(f"💾 HTML 저장됨: {filename}")
            
            # 3. 가능한 리스트 컨테이너 찾기
            print("\n🔍 리스트 컨테이너 분석:")
            list_containers = [
                soup.find_all("ul"),
                soup.find_all("div", class_=lambda x: x and "list" in x.lower()),
                soup.find_all("div", class_=lambda x: x and "place" in x.lower()),
                soup.find_all("div", role="list"),
                soup.find_all("section"),
            ]
            
            for container_type, containers in zip(
                ["ul 태그", "list 클래스", "place 클래스", "role=list", "section 태그"], 
                list_containers
            ):
                if containers:
                    print(f"  📋 {container_type}: {len(containers)}개 발견")
                    for i, container in enumerate(containers[:3]):  # 처음 3개만
                        children = container.find_all(["li", "div"], recursive=False)
                        print(f"    └─ {i+1}번째: {len(children)}개 자식 요소")
            
            # 4. 모든 li 태그 분석
            all_lis = soup.find_all("li")
            print(f"\n📋 전체 li 태그: {len(all_lis)}개")
            
            # 텍스트가 있는 li만 필터링
            text_lis = [li for li in all_lis if li.get_text().strip()]
            print(f"📋 텍스트 포함 li: {len(text_lis)}개")
            
            # 5. 상위 10개 li 태그 내용 분석
            print(f"\n🔍 상위 {min(10, len(text_lis))}개 li 태그 분석:")
            for i, li in enumerate(text_lis[:10]):
                text = li.get_text().strip()[:50]  # 처음 50글자만
                classes = li.get('class', [])
                print(f"  {i+1:2d}. 클래스: {classes}")
                print(f"      텍스트: {text}...")
                
                # 링크가 있는지 확인
                links = li.find_all('a')
                if links:
                    for link in links[:2]:  # 처음 2개만
                        href = link.get('href', '')
                        if 'place' in href:
                            print(f"      📍 플레이스 링크: {href[:50]}...")
                print()
            
            # 6. 특정 키워드가 포함된 요소 찾기
            print(f"🔍 '{keyword}' 관련 요소 검색:")
            keyword_elements = soup.find_all(text=lambda text: text and keyword in text)
            print(f"  📝 키워드 포함 텍스트: {len(keyword_elements)}개")
            
            # 7. 맥도날드 관련 요소 찾기 (테스트용)
            print(f"\n🔍 '맥도날드' 관련 요소 검색:")
            mcdonalds_elements = soup.find_all(text=lambda text: text and '맥도날드' in text)
            print(f"  🍟 맥도날드 포함 텍스트: {len(mcdonalds_elements)}개")
            
            for i, element in enumerate(mcdonalds_elements[:3]):
                parent = element.parent
                print(f"  {i+1}. 텍스트: {element.strip()}")
                print(f"     부모 태그: {parent.name} (클래스: {parent.get('class', [])})")
            
            return soup
            
        except Exception as e:
            print(f"❌ 오류 발생: {e}")
            return None

    def test_selectors(self, soup, keyword):
        """다양한 선택자 테스트"""
        print(f"\n🧪 선택자 테스트:")
        
        test_selectors = [
            "ul li",
            "div[class*='list'] li", 
            "li[class*='place']",
            "div[class*='place']",
            ".list li",
            ".place_list li",
            "[data-place-id]",
            "a[href*='place']",
            "div:has(a[href*='place'])",
        ]
        
        for selector in test_selectors:
            try:
                elements = soup.select(selector)
                print(f"  📋 {selector:25} : {len(elements):3d}개")
                
                # 텍스트가 있는 요소만 카운트
                text_elements = [e for e in elements if e.get_text().strip()]
                if text_elements != elements:
                    print(f"      (텍스트 포함: {len(text_elements)}개)")
                    
            except Exception as e:
                print(f"  ❌ {selector:25} : 오류 - {e}")

def main():
    """메인 디버깅 함수"""
    print("🔧 네이버 모바일 플레이스 크롤러 디버거")
    print("=" * 60)
    
    debugger = MobileCrawlerDebugger()
    
    # 실제 테스트 케이스
    test_keyword = "서울 상암 맛집"
    soup = debugger.debug_search(test_keyword)
    
    if soup:
        debugger.test_selectors(soup, test_keyword)
    
    print("\n" + "=" * 60)
    print("🎯 분석 완료!")
    print("1. 생성된 HTML 파일을 브라우저에서 확인하세요")
    print("2. 실제 네이버 모바일 검색 결과와 비교하세요")
    print("3. 적절한 선택자를 찾아 크롤러를 수정하세요")

if __name__ == "__main__":
    main()