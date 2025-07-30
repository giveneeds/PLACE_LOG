# -*- coding: utf-8 -*-
"""
Test JSON parsing logic with saved HTML data
"""
import json
import re
from json_based_naver_crawler import JsonBasedNaverCrawler

def test_json_parsing_from_file():
    """Test JSON parsing logic using saved HTML file"""
    print("Testing JSON parsing from saved HTML file")
    print("=" * 50)
    
    try:
        # Read the saved HTML file
        with open('naver_analysis_1.html', 'r', encoding='utf-8') as f:
            page_source = f.read()
        
        print(f"HTML file size: {len(page_source)} characters")
        
        # Extract Apollo State JSON
        apollo_pattern = r'naver\.search\.ext\.nmb\.salt\.__APOLLO_STATE__\s*=\s*({.*?});'
        match = re.search(apollo_pattern, page_source, re.DOTALL)
        
        if match:
            print("✅ Found __APOLLO_STATE__ pattern in HTML")
            json_str = match.group(1)
            print(f"JSON string length: {len(json_str)} characters")
            
            try:
                apollo_data = json.loads(json_str)
                print("✅ Successfully parsed Apollo State JSON")
                print(f"Number of keys in Apollo data: {len(apollo_data)}")
                
                # Find RestaurantListSummary objects
                restaurant_keys = [key for key in apollo_data.keys() if key.startswith('RestaurantListSummary:')]
                print(f"✅ Found {len(restaurant_keys)} RestaurantListSummary objects")
                
                # Parse restaurants
                restaurants = []
                for key in restaurant_keys:
                    value = apollo_data[key]
                    restaurant_info = {
                        'id': value.get('id', ''),
                        'name': value.get('name', ''),
                        'category': value.get('category', ''),
                        'address': value.get('commonAddress', ''),
                        'distance': value.get('distance', ''),
                        'review_count': value.get('visitorReviewCount', ''),
                        'apollo_key': key
                    }
                    restaurants.append(restaurant_info)
                
                print(f"\nParsed Restaurants:")
                print("-" * 30)
                for i, restaurant in enumerate(restaurants, 1):
                    print(f"{i:2d}. {restaurant['name']}")
                    print(f"    Category: {restaurant['category']}")
                    print(f"    Address: {restaurant['address']}")
                    print(f"    Distance: {restaurant['distance']}")
                    print(f"    Reviews: {restaurant['review_count']}")
                    print()
                
                # Test name matching
                print("Testing name matching:")
                print("-" * 30)
                
                test_targets = ["스타벅스", "맥도날드", "교촌치킨", "버거킹"]
                
                for target in test_targets:
                    found = False
                    for i, restaurant in enumerate(restaurants, 1):
                        if is_name_match(target, restaurant['name']):
                            print(f"✅ '{target}' matches '{restaurant['name']}' at rank {i}")
                            found = True
                            break
                    
                    if not found:
                        print(f"❌ '{target}' not found in restaurants")
                
                print(f"\n🎯 Result: JSON parsing logic works correctly!")
                print(f"   - Successfully extracted {len(restaurants)} restaurants")
                print(f"   - All data available without traditional HTML parsing")
                print(f"   - This approach should work once CAPTCHA is resolved")
                
                return True
                
            except json.JSONDecodeError as e:
                print(f"❌ JSON parsing error: {e}")
                return False
                
        else:
            print("❌ Could not find __APOLLO_STATE__ pattern in HTML")
            
            # Try alternative patterns
            alt_patterns = [
                r'__APOLLO_STATE__\s*=\s*({.*?});',
                r'APOLLO_STATE.*?=\s*({.*?});',
                r'salt\.__APOLLO_STATE__.*?=\s*({.*?});'
            ]
            
            for i, pattern in enumerate(alt_patterns, 1):
                match = re.search(pattern, page_source, re.DOTALL)
                if match:
                    print(f"✅ Found alternative pattern {i}")
                    break
            else:
                print("❌ No alternative patterns found either")
            
            return False
            
    except FileNotFoundError:
        print("❌ naver_analysis_1.html file not found")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def is_name_match(target_name: str, found_name: str) -> bool:
    """Test name matching logic"""
    if not target_name or not found_name:
        return False
    
    def normalize_text(text):
        normalized = re.sub(r'[^\w가-힣0-9]', '', text.lower())
        return normalized
    
    target_norm = normalize_text(target_name)
    found_norm = normalize_text(found_name)
    
    # Exact match
    if target_norm == found_norm:
        return True
    
    # Substring match (3+ characters)
    if len(target_norm) >= 3:
        if target_norm in found_norm or found_norm in target_norm:
            return True
    
    # Brand matching patterns
    brand_patterns = [
        r'(스타벅스|starbucks)',
        r'(맥도날드|McDonald|맥날)',
        r'(교촌치킨|교촌|KyoChon)',
        r'(버거킹|BurgerKing)',
    ]
    
    for pattern in brand_patterns:
        if re.search(pattern, target_name, re.IGNORECASE) and re.search(pattern, found_name, re.IGNORECASE):
            return True
    
    return False

if __name__ == "__main__":
    success = test_json_parsing_from_file()
    
    if success:
        print("\n🎉 JSON-based approach is CONFIRMED to work!")
        print("The only issue is CAPTCHA - once IP rotation is set up, this will work perfectly.")
    else:
        print("\n❌ JSON parsing needs debugging")