#!/usr/bin/env python3
"""
2025년 5월 업데이트 크롤러 테스트 스크립트
- 최신 셀렉터 테스트
- IP 로테이션 테스트  
- CAPTCHA 감지 테스트
- 성능 벤치마크
"""
import os
import sys
import json
import time
from datetime import datetime
import logging

# 현재 디렉토리를 파이썬 경로에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_2025_updated_crawler():
    """2025년 5월 업데이트 크롤러 테스트"""
    print("🚀 2025년 5월 업데이트 네이버 플레이스 크롤러 테스트")
    print("=" * 80)
    
    try:
        from updated_naver_crawler_2025 import Updated2025NaverCrawler
        from proxy_manager import ProxyManager, create_proxy_list_from_config
        
        # 프록시 설정
        proxy_list = create_proxy_list_from_config()
        use_proxy = len(proxy_list) > 0
        
        if use_proxy:
            print(f"📡 프록시 {len(proxy_list)}개 감지됨")
            proxy_manager = ProxyManager(proxy_list)
            working_proxies = proxy_manager.test_all_proxies()
            print(f"✅ 작동하는 프록시: {len(working_proxies)}개")
        else:
            print("⚠️  프록시 없이 테스트 진행 (CAPTCHA 위험 높음)")
        
        # 크롤러 초기화
        crawler = Updated2025NaverCrawler(
            headless=False,  # 디버깅을 위해 브라우저 표시
            delay_range=(3, 8),
            use_proxy=use_proxy,
            proxy_list=proxy_list
        )
        
        print("✅ 크롤러 초기화 성공")
        
        # 테스트 케이스들 (2025년 5월 기준)
        test_cases = [
            {
                "keyword": "서울 상암 맛집",
                "shop_name": "맥도날드상암DMC점",
                "description": "기본 테스트 케이스",
                "expected_rank_range": (1, 30)
            },
            {
                "keyword": "강남 카페",
                "shop_name": "스타벅스",
                "description": "일반적인 브랜드 검색",
                "expected_rank_range": (1, 20)
            },
            {
                "keyword": "홍대 치킨",
                "shop_name": "교촌치킨",
                "description": "프랜차이즈 검색",
                "expected_rank_range": (1, 15)
            }
        ]
        
        results = []
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n📝 테스트 케이스 {i}/{len(test_cases)}: {test_case['description']}")
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
                print(f"   🔢 요청 횟수: {result.get('request_count', 'N/A')}")
                print(f"   ✅ 성공: {result['success']}")
                print(f"   🏆 순위: {result['rank']}")
                print(f"   💬 메시지: {result['message']}")
                
                # CAPTCHA 감지 확인
                if "CAPTCHA detected" in result.get('message', ''):
                    print("   🚨 CAPTCHA 감지됨!")
                
                if result['found_shops']:
                    print(f"   📍 발견된 상점들 (상위 5개):")
                    for j, shop in enumerate(result['found_shops'][:5], 1):
                        print(f"      {j}. {shop}")
                
                # 결과 저장
                test_result = {
                    "test_case": i,
                    "keyword": test_case['keyword'],
                    "shop_name": test_case['shop_name'],
                    "description": test_case['description'],
                    "success": result['success'],
                    "rank": result['rank'],
                    "elapsed_time": elapsed,
                    "request_count": result.get('request_count', 0),
                    "found_shops_count": len(result['found_shops']),
                    "message": result['message'],
                    "captcha_detected": "CAPTCHA detected" in result.get('message', '')
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
                    "description": test_case['description'],
                    "success": False,
                    "error": str(e),
                    "elapsed_time": time.time() - start_time
                }
                results.append(test_result)
            
            # 테스트 간 지연 (CAPTCHA 방지)
            if i < len(test_cases):
                wait_time = 10
                print(f"   💤 다음 테스트까지 {wait_time}초 대기 (CAPTCHA 방지)...")
                time.sleep(wait_time)
        
        # 전체 결과 분석
        analyze_test_results(results, use_proxy)
        
        # 결과 저장
        save_test_results(results, use_proxy)
        
    except ImportError as e:
        print(f"❌ 크롤러 모듈을 불러올 수 없습니다: {e}")
        print("   다음 명령어로 의존성을 설치하세요:")
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

def analyze_test_results(results, use_proxy):
    """테스트 결과 분석"""
    print(f"\n📊 테스트 결과 분석")
    print("=" * 50)
    
    total_tests = len(results)
    successful_tests = sum(1 for r in results if r.get('success', False))
    captcha_detected = sum(1 for r in results if r.get('captcha_detected', False))
    
    success_rate = (successful_tests / total_tests) * 100 if total_tests > 0 else 0
    
    print(f"총 테스트: {total_tests}개")
    print(f"성공한 테스트: {successful_tests}개")
    print(f"성공률: {success_rate:.1f}%")
    print(f"CAPTCHA 감지: {captcha_detected}개")
    
    if successful_tests > 0:
        successful_results = [r for r in results if r.get('success', False)]
        avg_time = sum(r.get('elapsed_time', 0) for r in successful_results) / len(successful_results)
        avg_rank = sum(r.get('rank', 0) for r in successful_results) / len(successful_results)
        total_requests = sum(r.get('request_count', 0) for r in results)
        
        print(f"평균 소요 시간: {avg_time:.2f}초")
        print(f"평균 순위: {avg_rank:.1f}위")
        print(f"총 요청 수: {total_requests}개")
    
    # 프록시 사용 평가
    if use_proxy:
        print(f"🌐 프록시 사용: 활성화")
        if captcha_detected == 0:
            print("   ✅ CAPTCHA 회피 성공")
        else:
            print("   ⚠️  CAPTCHA 일부 감지됨 - 프록시 로테이션 필요")
    else:
        print(f"🌐 프록시 사용: 비활성화")
        if captcha_detected > 0:
            print("   🚨 CAPTCHA 감지됨 - 프록시 사용 권장")
    
    # 최종 평가
    if success_rate >= 80 and captcha_detected == 0:
        print("🎉 크롤러가 우수하게 작동합니다!")
        recommendation = "production_ready"
    elif success_rate >= 60:
        print("⚠️  크롤러가 부분적으로 작동합니다. 개선 권장.")
        recommendation = "needs_improvement"
    else:
        print("❌ 크롤러에 심각한 문제가 있습니다.")
        recommendation = "needs_major_fixes"
    
    # 구체적인 권장사항
    print(f"\n💡 권장사항:")
    if captcha_detected > 0:
        print("   - 프록시 로테이션 활성화")
        print("   - 요청 간격 증가 (15-30초)")
        print("   - 일일 요청 제한 준수 (400개/IP)")
    
    if success_rate < 80:
        print("   - 셀렉터 업데이트 확인")
        print("   - 네이버 페이지 구조 변경 점검")
        print("   - 브라우저 개발자 도구로 수동 확인")
    
    return recommendation

def save_test_results(results, use_proxy):
    """테스트 결과 저장"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"test_results_2025_{timestamp}.json"
    
    summary = {
        "test_date": datetime.now().isoformat(),
        "crawler_version": "2025_may_update",
        "proxy_enabled": use_proxy,
        "total_tests": len(results),
        "successful_tests": sum(1 for r in results if r.get('success', False)),
        "captcha_detected": sum(1 for r in results if r.get('captcha_detected', False)),
        "results": results
    }
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    
    print(f"📄 상세 결과가 {filename}에 저장되었습니다.")

def test_selector_update():
    """2025년 5월 셀렉터 업데이트 테스트"""
    print("\n🔍 2025년 5월 셀렉터 업데이트 테스트")
    print("-" * 50)
    
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.common.by import By
        import time
        
        options = Options()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15')
        
        driver = webdriver.Chrome(options=options)
        
        try:
            url = "https://m.search.naver.com/search.naver?where=m&query=서울 상암 맛집"
            driver.get(url)
            time.sleep(5)
            
            # 2025년 5월 업데이트된 셀렉터들 테스트
            selectors_to_test = [
                ('li[data-nclick*="plc"]', '2025년 5월 메인 셀렉터'),
                ('li.place_unit', '기존 셀렉터'),
                ('li[data-place-id]', '백업 셀렉터 1'),
                ('ul.list_place li', '백업 셀렉터 2')
            ]
            
            print("셀렉터 테스트 결과:")
            for selector, description in selectors_to_test:
                try:
                    elements = driver.find_elements(By.CSS_SELECTOR, selector)
                    text_elements = [el for el in elements if el.text.strip()]
                    
                    status = "✅" if len(text_elements) > 0 else "❌"
                    print(f"   {status} {selector:25} ({description:20}): {len(elements):3d}개 (텍스트: {len(text_elements):3d}개)")
                    
                    if len(text_elements) > 0:
                        print(f"      샘플: {text_elements[0].text[:50]}...")
                        
                except Exception as e:
                    print(f"   ❌ {selector:25}: 오류 - {e}")
            
        finally:
            driver.quit()
            
    except Exception as e:
        print(f"❌ 셀렉터 테스트 실패: {e}")

if __name__ == "__main__":
    print("🧪 2025년 5월 업데이트 네이버 플레이스 크롤러 테스트")
    print(f"⏰ 시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 환경 변수 설정
    os.environ['CRAWLER_MODE'] = 'test'
    
    # 로깅 설정
    logging.basicConfig(level=logging.INFO)
    
    # 셀렉터 업데이트 테스트
    test_selector_update()
    
    # 메인 크롤러 테스트
    test_2025_updated_crawler()
    
    print(f"\n✅ 모든 테스트 완료")
    print(f"⏰ 종료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"\n📋 다음 단계:")
    print("1. 테스트 결과를 확인하세요")
    print("2. CAPTCHA가 감지되면 프록시를 설정하세요")
    print("3. 성공률이 낮으면 셀렉터를 재확인하세요")
    print("4. 프로덕션 환경에서는 headless=True로 실행하세요")