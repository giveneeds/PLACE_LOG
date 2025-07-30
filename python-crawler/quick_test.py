#!/usr/bin/env python3
"""
빠른 문제 진단 도구
"""
import requests
import urllib.parse
from bs4 import BeautifulSoup

def quick_diagnosis():
    print("🚨 긴급 진단: 네이버 모바일 플레이스 크롤링")
    print("=" * 50)
    
    keyword = "서울 상암 맛집"
    target_shop = "맥도날드상암DMC점"
    
    # 모바일 헤더
    headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
        "Accept-Language": "ko-KR,ko;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
    
    # URL 생성
    encoded_keyword = urllib.parse.quote(keyword)
    url = f"https://m.place.naver.com/search?query={encoded_keyword}"
    
    print(f"🔍 검색어: {keyword}")
    print(f"🎯 찾는 상점: {target_shop}")
    print(f"🌍 URL: {url}")
    print()
    
    try:
        # 요청
        response = requests.get(url, headers=headers, timeout=15)
        print(f"📊 응답 상태: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ 요청 실패")
            return
        
        # HTML 저장 (분석용)
        with open("quick_diagnosis.html", "w", encoding="utf-8") as f:
            f.write(response.text)
        print(f"💾 HTML 저장: quick_diagnosis.html")
        
        # 기본 분석
        soup = BeautifulSoup(response.text, "html.parser")
        
        # 1. 맥도날드 텍스트가 있는지 확인
        full_text = soup.get_text()
        mcd_in_page = "맥도날드" in full_text
        print(f"🍟 맥도날드 텍스트 존재: {mcd_in_page}")
        
        if mcd_in_page:
            # 맥도날드가 몇 번 나오는지
            mcd_count = full_text.count("맥도날드")
            print(f"   📊 맥도날드 언급 횟수: {mcd_count}번")
            
            # 맥도날드 상암DMC점이 정확히 있는지
            exact_match = target_shop in full_text
            print(f"   🎯 정확한 상점명 존재: {exact_match}")
            
            # 상암 관련 맥도날드 찾기
            sangam_mcd = "상암" in full_text and "맥도날드" in full_text
            print(f"   🏢 상암+맥도날드 조합: {sangam_mcd}")
        
        # 2. 리스트 구조 분석
        print(f"\n📋 리스트 구조 분석:")
        
        # 모든 li 태그
        all_lis = soup.find_all("li")
        print(f"   전체 li 태그: {len(all_lis)}개")
        
        # 텍스트가 있는 li
        text_lis = [li for li in all_lis if li.get_text().strip()]
        print(f"   텍스트 포함 li: {len(text_lis)}개")
        
        # 3. 가능한 플레이스 항목들 찾기
        print(f"\n🏪 플레이스 항목 분석:")
        
        # 링크가 있는 항목들
        place_links = soup.find_all("a", href=lambda href: href and "place" in href)
        print(f"   place 링크: {len(place_links)}개")
        
        # 상위 10개 텍스트 li 내용 확인
        print(f"\n📝 상위 텍스트 li 내용:")
        for i, li in enumerate(text_lis[:10]):
            text = li.get_text().strip()[:30]  # 30글자만
            print(f"   {i+1:2d}. {text}...")
        
        # 4. 실제 문제 진단
        print(f"\n🔍 문제 진단:")
        
        if not mcd_in_page:
            print("   ❌ 문제 1: 맥도날드가 검색 결과에 없음")
            print("      → 키워드나 검색 방식 문제일 수 있음")
        
        if len(text_lis) == 0:
            print("   ❌ 문제 2: 리스트 항목을 찾을 수 없음")
            print("      → HTML 구조나 선택자 문제")
        
        if len(place_links) == 0:
            print("   ❌ 문제 3: 플레이스 링크가 없음")
            print("      → 페이지 구조가 예상과 다름")
        
        # 5. 해결 방향 제시
        print(f"\n💡 해결 방향:")
        if not mcd_in_page:
            print("   1. 다른 키워드로 테스트 (예: '상암동 맛집', '상암 햄버거')")
            print("   2. 데스크톱 버전과 비교")
        
        if len(text_lis) == 0:
            print("   3. HTML 파일을 브라우저에서 열어 실제 구조 확인")
            print("   4. 네이버 모바일 사이트 직접 방문하여 비교")
            
    except Exception as e:
        print(f"❌ 진단 중 오류: {e}")

if __name__ == "__main__":
    quick_diagnosis()