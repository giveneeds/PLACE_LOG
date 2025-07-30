#!/usr/bin/env python3
"""
크롤러 문제 분석 도구
사용자가 제공한 정확한 케이스로 단계별 분석
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from crawler import NaverPlaceCrawler
import requests
import urllib.parse
from bs4 import BeautifulSoup

def analyze_user_case():
    """사용자 제공 케이스 분석"""
    print("🔍 사용자 케이스 분석")
    print("=" * 50)
    
    # 사용자 제공 정보
    place_url = "https://m.place.naver.com/restaurant/38758389"
    place_name = "맥도날드상암DMC점"
    search_keyword = "서울 상암 맛집"
    
    print(f"📍 플레이스 URL: {place_url}")
    print(f"🏪 플레이스명: {place_name}")
    print(f"🔍 검색 키워드: {search_keyword}")
    print()
    
    # 1단계: URL 검증
    print("1️⃣ URL 파싱 검증")
    try:
        from urllib.parse import urlparse
        parsed = urlparse(place_url)
        path_parts = parsed.path.split('/')
        place_id = path_parts[-1] if path_parts else None
        print(f"   ✅ 호스트: {parsed.hostname}")
        print(f"   ✅ 경로: {parsed.path}")
        print(f"   ✅ 플레이스 ID: {place_id}")
    except Exception as e:
        print(f"   ❌ URL 파싱 오류: {e}")
    
    # 2단계: 크롤러 초기화 테스트
    print("\n2️⃣ 크롤러 초기화")
    try:
        crawler = NaverPlaceCrawler()
        search_url = crawler.build_url(search_keyword)
        print(f"   ✅ 크롤러 생성됨")
        print(f"   ✅ 검색 URL: {search_url}")
    except Exception as e:
        print(f"   ❌ 크롤러 초기화 오류: {e}")
        return
    
    # 3단계: 네트워크 요청 테스트
    print("\n3️⃣ 네트워크 요청 테스트")
    try:
        session = requests.Session()
        session.headers.update(crawler.headers)
        
        response = session.get(search_url, timeout=10)
        print(f"   ✅ 상태 코드: {response.status_code}")
        print(f"   ✅ 응답 크기: {len(response.text)} bytes")
        print(f"   ✅ Content-Type: {response.headers.get('content-type', 'Unknown')}")
        
        if response.status_code != 200:
            print(f"   ❌ 비정상 상태 코드")
            return
            
    except Exception as e:
        print(f"   ❌ 네트워크 오류: {e}")
        return
    
    # 4단계: HTML 구조 분석
    print("\n4️⃣ HTML 구조 분석")
    soup = BeautifulSoup(response.text, "html.parser")
    
    # 기본 구조 확인
    title = soup.find('title')
    print(f"   📄 페이지 제목: {title.get_text() if title else 'None'}")
    
    # 자바스크립트 리다이렉트나 에러 페이지 확인
    if "window.location" in response.text or "redirect" in response.text.lower():
        print("   ⚠️  리다이렉트 감지됨")
    
    if "error" in response.text.lower() or "오류" in response.text:
        print("   ⚠️  에러 페이지일 수 있음")
    
    # 5단계: 리스트 요소 찾기
    print("\n5️⃣ 리스트 요소 검색")
    
    # 현재 크롤러의 선택자들 테스트
    mobile_selectors = [
        "div.list_place li",
        "ul.list_place li", 
        "li.place_item",
        "div.place_list li",
        "div.search_list li",
        "ul li",  # 가장 일반적인 선택자
    ]
    
    for selector in mobile_selectors:
        try:
            items = soup.select(selector)
            print(f"   📋 {selector:20}: {len(items):3d}개")
            
            # 텍스트가 있는 항목만 세기
            text_items = [item for item in items if item.get_text().strip()]
            if len(text_items) != len(items):
                print(f"       (텍스트 포함: {len(text_items)}개)")
                
        except Exception as e:
            print(f"   ❌ {selector:20}: {e}")
    
    # 6단계: 맥도날드 텍스트 검색
    print("\n6️⃣ 목표 플레이스 검색")
    
    # 전체 텍스트에서 맥도날드 검색
    all_text = soup.get_text()
    if "맥도날드" in all_text:
        print("   ✅ 페이지에 '맥도날드' 텍스트 존재")
        
        # 맥도날드가 포함된 요소들 찾기
        mcdonalds_elements = soup.find_all(text=lambda text: text and "맥도날드" in text)
        print(f"   📍 맥도날드 포함 텍스트: {len(mcdonalds_elements)}개")
        
        for i, element in enumerate(mcdonalds_elements[:5]):
            parent = element.parent
            print(f"      {i+1}. '{element.strip()}'")
            print(f"         부모: <{parent.name} class='{parent.get('class', [])}'>")
    else:
        print("   ❌ 페이지에 '맥도날드' 텍스트 없음")
        print("   🔍 대신 다른 맛집들이 있는지 확인:")
        
        # 일반적인 음식점 키워드들 검색
        food_keywords = ["치킨", "피자", "버거", "카페", "식당", "음식점"]
        for keyword in food_keywords:
            if keyword in all_text:
                count = all_text.count(keyword)
                print(f"      📍 '{keyword}': {count}번 발견")
    
    # 7단계: 실제 크롤러 실행
    print("\n7️⃣ 실제 크롤러 실행")
    try:
        result = crawler.search_place_rank(search_keyword, place_name)
        print(f"   🎯 크롤링 결과:")
        print(f"      성공: {result['success']}")
        print(f"      순위: {result['rank']}")
        print(f"      메시지: {result['message']}")
        print(f"      발견된 상점 수: {len(result.get('found_shops', []))}")
        
        if result.get('found_shops'):
            print(f"      발견된 상점들:")
            for i, shop in enumerate(result['found_shops'][:10]):
                print(f"         {i+1:2d}. {shop}")
                
    except Exception as e:
        print(f"   ❌ 크롤러 실행 오류: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 분석 완료!")

def save_debug_html():
    """디버깅용 HTML 파일 저장"""
    print("\n💾 디버깅용 HTML 저장")
    
    crawler = NaverPlaceCrawler()
    search_url = crawler.build_url("서울 상암 맛집")
    
    try:
        session = requests.Session()
        session.headers.update(crawler.headers)
        response = session.get(search_url, timeout=10)
        
        filename = "debug_seoul_sangam_food.html"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(response.text)
        
        print(f"   ✅ HTML 저장됨: {filename}")
        print(f"   🔍 브라우저에서 파일을 열어 실제 구조를 확인하세요")
        
    except Exception as e:
        print(f"   ❌ HTML 저장 실패: {e}")

if __name__ == "__main__":
    analyze_user_case()
    save_debug_html()