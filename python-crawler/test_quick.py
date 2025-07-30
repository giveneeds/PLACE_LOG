# -*- coding: utf-8 -*-
"""
Quick test for Universal Naver Crawler
"""
import sys
import os

def test_import():
    """Test module import"""
    print("Testing module import...")
    
    try:
        from universal_naver_crawler import UniversalNaverCrawler
        print("SUCCESS: universal_naver_crawler imported")
        return True
    except ImportError as e:
        print(f"FAILED: {e}")
        
        # Check selenium
        try:
            import selenium
            print(f"SUCCESS: selenium version {selenium.__version__}")
        except ImportError:
            print("FAILED: selenium not installed")
        
        return False

def test_basic():
    """Test basic functionality"""
    print("\nTesting basic functionality...")
    
    try:
        from universal_naver_crawler import UniversalNaverCrawler
        
        # Initialize crawler
        crawler = UniversalNaverCrawler(
            headless=True,
            delay_range=(2, 5),
            use_proxy=False
        )
        
        print("SUCCESS: Crawler initialized")
        
        # Simple test
        keyword = "강남 맛집"
        shop_name = "스타벅스"
        
        print(f"Testing: {keyword} - {shop_name}")
        
        result = crawler.search_place_rank(keyword, shop_name, max_rank=5)
        
        print(f"Success: {result['success']}")
        print(f"Rank: {result['rank']}")
        print(f"Message: {result['message']}")
        
        # Statistics
        stats = crawler.get_statistics()
        print(f"Success rate: {stats['success_rate']:.1f}%")
        
        crawler.close()
        return True
        
    except Exception as e:
        print(f"FAILED: {e}")
        return False

def main():
    print("Universal Naver Crawler Quick Test")
    print("=" * 50)
    
    # Test import
    if not test_import():
        print("Import failed. Check package installation.")
        return
    
    # Test basic functionality  
    if test_basic():
        print("\nAll tests passed!")
    else:
        print("\nSome tests failed.")

if __name__ == "__main__":
    main()