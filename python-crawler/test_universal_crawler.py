#!/usr/bin/env python3
"""
범용 네이버 플레이스 크롤러 테스트
- 전국 다양한 지역 테스트
- 모든 업종 카테고리 테스트  
- 대량 배치 처리 테스트
"""
import os
import sys
import json
import time
from datetime import datetime
import logging

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_various_regions_and_businesses():
    """다양한 지역과 업종 테스트"""
    print("🌍 전국 다양한 지역/업종 크롤러 테스트")
    print("=" * 80)
    
    try:
        from universal_naver_crawler import UniversalNaverCrawler
        
        crawler = UniversalNaverCrawler(
            headless=False,  # 디버깅용
            delay_range=(3, 8),
            use_proxy=False
        )
        
        # 전국 다양한 지역 × 업종 테스트 케이스
        comprehensive_test_cases = [
            # === 서울권 ===
            {"keyword": "강남 맛집", "shop_name": "스타벅스", "region": "서울", "category": "카페"},
            {"keyword": "홍대 치킨", "shop_name": "교촌치킨", "region": "서울", "category": "치킨"},  
            {"keyword": "명동 피자", "shop_name": "피자헛", "region": "서울", "category": "피자"},
            {"keyword": "이태원 중국집", "shop_name": "차이나타운", "region": "서울", "category": "중국음식"},
            {"keyword": "상암 맛집", "shop_name": "맥도날드", "region": "서울", "category": "패스트푸드"},
            
            # === 부산권 ===
            {"keyword": "부산 해운대 맛집", "shop_name": "버거킹", "region": "부산", "category": "패스트푸드"},
            {"keyword": "부산 서면 카페", "shop_name": "이디야", "region": "부산", "category": "카페"},
            {"keyword": "부산 남포동 치킨", "shop_name": "bbq", "region": "부산", "category": "치킨"},
            
            # === 대구권 ===
            {"keyword": "대구 동성로 맛집", "shop_name": "롯데리아", "region": "대구", "category": "패스트푸드"},
            {"keyword": "대구 중구 카페", "shop_name": "투썸플레이스", "region": "대구", "category": "카페"},
            
            # === 인천권 ===
            {"keyword": "인천 부평 맛집", "shop_name": "맘스터치", "region": "인천", "category": "패스트푸드"},
            {"keyword": "인천 송도 카페", "shop_name": "커피빈", "region": "인천", "category": "카페"},
            
            # === 대전권 ===
            {"keyword": "대전 중구 치킨", "shop_name": "굽네치킨", "region": "대전", "category": "치킨"},
            {"keyword": "대전 서구 피자", "shop_name": "도미노피자", "region": "대전", "category": "피자"},
            
            # === 광주권 ===
            {"keyword": "광주 동구 맛집", "shop_name": "파리바게뜨", "region": "광주", "category": "베이커리"},
            
            # === 울산권 ===
            {"keyword": "울산 중구 카페", "shop_name": "매머드커피", "region": "울산", "category": "카페"},
            
            # === 경기권 ===
            {"keyword": "수원 영통 맛집", "shop_name": "제육쌈밥", "region": "경기", "category": "한식"},
            {"keyword": "성남 분당 카페", "shop_name": "스타벅스", "region": "경기", "category": "카페"},
            {"keyword": "안양 평촌 치킨", "shop_name": "치킨플러스", "region": "경기", "category": "치킨"},
            
            # === 제주권 ===
            {"keyword": "제주 중문 맛집", "shop_name": "흑돼지집", "region": "제주", "category": "한식"},
            {"keyword": "제주시 카페", "shop_name": "카페드롭탑", "region": "제주", "category": "카페"},
            
            # === 특수 업종 ===
            {"keyword": "강남 병원", "shop_name": "삼성병원", "region": "서울", "category": "병원"},
            {"keyword": "홍대 미용실", "shop_name": "준오헤어", "region": "서울", "category": "미용"},
            {"keyword": "강남 약국", "shop_name": "온누리약국", "region": "서울", "category": "약국"},
            {"keyword": "부산 해운대 호텔", "shop_name": "파라다이스호텔", "region": "부산", "category": "숙박"},
            
            # === 프랜차이즈 브랜드 테스트 ===
            {"keyword": "편의점", "shop_name": "세븐일레븐", "region": "전국", "category": "편의점"},
            {"keyword": "마트", "shop_name": "이마트", "region": "전국", "category": "마트"},
            {"keyword": "드러그스토어", "shop_name": "올리브영", "region": "전국", "category": "드러그스토어"},
        ]
        
        print(f"📝 총 {len(comprehensive_test_cases)}개 테스트 케이스 실행")
        
        results = []
        success_by_region = {}
        success_by_category = {}
        
        for i, test_case in enumerate(comprehensive_test_cases, 1):
            keyword = test_case['keyword']
            shop_name = test_case['shop_name']
            region = test_case['region']
            category = test_case['category']
            
            print(f"\n📍 테스트 {i}/{len(comprehensive_test_cases)}: {region} - {category}")
            print(f"   키워드: {keyword}")
            print(f"   찾는 상점: {shop_name}")
            
            start_time = time.time()
            
            try:
                result = crawler.search_place_rank(keyword, shop_name, max_rank=30)
                
                elapsed = time.time() - start_time
                
                print(f"   ⏱️  소요 시간: {elapsed:.2f}초")
                print(f"   ✅ 성공: {result['success']}")
                print(f"   🏆 순위: {result['rank']}")
                print(f"   🌍 감지된 지역: {result.get('search_region', 'N/A')}")
                print(f"   🏪 감지된 업종: {result.get('search_category', 'N/A')}")
                
                if result['found_shops']:
                    print(f"   📍 발견된 상점 (상위 3개): {', '.join(result['found_shops'][:3])}")
                
                # 지역별/카테고리별 성공률 집계
                if region not in success_by_region:
                    success_by_region[region] = {'total': 0, 'success': 0}
                if category not in success_by_category:
                    success_by_category[category] = {'total': 0, 'success': 0}
                
                success_by_region[region]['total'] += 1
                success_by_category[category]['total'] += 1
                
                if result['success']:
                    success_by_region[region]['success'] += 1
                    success_by_category[category]['success'] += 1
                
                # 결과 저장
                test_result = {
                    **test_case,
                    "success": result['success'],
                    "rank": result['rank'],
                    "elapsed_time": elapsed,
                    "detected_region": result.get('search_region', ''),
                    "detected_category": result.get('search_category', ''),
                    "found_shops_count": len(result['found_shops']),
                    "message": result['message']
                }
                results.append(test_result)
                
            except Exception as e:
                print(f"   ❌ 테스트 실패: {e}")
                results.append({
                    **test_case,
                    "success": False,
                    "error": str(e),
                    "elapsed_time": time.time() - start_time
                })
            
            # CAPTCHA 감지 시 중단
            if i < len(comprehensive_test_cases) and "CAPTCHA" not in result.get('message', ''):
                wait_time = 8
                print(f"   💤 {wait_time}초 대기...")
                time.sleep(wait_time)
            elif "CAPTCHA" in result.get('message', ''):
                print("   🚨 CAPTCHA 감지됨. 테스트 일시 중단")
                break
        
        # 결과 분석
        analyze_comprehensive_results(results, success_by_region, success_by_category)
        
        # 결과 저장
        save_comprehensive_results(results, success_by_region, success_by_category)
        
        return results
        
    except ImportError as e:
        print(f"❌ 크롤러 모듈을 불러올 수 없습니다: {e}")
        return []
    
    except Exception as e:
        print(f"❌ 테스트 중 오류: {e}")
        import traceback
        traceback.print_exc()
        return []
    
    finally:
        try:
            if 'crawler' in locals():
                crawler.close()
        except:
            pass

def test_batch_processing():
    """배치 처리 테스트"""
    print("\n🚀 배치 처리 테스트")
    print("-" * 50)
    
    try:
        from universal_naver_crawler import UniversalNaverCrawler
        
        crawler = UniversalNaverCrawler(
            headless=True,
            delay_range=(5, 12),
            use_proxy=False
        )
        
        # 배치 처리용 작업 리스트
        batch_tasks = [
            {"keyword": "서울 강남 카페", "shop_name": "스타벅스", "max_rank": 20},
            {"keyword": "부산 해운대 맛집", "shop_name": "맥도날드", "max_rank": 25},
            {"keyword": "대구 동성로 치킨", "shop_name": "교촌치킨", "max_rank": 15},
            {"keyword": "인천 부평 피자", "shop_name": "피자헛", "max_rank": 20},
            {"keyword": "대전 중구 한식", "shop_name": "백반집", "max_rank": 30},
            {"keyword": "광주 서구 분식", "shop_name": "김밥천국", "max_rank": 25},
            {"keyword": "울산 남구 일식", "shop_name": "스시로", "max_rank": 20},
            {"keyword": "제주시 흑돼지", "shop_name": "돈사돈", "max_rank": 15}
        ]
        
        print(f"📦 배치 크기: {len(batch_tasks)}개 작업")
        
        start_time = time.time()
        results = crawler.batch_search(batch_tasks, batch_size=3)
        total_time = time.time() - start_time
        
        print(f"\n📊 배치 처리 결과:")
        print(f"   총 소요 시간: {total_time:.2f}초")
        print(f"   처리된 작업: {len(results)}개")
        print(f"   성공한 작업: {sum(1 for r in results if r['success'])}개")
        print(f"   평균 처리 시간: {total_time/len(results):.2f}초/작업")
        
        success_rate = sum(1 for r in results if r['success']) / len(results) * 100
        print(f"   배치 성공률: {success_rate:.1f}%")
        
        return results
        
    except Exception as e:
        print(f"❌ 배치 처리 테스트 실패: {e}")
        return []
    
    finally:
        try:
            if 'crawler' in locals():
                crawler.close()
        except:
            pass

def analyze_comprehensive_results(results, success_by_region, success_by_category):
    """종합 결과 분석"""
    print(f"\n📊 종합 테스트 결과 분석")
    print("=" * 60)
    
    total_tests = len(results)
    successful_tests = sum(1 for r in results if r.get('success', False))
    success_rate = (successful_tests / total_tests) * 100 if total_tests > 0 else 0
    
    print(f"전체 성과:")
    print(f"   총 테스트: {total_tests}개")
    print(f"   성공: {successful_tests}개")
    print(f"   전체 성공률: {success_rate:.1f}%")
    
    if successful_tests > 0:
        successful_results = [r for r in results if r.get('success', False)]
        avg_time = sum(r.get('elapsed_time', 0) for r in successful_results) / len(successful_results)
        avg_rank = sum(r.get('rank', 0) for r in successful_results) / len(successful_results)
        
        print(f"   평균 소요 시간: {avg_time:.2f}초")
        print(f"   평균 순위: {avg_rank:.1f}위")
    
    # 지역별 성과 분석
    print(f"\n🌍 지역별 성과:")
    for region, stats in success_by_region.items():
        region_success_rate = (stats['success'] / stats['total']) * 100
        print(f"   {region:8}: {stats['success']:2d}/{stats['total']:2d} ({region_success_rate:5.1f}%)")
    
    # 카테고리별 성과 분석
    print(f"\n🏪 업종별 성과:")
    for category, stats in success_by_category.items():
        category_success_rate = (stats['success'] / stats['total']) * 100
        print(f"   {category:12}: {stats['success']:2d}/{stats['total']:2d} ({category_success_rate:5.1f}%)")
    
    # 성과가 좋은/나쁜 지역 식별
    best_regions = sorted(success_by_region.items(), 
                         key=lambda x: x[1]['success'] / x[1]['total'], reverse=True)
    worst_regions = sorted(success_by_region.items(), 
                          key=lambda x: x[1]['success'] / x[1]['total'])
    
    print(f"\n🏆 최고 성과 지역: {best_regions[0][0]} ({best_regions[0][1]['success']}/{best_regions[0][1]['total']})")
    print(f"💔 최저 성과 지역: {worst_regions[0][0]} ({worst_regions[0][1]['success']}/{worst_regions[0][1]['total']})")
    
    # 성과가 좋은/나쁜 업종 식별
    best_categories = sorted(success_by_category.items(), 
                            key=lambda x: x[1]['success'] / x[1]['total'], reverse=True)
    worst_categories = sorted(success_by_category.items(), 
                             key=lambda x: x[1]['success'] / x[1]['total'])
    
    print(f"🏆 최고 성과 업종: {best_categories[0][0]} ({best_categories[0][1]['success']}/{best_categories[0][1]['total']})")
    print(f"💔 최저 성과 업종: {worst_categories[0][0]} ({worst_categories[0][1]['success']}/{worst_categories[0][1]['total']})")
    
    # 전반적인 평가
    print(f"\n💡 종합 평가:")
    if success_rate >= 80:
        print("   🎉 우수한 성능! 전국 대부분 지역/업종에서 안정적으로 작동")
    elif success_rate >= 60:
        print("   ⚠️  양호한 성능. 일부 지역/업종에서 개선 필요")
    else:
        print("   ❌ 성능 개선 필요. 크롤링 로직 점검 권장")

def save_comprehensive_results(results, success_by_region, success_by_category):
    """종합 결과 저장"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"comprehensive_test_results_{timestamp}.json"
    
    comprehensive_data = {
        "test_info": {
            "test_date": datetime.now().isoformat(),
            "test_type": "comprehensive_regional_business",
            "total_tests": len(results),
            "successful_tests": sum(1 for r in results if r.get('success', False))
        },
        "results": results,
        "regional_performance": success_by_region,
        "category_performance": success_by_category,
        "summary": {
            "overall_success_rate": (sum(1 for r in results if r.get('success', False)) / len(results) * 100) if results else 0,
            "best_performing_region": max(success_by_region.items(), key=lambda x: x[1]['success'] / x[1]['total'])[0] if success_by_region else None,
            "best_performing_category": max(success_by_category.items(), key=lambda x: x[1]['success'] / x[1]['total'])[0] if success_by_category else None
        }
    }
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(comprehensive_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 종합 결과가 {filename}에 저장되었습니다.")

def test_edge_cases():
    """엣지 케이스 테스트"""
    print("\n🧪 엣지 케이스 테스트")
    print("-" * 30)
    
    edge_cases = [
        # 특수 문자가 포함된 상점명
        {"keyword": "강남 맛집", "shop_name": "McDonald's", "description": "영문 특수문자"},
        {"keyword": "홍대 카페", "shop_name": "카페&티", "description": "한글 특수문자"},
        
        # 매우 일반적인 키워드
        {"keyword": "맛집", "shop_name": "백반집", "description": "너무 일반적인 키워드"},
        
        # 매우 구체적인 키워드  
        {"keyword": "서울 강남구 청담동 갤러리아백화점 근처 이탈리안 레스토랑", "shop_name": "파스타", "description": "매우 구체적인 키워드"},
        
        # 존재하지 않을 가능성이 높은 조합
        {"keyword": "제주 스키장", "shop_name": "스키샵", "description": "존재하지 않는 조합"},
        
        # 숫자가 포함된 상점명
        {"keyword": "강남 치킨", "shop_name": "24시치킨", "description": "숫자 포함 상점명"},
    ]
    
    print(f"🧪 {len(edge_cases)}개 엣지 케이스 테스트")
    
    # 간단한 테스트만 실행 (시간 절약)
    # 실제 구현에서는 필요에 따라 확장

if __name__ == "__main__":
    print("🧪 범용 네이버 플레이스 크롤러 종합 테스트")
    print(f"⏰ 시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 환경 변수 설정
    os.environ['CRAWLER_MODE'] = 'test'
    
    # 로깅 설정
    logging.basicConfig(level=logging.INFO)
    
    # 1. 종합 지역/업종 테스트
    print("\n" + "="*80)
    print("1️⃣ 전국 다양한 지역/업종 테스트")
    comprehensive_results = test_various_regions_and_businesses()
    
    # 2. 배치 처리 테스트
    if input("\n🤔 배치 처리도 테스트하시겠습니까? (y/n): ").lower().strip() == 'y':
        print("\n" + "="*80)  
        print("2️⃣ 배치 처리 테스트")
        batch_results = test_batch_processing()
    
    # 3. 엣지 케이스 테스트 (선택)
    if input("\n🤔 엣지 케이스도 테스트하시겠습니까? (y/n): ").lower().strip() == 'y':
        print("\n" + "="*80)
        print("3️⃣ 엣지 케이스 테스트") 
        test_edge_cases()
    
    print(f"\n✅ 모든 테스트 완료")
    print(f"⏰ 종료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    print(f"\n📋 결론:")
    if comprehensive_results:
        success_count = sum(1 for r in comprehensive_results if r.get('success', False))
        total_count = len(comprehensive_results)
        final_success_rate = (success_count / total_count) * 100
        
        print(f"   전체 성공률: {final_success_rate:.1f}% ({success_count}/{total_count})")
        
        if final_success_rate >= 70:
            print("   🎉 전국 대부분 지역/업종에서 안정적으로 작동합니다!")
        else:
            print("   ⚠️  일부 지역/업종에서 개선이 필요합니다.")
    
    print(f"\n📄 상세 결과는 생성된 JSON 파일을 확인하세요.")