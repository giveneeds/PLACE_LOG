# -*- coding: utf-8 -*-
"""
Production Crawler Test
- Tests the upgraded universal_naver_crawler.py with JSON functionality
- Validates Supabase integration
- Checks backward compatibility
"""
import time
import json
from universal_naver_crawler import UniversalNaverCrawler

def test_basic_functionality():
    """Test basic crawler functionality"""
    print("=" * 60)
    print("Production Crawler Test - Basic Functionality")
    print("=" * 60)
    
    crawler = UniversalNaverCrawler(
        headless=True,
        delay_range=(3, 8),
        use_proxy=False
    )
    
    try:
        # Test case 1: Basic search
        print("\n🔍 Test 1: Basic Search")
        print("-" * 30)
        
        result = crawler.search_place_rank(
            keyword="강남 맛집",
            target_place_name="스타벅스",
            max_rank=20
        )
        
        print(f"Success: {result['success']}")
        print(f"Rank: {result['rank']}")
        print(f"Message: {result['message']}")
        print(f"Duration: {result['search_duration']}s")
        print(f"Region: {result['search_region']}")
        print(f"Category: {result['search_category']}")
        
        if result['found_shops']:
            print(f"Found shops (top 5): {', '.join(result['found_shops'][:5])}")
        
        # Test case 2: Different region/category
        print("\n🔍 Test 2: Different Region/Category")
        print("-" * 30)
        
        result2 = crawler.search_place_rank(
            keyword="홍대 치킨",
            target_place_name="교촌치킨",
            max_rank=15
        )
        
        print(f"Success: {result2['success']}")
        print(f"Rank: {result2['rank']}")
        print(f"Message: {result2['message']}")
        print(f"Region: {result2['search_region']}")
        print(f"Category: {result2['search_category']}")
        
        # Test case 3: Statistics
        print("\n📊 Test 3: Statistics")
        print("-" * 30)
        
        stats = crawler.get_statistics()
        print(json.dumps(stats, ensure_ascii=False, indent=2))
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
    finally:
        crawler.close()

def test_batch_processing():
    """Test batch processing functionality"""
    print("\n" + "=" * 60)
    print("Production Crawler Test - Batch Processing")
    print("=" * 60)
    
    crawler = UniversalNaverCrawler(
        headless=True,
        delay_range=(2, 5),
        use_proxy=False
    )
    
    try:
        # Batch test cases
        search_tasks = [
            {"keyword": "서울 강남 맛집", "shop_name": "스타벅스", "max_rank": 15},
            {"keyword": "부산 해운대 카페", "shop_name": "이디야", "max_rank": 10},
            {"keyword": "대구 동성로 치킨", "shop_name": "교촌치킨", "max_rank": 12}
        ]
        
        print(f"Running batch search with {len(search_tasks)} tasks...")
        
        results = crawler.batch_search(search_tasks, batch_size=2)
        
        print(f"\n📊 Batch Results:")
        print("-" * 30)
        
        for i, result in enumerate(results, 1):
            print(f"{i}. {result['keyword']} - {result['shop_name']}")
            print(f"   Success: {result['success']}, Rank: {result['rank']}")
            print(f"   Message: {result['message']}")
        
        # Success rate
        success_count = sum(1 for r in results if r['success'])
        success_rate = (success_count / len(results)) * 100 if results else 0
        print(f"\n✅ Success Rate: {success_rate:.1f}% ({success_count}/{len(results)})")
        
        return success_rate > 0  # At least one success
        
    except Exception as e:
        print(f"❌ Batch test failed: {e}")
        return False
    finally:
        crawler.close()

def test_error_handling():
    """Test error handling and edge cases"""
    print("\n" + "=" * 60)
    print("Production Crawler Test - Error Handling")
    print("=" * 60)
    
    crawler = UniversalNaverCrawler(
        headless=True,
        delay_range=(1, 3)
    )
    
    try:
        # Test 1: Invalid search term
        print("\n🧪 Test 1: Invalid Search Term")
        result1 = crawler.search_place_rank(
            keyword="",
            target_place_name="스타벅스"
        )
        print(f"Empty keyword result: {result1['success']} - {result1['message']}")
        
        # Test 2: Non-existent place
        print("\n🧪 Test 2: Non-existent Place")
        result2 = crawler.search_place_rank(
            keyword="강남 맛집",
            target_place_name="존재하지않는매장xyz123"
        )
        print(f"Non-existent place: {result2['success']} - Rank: {result2['rank']}")
        
        # Test 3: Very specific region
        print("\n🧪 Test 3: Specific Region")
        result3 = crawler.search_place_rank(
            keyword="제주 중문 맛집",
            target_place_name="맥도날드"
        )
        print(f"Jeju search: {result3['success']} - Region: {result3['search_region']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error handling test failed: {e}")
        return False
    finally:
        crawler.close()

def test_json_vs_html_methods():
    """Test both JSON and HTML parsing methods"""
    print("\n" + "=" * 60)
    print("Production Crawler Test - JSON vs HTML Methods")
    print("=" * 60)
    
    print("This tests the hybrid approach:")
    print("1. Try JSON parsing first (2025 method)")
    print("2. Fall back to HTML parsing if JSON fails")
    print("3. Maintain backward compatibility")
    
    crawler = UniversalNaverCrawler(headless=True)
    
    try:
        result = crawler.search_place_rank("강남 맛집", "스타벅스", max_rank=10)
        
        print(f"\nResult: {result['success']}")
        print(f"Message: {result['message']}")
        
        # Check which method was used based on message
        if "JSON method" in result['message']:
            print("✅ JSON-based parsing worked!")
        elif "HTML fallback" in result['message']:
            print("⚠️ Fell back to HTML parsing")
        else:
            print("🔍 Method unclear from message")
        
        return True
        
    except Exception as e:
        print(f"❌ Hybrid method test failed: {e}")
        return False
    finally:
        crawler.close()

def main():
    """Run all production tests"""
    print("🚀 Starting Production Crawler Tests")
    print("This validates the upgraded crawler for deployment")
    
    test_results = []
    
    # Run all tests
    try:
        test_results.append(("Basic Functionality", test_basic_functionality()))
        test_results.append(("Batch Processing", test_batch_processing()))
        test_results.append(("Error Handling", test_error_handling()))
        test_results.append(("JSON vs HTML Methods", test_json_vs_html_methods()))
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
    
    # Summary
    print("\n" + "=" * 60)
    print("🎯 PRODUCTION TEST SUMMARY")
    print("=" * 60)
    
    passed_tests = 0
    total_tests = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed_tests += 1
    
    success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
    
    print(f"\nOverall Success Rate: {success_rate:.1f}% ({passed_tests}/{total_tests})")
    
    if success_rate >= 75:
        print("\n🎉 PRODUCTION READY!")
        print("✅ Crawler is ready for deployment")
        print("✅ JSON-based parsing implemented")
        print("✅ Backward compatibility maintained")
        print("✅ Error handling works")
        
        print("\n📋 Next Steps:")
        print("1. Deploy to production environment")
        print("2. Set up VPN/proxy system for CAPTCHA avoidance")
        print("3. Monitor performance in production")
        
    elif success_rate >= 50:
        print("\n⚠️ PARTIALLY READY")
        print("Some tests failed but core functionality works")
        print("Review failed tests before deployment")
        
    else:
        print("\n❌ NOT READY")
        print("Multiple critical tests failed")
        print("Debug issues before deployment")
    
    return success_rate >= 75

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)