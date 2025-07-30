# -*- coding: utf-8 -*-
"""
IP Test Crawler - Check if IP change resolves CAPTCHA issue
"""
import time
import requests
from json_based_naver_crawler import JsonBasedNaverCrawler

def check_current_ip():
    """Check current IP address"""
    try:
        response = requests.get('https://httpbin.org/ip', timeout=10)
        if response.status_code == 200:
            ip_info = response.json()
            return ip_info.get('origin', 'Unknown')
        else:
            return 'Failed to get IP'
    except Exception as e:
        return f'Error: {e}'

def test_naver_access():
    """Test basic Naver access without full crawling"""
    print("Testing basic Naver access...")
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9',
            'Connection': 'keep-alive',
        }
        
        # Simple test URL
        test_url = "https://m.search.naver.com/search.naver?where=m&query=test"
        
        response = requests.get(test_url, headers=headers, timeout=15)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            page_content = response.text.lower()
            
            # Check for CAPTCHA indicators
            captcha_keywords = ['captcha', '보안문자', '자동입력', 'verify', '인증', 'block', '차단']
            captcha_detected = any(keyword in page_content for keyword in captcha_keywords)
            
            if captcha_detected:
                print("❌ CAPTCHA detected in response")
                return False
            else:
                print("✅ No CAPTCHA detected - IP appears to be clean")
                return True
        else:
            print(f"❌ Bad status code: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

def test_json_crawler_with_current_ip():
    """Test the JSON crawler with current IP"""
    print("\nTesting JSON crawler with current IP...")
    
    crawler = JsonBasedNaverCrawler(
        headless=True,
        delay_range=(5, 10)  # Shorter delay for testing
    )
    
    try:
        # Simple test
        result = crawler.search_place_rank("강남 맛집", "스타벅스", max_rank=10)
        
        print(f"Success: {result['success']}")
        print(f"Rank: {result['rank']}")
        print(f"Message: {result['message']}")
        print(f"Duration: {result['search_duration']}s")
        
        if result['success']:
            print("🎉 SUCCESS: Crawler works with current IP!")
            return True
        elif "CAPTCHA" in result['message']:
            print("❌ CAPTCHA: IP is still blocked")
            return False
        else:
            print(f"❌ OTHER ERROR: {result['message']}")
            return False
            
    except Exception as e:
        print(f"❌ Crawler error: {e}")
        return False
    finally:
        crawler.close()

def main():
    """Main IP test function"""
    print("=" * 60)
    print("IP Test for Naver Crawler")
    print("=" * 60)
    
    # Step 1: Check current IP
    print("1. Checking current IP address...")
    current_ip = check_current_ip()
    print(f"Current IP: {current_ip}")
    
    print("\n" + "-" * 40)
    
    # Step 2: Test basic Naver access
    print("2. Testing basic Naver access...")
    basic_access = test_naver_access()
    
    print("\n" + "-" * 40)
    
    # Step 3: Test JSON crawler if basic access works
    if basic_access:
        print("3. Testing JSON crawler...")
        crawler_success = test_json_crawler_with_current_ip()
        
        if crawler_success:
            print("\n🎉 EXCELLENT: Everything works!")
            print("✅ IP is clean")
            print("✅ Naver access successful")  
            print("✅ JSON crawler operational")
            print("\n📋 Next steps:")
            print("   - Run comprehensive tests")
            print("   - Deploy to production")
        else:
            print("\n⚠️ PARTIAL SUCCESS:")
            print("✅ Basic access works")
            print("❌ Crawler still blocked")
            print("\n📋 Recommendations:")
            print("   - Increase delay times")
            print("   - Use different User-Agents")
            print("   - Consider proxy rotation")
    else:
        print("3. Skipping crawler test (basic access failed)")
        print("\n❌ IP BLOCKED:")
        print("❌ Basic Naver access failed")
        print("❌ CAPTCHA detected")
        print("\n📋 Required actions:")
        print("   🔄 Change IP address (mobile tethering/VPN)")
        print("   ⏰ Wait 24 hours for auto-unblock")
        print("   🔧 Use proxy rotation system")
    
    print("\n" + "=" * 60)
    print("IP Test Complete")
    print("=" * 60)

if __name__ == "__main__":
    main()