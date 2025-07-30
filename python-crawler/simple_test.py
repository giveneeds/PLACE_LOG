#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
간단한 범용 네이버 크롤러 테스트
- 모듈 import 테스트
- 기본 기능 테스트
"""
import sys
import os

def test_import():
    """모듈 import 테스트"""
    print("모듈 import 테스트")
    print("-" * 30)
    
    try:
        from universal_naver_crawler import UniversalNaverCrawler
        print("✅ universal_naver_crawler 모듈 import 성공")
        return True
    except ImportError as e:
        print(f"❌ universal_naver_crawler 모듈 import 실패: {e}")
        
        # selenium 패키지 확인
        try:
            import selenium
            print(f"✅ selenium 버전: {selenium.__version__}")
        except ImportError:
            print("❌ selenium 패키지가 설치되지 않았습니다")
            print("   pip install selenium webdriver-manager 명령으로 설치하세요")
        
        return False

def test_basic_functionality():
    """기본 기능 테스트"""
    print("\n🧪 기본 기능 테스트")
    print("-" * 30)
    
    try:
        from universal_naver_crawler import UniversalNaverCrawler
        
        # 크롤러 초기화 (headless 모드)
        crawler = UniversalNaverCrawler(
            headless=True,
            delay_range=(2, 5),
            use_proxy=False
        )
        
        print("✅ 크롤러 초기화 성공")
        
        # 간단한 기능 테스트
        test_cases = [
            {
                "keyword": "강남 맛집", 
                "shop_name": "스타벅스",
                "description": "기본 테스트 케이스"
            }
        ]
        
        print(f"📝 테스트 케이스 1개 실행")
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n🔍 테스트 {i}: {test_case['description']}")
            print(f"   키워드: {test_case['keyword']}")
            print(f"   찾는 상점: {test_case['shop_name']}")
            
            try:
                result = crawler.search_place_rank(
                    test_case['keyword'], 
                    test_case['shop_name'], 
                    max_rank=10  # 테스트용으로 10위까지만
                )
                
                print(f"   ✅ 성공: {result['success']}")
                print(f"   🏆 순위: {result['rank']}")
                print(f"   🌍 지역: {result.get('search_region', 'N/A')}")
                print(f"   🏪 업종: {result.get('search_category', 'N/A')}")
                print(f"   💬 메시지: {result['message']}")
                
                if result['found_shops']:
                    print(f"   📍 발견된 상점 (상위 3개): {', '.join(result['found_shops'][:3])}")
                
                # 통계 확인
                stats = crawler.get_statistics()
                print(f"   📊 성공률: {stats['success_rate']:.1f}%")
                
                return True
                
            except Exception as e:
                print(f"   ❌ 테스트 실패: {e}")
                return False
        
    except Exception as e:
        print(f"❌ 기본 기능 테스트 실패: {e}")
        return False
    
    finally:
        try:
            if 'crawler' in locals():
                crawler.close()
                print("\n🔒 크롤러 리소스 정리 완료")
        except:
            pass

def main():
    """메인 테스트 함수"""
    print("🚀 범용 네이버 플레이스 크롤러 간단 테스트")
    print("=" * 60)
    
    # 1. Import 테스트
    if not test_import():
        print("\n❌ 모듈 import에 실패했습니다. 패키지 설치를 확인하세요.")
        return
    
    # 2. 기본 기능 테스트
    if test_basic_functionality():
        print("\n🎉 모든 테스트가 성공했습니다!")
        print("✅ 범용 크롤러가 정상적으로 작동합니다.")
        print("\n📋 다음 단계:")
        print("   1. test_universal_crawler.py로 전체 테스트 실행")
        print("   2. 다양한 지역/업종 조합으로 테스트")
        print("   3. 프로덕션 환경에서 배치 처리 테스트")
    else:
        print("\n⚠️ 일부 테스트에서 문제가 발견되었습니다.")
        print("   크롤러 설정이나 네이버 페이지 구조를 확인하세요.")

if __name__ == "__main__":
    main()