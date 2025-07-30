# -*- coding: utf-8 -*-
"""
Comprehensive Universal Naver Crawler Test
- Various regions and business types
- Performance analysis
"""
import os
import sys
import json
import time
from datetime import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_various_regions():
    """Test various regions and business types"""
    print("Comprehensive Universal Naver Crawler Test")
    print("=" * 60)
    
    try:
        from universal_naver_crawler import UniversalNaverCrawler
        
        crawler = UniversalNaverCrawler(
            headless=True,  # Use headless for automated testing
            delay_range=(3, 8),
            use_proxy=False  # Set to True if you have proxies
        )
        
        # Test cases covering major regions and business types
        test_cases = [
            # Seoul area
            {"keyword": "강남 맛집", "shop_name": "스타벅스", "region": "서울", "category": "카페"},
            {"keyword": "홍대 치킨", "shop_name": "교촌치킨", "region": "서울", "category": "치킨"},
            {"keyword": "명동 피자", "shop_name": "피자헛", "region": "서울", "category": "피자"},
            
            # Busan area
            {"keyword": "부산 해운대 맛집", "shop_name": "버거킹", "region": "부산", "category": "패스트푸드"},
            {"keyword": "부산 서면 카페", "shop_name": "이디야", "region": "부산", "category": "카페"},
            
            # Other major cities
            {"keyword": "대구 동성로 맛집", "shop_name": "롯데리아", "region": "대구", "category": "패스트푸드"},
            {"keyword": "인천 부평 카페", "shop_name": "커피빈", "region": "인천", "category": "카페"},
            {"keyword": "대전 중구 치킨", "shop_name": "굽네치킨", "region": "대전", "category": "치킨"},
            
            # National brands
            {"keyword": "편의점", "shop_name": "세븐일레븐", "region": "전국", "category": "편의점"},
            {"keyword": "마트", "shop_name": "이마트", "region": "전국", "category": "마트"},
        ]
        
        print(f"Running {len(test_cases)} test cases...")
        
        results = []
        success_by_region = {}
        success_by_category = {}
        
        for i, test_case in enumerate(test_cases, 1):
            keyword = test_case['keyword']
            shop_name = test_case['shop_name']
            region = test_case['region']
            category = test_case['category']
            
            print(f"\nTest {i}/{len(test_cases)}: {region} - {category}")
            print(f"   Keyword: {keyword}")
            print(f"   Target: {shop_name}")
            
            start_time = time.time()
            
            try:
                result = crawler.search_place_rank(keyword, shop_name, max_rank=20)
                
                elapsed = time.time() - start_time
                
                print(f"   Time: {elapsed:.2f}s")
                
                success = result['success']
                print(f"   Success: {success}")
                print(f"   Rank: {result['rank']}")
                print(f"   Region detected: {result.get('search_region', 'N/A')}")
                print(f"   Category detected: {result.get('search_category', 'N/A')}")
                print(f"   Message: {result['message']}")
                
                if result['found_shops']:
                    print(f"   Found shops (top 3): {', '.join(result['found_shops'][:3])}")
                
                # Track success by region/category
                if region not in success_by_region:
                    success_by_region[region] = {'total': 0, 'success': 0}
                if category not in success_by_category:
                    success_by_category[category] = {'total': 0, 'success': 0}
                
                success_by_region[region]['total'] += 1
                success_by_category[category]['total'] += 1
                
                if success:
                    success_by_region[region]['success'] += 1
                    success_by_category[category]['success'] += 1
                
                # Store result
                test_result = {
                    **test_case,
                    "success": success,
                    "rank": result['rank'],
                    "elapsed_time": elapsed,
                    "detected_region": result.get('search_region', ''),
                    "detected_category": result.get('search_category', ''),
                    "found_shops_count": len(result['found_shops']),
                    "message": result['message']
                }
                results.append(test_result)
                
            except Exception as e:
                print(f"   ERROR: {e}")
                results.append({
                    **test_case,
                    "success": False,
                    "error": str(e),
                    "elapsed_time": time.time() - start_time
                })
            
            # Check for CAPTCHA
            if result.get('message', '').find('CAPTCHA') != -1:
                print("   CAPTCHA detected! Pausing test...")
                break
            
            # Wait between tests
            if i < len(test_cases):
                wait_time = 8
                print(f"   Waiting {wait_time}s...")
                time.sleep(wait_time)
        
        # Analyze results
        analyze_results(results, success_by_region, success_by_category)
        
        # Save results
        save_results(results, success_by_region, success_by_category)
        
        return results
        
    except ImportError as e:
        print(f"ERROR: Cannot import crawler module: {e}")
        return []
    
    except Exception as e:
        print(f"ERROR: Test failed: {e}")
        import traceback
        traceback.print_exc()
        return []
    
    finally:
        try:
            if 'crawler' in locals():
                crawler.close()
        except:
            pass

def analyze_results(results, success_by_region, success_by_category):
    """Analyze test results"""
    print(f"\nTest Results Analysis")
    print("=" * 40)
    
    total_tests = len(results)
    successful_tests = sum(1 for r in results if r.get('success', False))
    success_rate = (successful_tests / total_tests) * 100 if total_tests > 0 else 0
    
    print(f"Total tests: {total_tests}")
    print(f"Successful: {successful_tests}")
    print(f"Success rate: {success_rate:.1f}%")
    
    if successful_tests > 0:
        successful_results = [r for r in results if r.get('success', False)]
        avg_time = sum(r.get('elapsed_time', 0) for r in successful_results) / len(successful_results)
        avg_rank = sum(r.get('rank', 0) for r in successful_results) / len(successful_results)
        
        print(f"Average time: {avg_time:.2f}s")
        print(f"Average rank: {avg_rank:.1f}")
    
    # Regional performance
    print(f"\nRegional Performance:")
    for region, stats in success_by_region.items():
        region_success_rate = (stats['success'] / stats['total']) * 100
        print(f"   {region:8}: {stats['success']:2d}/{stats['total']:2d} ({region_success_rate:5.1f}%)")
    
    # Category performance
    print(f"\nCategory Performance:")
    for category, stats in success_by_category.items():
        category_success_rate = (stats['success'] / stats['total']) * 100
        print(f"   {category:12}: {stats['success']:2d}/{stats['total']:2d} ({category_success_rate:5.1f}%)")
    
    # Overall assessment
    print(f"\nOverall Assessment:")
    if success_rate >= 80:
        print("   EXCELLENT: Crawler works well across most regions/categories")
    elif success_rate >= 60:
        print("   GOOD: Crawler works reasonably well, some improvements needed")
    else:
        print("   POOR: Crawler needs significant improvements")

def save_results(results, success_by_region, success_by_category):
    """Save test results to JSON file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"comprehensive_test_results_{timestamp}.json"
    
    data = {
        "test_info": {
            "test_date": datetime.now().isoformat(),
            "test_type": "comprehensive_universal_crawler",
            "total_tests": len(results),
            "successful_tests": sum(1 for r in results if r.get('success', False))
        },
        "results": results,
        "regional_performance": success_by_region,
        "category_performance": success_by_category,
        "summary": {
            "overall_success_rate": (sum(1 for r in results if r.get('success', False)) / len(results) * 100) if results else 0
        }
    }
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\nResults saved to {filename}")

if __name__ == "__main__":
    print("Universal Naver Crawler Comprehensive Test")
    print(f"Start time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Set environment
    os.environ['CRAWLER_MODE'] = 'test'
    
    # Run comprehensive test
    results = test_various_regions()
    
    print(f"\nTest completed")
    print(f"End time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if results:
        success_count = sum(1 for r in results if r.get('success', False))
        total_count = len(results)
        final_success_rate = (success_count / total_count) * 100
        
        print(f"\nFinal Results:")
        print(f"   Success rate: {final_success_rate:.1f}% ({success_count}/{total_count})")
        
        if final_success_rate >= 70:
            print("   CONCLUSION: Crawler works reliably across most regions/categories!")
        else:
            print("   CONCLUSION: Some regions/categories need improvement.")
    
    print(f"\nCheck the generated JSON file for detailed results.")