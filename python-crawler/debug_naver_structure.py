# -*- coding: utf-8 -*-
"""
Debug Naver Mobile Place Search Structure (2025)
- Analyze current Naver mobile page structure
- Find correct URLs and selectors
- Test different approaches
"""
import requests
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import urllib.parse

def analyze_naver_structure():
    """Analyze current Naver mobile place search structure"""
    print("=== Naver Mobile Structure Analysis (2025) ===")
    
    keyword = "강남 맛집"
    target_shop = "스타벅스"
    
    # Test different URL patterns
    urls_to_test = [
        f"https://m.search.naver.com/search.naver?where=m&sm=top_sly.hst&fbm=0&acr=1&ie=utf8&query={urllib.parse.quote(keyword)}",
        f"https://m.place.naver.com/search?query={urllib.parse.quote(keyword)}",
        f"https://m.place.naver.com/list?query={urllib.parse.quote(keyword)}",
        f"https://search.naver.com/search.naver?where=place&query={urllib.parse.quote(keyword)}",
    ]
    
    print(f"Testing keyword: {keyword}")
    print(f"Looking for: {target_shop}")
    print()
    
    # Setup Chrome with mobile user agent
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')
    
    driver = webdriver.Chrome(options=options)
    
    try:
        for i, url in enumerate(urls_to_test, 1):
            print(f"--- Test {i}: Testing URL Pattern ---")
            print(f"URL: {url}")
            
            try:
                driver.get(url)
                time.sleep(3)
                
                # Save HTML for analysis
                html_filename = f"naver_analysis_{i}.html"
                with open(html_filename, 'w', encoding='utf-8') as f:
                    f.write(driver.page_source)
                print(f"HTML saved: {html_filename}")
                
                # Check for CAPTCHA
                page_source = driver.page_source.lower()
                if any(word in page_source for word in ['captcha', '보안문자', '자동입력', 'verify']):
                    print("❌ CAPTCHA detected immediately")
                    continue
                
                # Check if target shop exists in page
                if target_shop in driver.page_source:
                    print(f"✅ '{target_shop}' found in page")
                else:
                    print(f"❌ '{target_shop}' not found in page")
                
                # Analyze page structure
                analyze_page_elements(driver, i)
                
            except Exception as e:
                print(f"❌ Error testing URL {i}: {e}")
            
            print()
            time.sleep(2)
    
    finally:
        driver.quit()

def analyze_page_elements(driver, test_num):
    """Analyze page elements to find correct selectors"""
    print(f"Page Analysis for Test {test_num}:")
    
    # Test different selectors
    selectors_to_test = [
        ('li[data-nclick*="plc"]', '2025 Main Selector'),
        ('li.place_unit', 'Old Selector'),
        ('li[data-place-id]', 'Alternative 1'),
        ('li[data-nclick]', 'Alternative 2'),
        ('ul.list_place li', 'Alternative 3'),
        ('.place_list li', 'Alternative 4'),
        ('a[href*="place"]', 'Place Links'),
        ('li', 'All li elements'),
    ]
    
    for selector, description in selectors_to_test:
        try:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            text_elements = [el for el in elements if el.text.strip()]
            
            print(f"   {selector:25} ({description:15}): {len(elements):3d} total, {len(text_elements):3d} with text")
            
            # Show sample text if found
            if text_elements and len(text_elements) > 0:
                sample_text = text_elements[0].text.strip()[:50]
                print(f"      Sample: {sample_text}...")
                
        except Exception as e:
            print(f"   {selector:25}: Error - {e}")
    
    # Check for place-related links
    try:
        place_links = driver.find_elements(By.CSS_SELECTOR, 'a[href*="place"]')
        if place_links:
            print(f"   Place links found: {len(place_links)}")
            for i, link in enumerate(place_links[:3]):
                href = link.get_attribute('href')
                text = link.text.strip()[:30]
                print(f"      {i+1}. {text} -> {href}")
    except:
        pass

def test_requests_approach():
    """Test simple requests approach to compare"""
    print("\n=== Testing Requests Approach ===")
    
    keyword = "강남 맛집"
    headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
    }
    
    url = f"https://m.search.naver.com/search.naver?where=m&query={urllib.parse.quote(keyword)}"
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            # Save for comparison
            with open("naver_requests.html", 'w', encoding='utf-8') as f:
                f.write(response.text)
            print("Requests HTML saved: naver_requests.html")
            
            # Check content
            if "스타벅스" in response.text:
                print("✅ Starbucks found via requests")
            else:
                print("❌ Starbucks not found via requests")
        else:
            print(f"❌ Bad status code: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Requests failed: {e}")

if __name__ == "__main__":
    print("Naver Mobile Place Search Debug Tool")
    print("=" * 50)
    
    # Test Selenium approach
    analyze_naver_structure()
    
    # Test requests approach
    test_requests_approach()
    
    print("\n=== Analysis Complete ===")
    print("Check the generated HTML files:")
    print("- naver_analysis_1.html, naver_analysis_2.html, etc.")
    print("- naver_requests.html")
    print("\nOpen these files in a browser to see what the crawler actually sees.")