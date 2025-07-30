#!/usr/bin/env python3
"""
네이버 모바일 HTML 다운로드
"""
import requests
import urllib.parse

def download_naver_mobile_html():
    print("📱 네이버 모바일 HTML 다운로드 중...")
    
    keyword = "서울 상암 맛집"
    
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
    print(f"🌍 URL: {url}")
    
    try:
        # 요청
        response = requests.get(url, headers=headers, timeout=15)
        
        if response.status_code == 200:
            # HTML 파일 저장
            filename = "naver_mobile_search.html"
            with open(filename, "w", encoding="utf-8") as f:
                f.write(response.text)
            
            print(f"✅ 성공!")
            print(f"📄 파일 저장: {filename}")
            print(f"🔍 브라우저에서 파일을 열어서 확인하세요")
            
            # 기본 정보 출력
            print(f"\n📊 기본 정보:")
            print(f"   - 응답 크기: {len(response.text):,} bytes")
            
            # 맥도날드 텍스트 확인
            if "맥도날드" in response.text:
                count = response.text.count("맥도날드")
                print(f"   - 맥도날드 언급: {count}회")
            else:
                print(f"   - 맥도날드 언급: 없음")
                
        else:
            print(f"❌ 요청 실패: {response.status_code}")
            
    except Exception as e:
        print(f"❌ 오류: {e}")

if __name__ == "__main__":
    download_naver_mobile_html()