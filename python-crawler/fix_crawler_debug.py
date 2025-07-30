#!/usr/bin/env python3
"""
크롤러 버그 수정을 위한 디버깅
실제로 28등 맥도날드를 찾을 수 있는지 확인
"""
import requests
import urllib.parse
from bs4 import BeautifulSoup
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def debug_crawler_parsing():
    print("🔧 크롤러 파싱 버그 디버깅")
    print("=" * 50)
    
    keyword = "서울 상암 맛집"
    target_shop = "맥도날드상암DMC점"
    
    # 모바일 헤더 (현재 크롤러와 동일)
    headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://m.place.naver.com/",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
    }
    
    # URL (현재 크롤러와 동일)
    encoded_keyword = urllib.parse.quote(keyword)
    url = f"https://m.place.naver.com/search?query={encoded_keyword}"
    
    print(f"🔍 검색어: {keyword}")
    print(f"🎯 찾는 상점: {target_shop} (28등)")
    print(f"🌍 URL: {url}")
    print()
    
    try:
        # 요청
        session = requests.Session()
        session.headers.update(headers)
        response = session.get(url, timeout=15)
        
        print(f"📊 응답 상태: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ 요청 실패")
            return
        
        # HTML 저장
        with open("debug_parsing.html", "w", encoding="utf-8") as f:
            f.write(response.text)
        print(f"💾 HTML 저장: debug_parsing.html")
        
        # 파싱
        soup = BeautifulSoup(response.text, "html.parser")
        
        # 현재 크롤러가 사용하는 선택자들 테스트
        print(f"\n🧪 현재 크롤러 선택자 테스트:")
        
        mobile_selectors = [
            "div.list_place li",
            "ul.list_place li", 
            "li.place_item",
            "div.place_list li",
            "div.search_list li",
            ".PlaceListView li",
            ".search-result li",
            "li[data-place-id]",
            "li.place",
            "ul li:has(.place_title)",
            "ul li:has(.place_name)",
            "ul li:has(h3)",
            "ul li:has(.name)",
            "ul li",
            "div[role='list'] > div",
            ".list > li",
        ]
        
        best_selector = None
        best_count = 0
        
        for selector in mobile_selectors:
            try:
                items = soup.select(selector)
                text_items = [item for item in items if item.get_text().strip()]
                
                print(f"   📋 {selector:25}: {len(items):3d}개 (텍스트: {len(text_items)}개)")
                
                # 가장 많은 항목을 가진 선택자 기록
                if len(text_items) > best_count:
                    best_count = len(text_items)
                    best_selector = selector
                    
            except Exception as e:
                print(f"   ❌ {selector:25}: 오류")
        
        if best_selector:
            print(f"\n🎯 최적 선택자: {best_selector} ({best_count}개 항목)")
            
            # 최적 선택자로 항목들 분석
            items = soup.select(best_selector)
            text_items = [item for item in items if item.get_text().strip()]
            
            print(f"\n📋 상위 50개 항목 분석:")
            print(f"{'순위':>4} {'상점명':>30} {'텍스트 길이':>10}")
            print("-" * 50)
            
            found_mcdonalds = []
            
            for i, item in enumerate(text_items[:50], 1):
                text = item.get_text().strip()
                short_text = text[:30] if len(text) > 30 else text
                
                print(f"{i:4d} {short_text:>30} {len(text):10d}")
                
                # 맥도날드 관련 텍스트 찾기
                if "맥도날드" in text:
                    found_mcdonalds.append((i, text))
                    print(f"     🍟 맥도날드 발견!")
                
                # 상암 관련 키워드
                if "상암" in text:
                    print(f"     🏢 상암 관련!")
            
            # 맥도날드 발견 결과
            print(f"\n🍟 맥도날드 발견 결과:")
            if found_mcdonalds:
                for rank, text in found_mcdonalds:
                    print(f"   {rank}등: {text}")
                    
                    # 정확한 매치 확인
                    if "상암DMC" in text or "상암dmc" in text.lower():
                        print(f"      ✅ 목표 상점 발견! (파싱 순위: {rank}등)")
            else:
                print("   ❌ 맥도날드를 찾을 수 없음")
        
        else:
            print(f"\n❌ 유효한 선택자를 찾을 수 없음")
            
            # 전체 텍스트에서 맥도날드 검색
            full_text = soup.get_text()
            if "맥도날드" in full_text:
                print(f"   ⚠️  전체 텍스트에는 맥도날드가 있음 - 선택자 문제")
                
                # 맥도날드가 포함된 모든 요소 찾기
                mcd_elements = soup.find_all(text=lambda text: text and "맥도날드" in text)
                print(f"   📍 맥도날드 포함 요소: {len(mcd_elements)}개")
                
                for i, element in enumerate(mcd_elements[:5]):
                    parent = element.parent
                    grandparent = parent.parent if parent else None
                    
                    print(f"      {i+1}. 텍스트: {element.strip()}")
                    print(f"         부모: <{parent.name if parent else 'None'} class='{parent.get('class', []) if parent else []}'>")
                    print(f"         조부모: <{grandparent.name if grandparent else 'None'} class='{grandparent.get('class', []) if grandparent else []}'>")
                    print()
            else:
                print(f"   ❌ 전체 텍스트에도 맥도날드 없음 - 요청 문제")
    
    except Exception as e:
        print(f"❌ 디버깅 중 오류: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_crawler_parsing()