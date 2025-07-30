#!/usr/bin/env python3
"""
올바른 네이버 플레이스 리스트 URL 테스트
"""
import requests
import urllib.parse
from bs4 import BeautifulSoup

def test_correct_naver_url():
    print("🔧 올바른 네이버 플레이스 리스트 URL 테스트")
    print("=" * 60)
    
    keyword = "서울 상암 맛집"
    target_shop = "맥도날드상암DMC점"
    
    # 모바일 헤더
    headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
        "Accept-Language": "ko-KR,ko;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Referer": "https://m.place.naver.com/"
    }
    
    # 올바른 URL 구조 (사용자 제공)
    encoded_keyword = urllib.parse.quote(keyword)
    
    # 간단한 버전부터 테스트
    simple_url = f"https://m.place.naver.com/restaurant/list?query={encoded_keyword}"
    
    print(f"🔍 검색어: {keyword}")
    print(f"🎯 찾는 상점: {target_shop}")
    print(f"🌍 테스트 URL: {simple_url}")
    print()
    
    try:
        session = requests.Session()
        session.headers.update(headers)
        
        response = session.get(simple_url, timeout=15)
        print(f"📊 응답 상태: {response.status_code}")
        print(f"📊 응답 크기: {len(response.text):,} bytes")
        
        if response.status_code != 200:
            print(f"❌ 요청 실패")
            return
        
        # HTML 저장
        with open("naver_restaurant_list.html", "w", encoding="utf-8") as f:
            f.write(response.text)
        print(f"💾 HTML 저장: naver_restaurant_list.html")
        
        # 기본 분석
        soup = BeautifulSoup(response.text, "html.parser")
        
        # 1. 맥도날드 텍스트 확인
        full_text = soup.get_text()
        has_mcdonalds = "맥도날드" in full_text
        print(f"🍟 맥도날드 텍스트 존재: {has_mcdonalds}")
        
        if has_mcdonalds:
            mcd_count = full_text.count("맥도날드")
            print(f"   📊 맥도날드 언급 횟수: {mcd_count}번")
            
            # 정확한 매치 확인
            exact_match = target_shop in full_text
            print(f"   🎯 정확한 상점명 매치: {exact_match}")
        
        # 2. 리스트 구조 분석
        print(f"\n📋 리스트 구조 분석:")
        
        # 다양한 선택자 테스트
        possible_selectors = [
            "li",  # 모든 li
            "div.item", 
            "div.place_item",
            ".restaurant_item",
            ".place",
            "a[href*='restaurant']",  # 레스토랑 링크
            "div[data-place-id]",
            ".list_item",
        ]
        
        best_selector = None
        best_items = []
        
        for selector in possible_selectors:
            try:
                items = soup.select(selector)
                text_items = [item for item in items if item.get_text().strip()]
                
                print(f"   📋 {selector:25}: {len(items):3d}개 (텍스트: {len(text_items)}개)")
                
                # 맥도날드가 포함된 항목이 있는 선택자를 우선시
                mcdonalds_items = [item for item in text_items if "맥도날드" in item.get_text()]
                if mcdonalds_items:
                    print(f"       🍟 맥도날드 포함 항목: {len(mcdonalds_items)}개")
                    
                    if len(text_items) > len(best_items):
                        best_selector = selector
                        best_items = text_items
                        
            except Exception as e:
                print(f"   ❌ {selector:25}: 오류")
        
        # 3. 최적 선택자로 순위 분석
        if best_selector and best_items:
            print(f"\n🎯 최적 선택자: {best_selector}")
            print(f"📋 총 {len(best_items)}개 항목 분석:")
            print()
            
            found_target = False
            
            for i, item in enumerate(best_items[:50], 1):  # 상위 50개만
                text = item.get_text().strip()
                short_text = text.replace('\n', ' ')[:40]
                
                print(f"{i:2d}. {short_text}")
                
                # 목표 상점 찾기
                if "맥도날드" in text and "상암" in text:
                    print(f"    🎯 목표 상점 발견! 순위: {i}등")
                    found_target = True
                elif "맥도날드" in text:
                    print(f"    🍟 다른 맥도날드: {text[:30]}...")
            
            if not found_target:
                print(f"\n❌ 상위 50개에서 목표 상점을 찾지 못함")
        
        else:
            print(f"\n❌ 적절한 선택자를 찾지 못함")
            
            # 전체 텍스트에서 맥도날드 위치 찾기
            if has_mcdonalds:
                print(f"\n🔍 전체 텍스트에서 맥도날드 검색:")
                mcd_elements = soup.find_all(text=lambda text: text and "맥도날드" in text)
                
                for i, element in enumerate(mcd_elements[:10]):
                    parent = element.parent
                    print(f"   {i+1}. 텍스트: {element.strip()}")
                    print(f"      부모 태그: <{parent.name if parent else 'None'}> class='{parent.get('class', []) if parent else []}'")
    
    except Exception as e:
        print(f"❌ 테스트 중 오류: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_correct_naver_url()