#!/usr/bin/env python3
"""
새로운 Selenium 기반 크롤러 테스트 스크립트
"""
import os
import sys
import json
import time
from datetime import datetime

# 현재 디렉토리를 파이썬 경로에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_unified_crawler():
    """통합 크롤러 테스트"""
    print("🚀 새로운 Selenium 기반 네이버 플레이스 크롤러 테스트")
    print("=" * 80)
    
    try:
        from unified_naver_crawler import UnifiedNaverPlaceCrawler
        
        # 크롤러 초기화 (디버깅을 위해 headless=False)
        crawler = UnifiedNaverPlaceCrawler(headless=False, delay_range=(1, 3))
        
        print("✅ 크롤러 초기화 성공")
        
        # 테스트 케이스들
        test_cases = [
            {
                "keyword": "서울 상암 맛집",
                "shop_name": "맥도날드상암DMC점",
                "expected_rank_range": (1, 50)
            },
            {
                "keyword": "강남 카페",
                "shop_name": "스타벅스",
                "expected_rank_range": (1, 30)
            },
            {
                "keyword": "홍대 치킨",
                "shop_name": "교촌치킨",
                "expected_rank_range": (1, 20)
            }
        ]
        
        results = []
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n📝 테스트 케이스 {i}/{len(test_cases)}")
            print(f"   키워드: {test_case['keyword']}")
            print(f"   찾는 상점: {test_case['shop_name']}")
            
            start_time = time.time()
            
            try:
                result = crawler.search_place_rank(
                    test_case['keyword'], 
                    test_case['shop_name']
                )
                
                end_time = time.time()
                elapsed = end_time - start_time
                
                print(f"   ⏱️  소요 시간: {elapsed:.2f}초")
                print(f"   ✅ 성공: {result['success']}")
                print(f"   🏆 순위: {result['rank']}")
                print(f"   💬 메시지: {result['message']}")
                
                if result['found_shops']:
                    print(f"   📍 발견된 상점들 (상위 5개):")
                    for j, shop in enumerate(result['found_shops'][:5], 1):
                        print(f"      {j}. {shop}")
                
                # 결과 저장
                test_result = {
                    "test_case": i,
                    "keyword": test_case['keyword'],
                    "shop_name": test_case['shop_name'],
                    "success": result['success'],
                    "rank": result['rank'],
                    "elapsed_time": elapsed,
                    "found_shops_count": len(result['found_shops']),
                    "message": result['message']
                }
                results.append(test_result)
                
                # 성공률 평가
                if result['success']:
                    expected_min, expected_max = test_case['expected_rank_range']
                    if expected_min <= result['rank'] <= expected_max:
                        print(f"   🎯 예상 순위 범위 내 ({expected_min}-{expected_max}위)")
                    else:
                        print(f"   ⚠️  예상 순위 범위 밖 (예상: {expected_min}-{expected_max}위)")
                else:
                    print(f"   ❌ 검색 실패")
                
            except Exception as e:
                print(f"   ❌ 테스트 실패: {e}")
                test_result = {
                    "test_case": i,
                    "keyword": test_case['keyword'],
                    "shop_name": test_case['shop_name'],
                    "success": False,
                    "error": str(e),
                    "elapsed_time": time.time() - start_time
                }
                results.append(test_result)
            
            # 테스트 간 지연
            if i < len(test_cases):
                print("   💤 다음 테스트까지 5초 대기...")
                time.sleep(5)
        
        # 전체 결과 요약
        print(f"\n📊 테스트 결과 요약")
        print("=" * 50)
        
        success_count = sum(1 for r in results if r.get('success', False))
        total_count = len(results)
        success_rate = (success_count / total_count) * 100 if total_count > 0 else 0
        
        print(f"성공한 테스트: {success_count}/{total_count} ({success_rate:.1f}%)")
        
        if success_count > 0:
            successful_results = [r for r in results if r.get('success', False)]
            avg_time = sum(r['elapsed_time'] for r in successful_results) / len(successful_results)
            avg_rank = sum(r['rank'] for r in successful_results) / len(successful_results)
            
            print(f"평균 소요 시간: {avg_time:.2f}초")
            print(f"평균 순위: {avg_rank:.1f}위")
        
        # 결과를 JSON 파일로 저장
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        result_file = f"test_results_{timestamp}.json"
        
        with open(result_file, 'w', encoding='utf-8') as f:
            json.dump({
                "test_date": datetime.now().isoformat(),
                "crawler_type": "UnifiedNaverPlaceCrawler",
                "total_tests": total_count,
                "successful_tests": success_count,
                "success_rate": success_rate,
                "results": results
            }, f, ensure_ascii=False, indent=2)
        
        print(f"📄 상세 결과를 {result_file}에 저장했습니다.")
        
        # 최종 평가
        if success_rate >= 80:
            print("🎉 크롤러가 정상적으로 작동합니다!")
        elif success_rate >= 60:
            print("⚠️  크롤러가 부분적으로 작동합니다. 개선이 필요합니다.")
        else:
            print("❌ 크롤러에 심각한 문제가 있습니다. 수정이 필요합니다.")
        
    except ImportError as e:
        print(f"❌ 크롤러 모듈을 불러올 수 없습니다: {e}")
        print("   selenium이 설치되어 있는지 확인하세요:")
        print("   pip install -r requirements_selenium.txt")
    
    except Exception as e:
        print(f"❌ 테스트 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        try:
            if 'crawler' in locals():
                crawler.close()
                print("🔒 크롤러 리소스 정리 완료")
        except:
            pass

def test_cid_crawler():
    """CID 기반 크롤러 테스트"""
    print("\n🔍 CID 기반 크롤러 테스트")
    print("=" * 50)
    
    try:
        from cid_enhanced_crawler import CIDEnhancedNaverCrawler
        
        crawler = CIDEnhancedNaverCrawler(headless=False, delay_range=(1, 3))
        
        # CID 추출 테스트
        keyword = "서울 상암 맛집"
        print(f"키워드 '{keyword}'로 CID 추출 테스트...")
        
        places = crawler.extract_multiple_place_cids(keyword, max_results=5)
        
        if places:
            print(f"✅ {len(places)}개 플레이스 CID 추출 성공:")
            for i, place in enumerate(places, 1):
                print(f"   {i}. {place['name']} (CID: {place['cid']})")
            
            # 첫 번째 플레이스로 순위 검색 테스트
            test_place = places[0]
            print(f"\n🎯 '{test_place['name']}'의 순위 검색 테스트...")
            
            result = crawler.get_place_rank_by_cid(keyword, test_place['cid'])
            
            print(f"   성공: {result['success']}")
            print(f"   순위: {result['rank']}")
            print(f"   광고: {result['is_ad']}")
            print(f"   메시지: {result['message']}")
            
        else:
            print("❌ CID 추출 실패")
        
        crawler.close()
        
    except ImportError as e:
        print(f"❌ CID 크롤러 모듈을 불러올 수 없습니다: {e}")
    except Exception as e:
        print(f"❌ CID 테스트 중 오류: {e}")

if __name__ == "__main__":
    print("🧪 네이버 플레이스 크롤러 테스트 시작")
    print(f"⏰ 시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 환경 변수 설정 (테스트 모드)
    os.environ['CRAWLER_MODE'] = 'test'
    
    # 메인 테스트
    test_unified_crawler()
    
    # CID 테스트 (선택사항)
    test_cid = input("\n🤔 CID 기반 크롤러도 테스트하시겠습니까? (y/n): ").lower().strip()
    if test_cid == 'y':
        test_cid_crawler()
    
    print(f"\n✅ 모든 테스트 완료")
    print(f"⏰ 종료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")