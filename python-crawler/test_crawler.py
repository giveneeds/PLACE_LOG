#!/usr/bin/env python3
"""
Test script for Naver Place Crawler
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from crawler import NaverPlaceCrawler

def test_supabase_connection():
    """Test Supabase connection"""
    print("=== Testing Supabase Connection ===")
    
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_KEY')
    
    print(f"Supabase URL: {url}")
    print(f"Service Key: {'✓ Set' if key else '✗ Missing'}")
    
    crawler = NaverPlaceCrawler()
    if crawler.supabase:
        print("✓ Supabase client initialized successfully")
        return True
    else:
        print("✗ Supabase client initialization failed")
        return False

def test_search_functionality():
    """Test search functionality"""
    print("\n=== Testing Search Functionality ===")
    
    crawler = NaverPlaceCrawler()
    keyword = "강남 맛집"
    
    print(f"Testing search for: {keyword}")
    results = crawler.search_places(keyword, max_results=5)
    
    if results:
        print(f"✓ Found {len(results)} results")
        print("Sample result:")
        print(f"  - Name: {results[0]['place_name']}")
        print(f"  - Rank: {results[0]['rank']}")
        print(f"  - Rating: {results[0]['rating']}")
        print(f"  - Reviews: {results[0]['review_count']}")
        return True
    else:
        print("✗ No results found")
        return False

def test_tracked_places():
    """Test fetching tracked places from database"""
    print("\n=== Testing Tracked Places ===")
    
    crawler = NaverPlaceCrawler()
    if not crawler.supabase:
        print("✗ Supabase not available")
        return False
    
    try:
        response = crawler.supabase.table('tracked_places').select('*').eq('is_active', True).execute()
        tracked_places = response.data
        
        print(f"✓ Found {len(tracked_places)} active tracked places")
        for place in tracked_places[:3]:  # Show first 3
            print(f"  - {place['place_name']} (keyword: {place['search_keyword']})")
        
        return len(tracked_places) > 0
    except Exception as e:
        print(f"✗ Error fetching tracked places: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🔧 Naver Place Crawler Test Suite")
    print("=" * 50)
    
    # Test 1: Supabase connection
    supabase_ok = test_supabase_connection()
    
    # Test 2: Search functionality
    search_ok = test_search_functionality()
    
    # Test 3: Tracked places
    tracked_ok = test_tracked_places()
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 Test Summary:")
    print(f"  Supabase Connection: {'✓' if supabase_ok else '✗'}")
    print(f"  Search Functionality: {'✓' if search_ok else '✗'}")
    print(f"  Tracked Places: {'✓' if tracked_ok else '✗'}")
    
    if supabase_ok and search_ok:
        print("\n🎉 Core functionality is working!")
        if not tracked_ok:
            print("ℹ️  No tracked places found - add some via admin panel")
    else:
        print("\n❌ Some tests failed - check configuration")
    
    return supabase_ok and search_ok

if __name__ == "__main__":
    main()