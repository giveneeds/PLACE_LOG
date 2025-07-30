# -*- coding: utf-8 -*-
"""
Simple JSON parsing test
"""
import json
import re

def test_simple_parsing():
    print("Simple JSON parsing test")
    print("=" * 30)
    
    try:
        # Read HTML file
        with open('naver_analysis_1.html', 'r', encoding='utf-8') as f:
            page_source = f.read()
        
        print(f"HTML file size: {len(page_source)} characters")
        
        # Find Apollo State
        apollo_pattern = r'naver\.search\.ext\.nmb\.salt\.__APOLLO_STATE__\s*=\s*({.*?});'
        match = re.search(apollo_pattern, page_source, re.DOTALL)
        
        if match:
            print("FOUND: Apollo State pattern")
            json_str = match.group(1)
            print(f"JSON length: {len(json_str)} characters")
            
            # Parse JSON
            apollo_data = json.loads(json_str)
            print(f"JSON keys: {len(apollo_data)}")
            
            # Find restaurants
            restaurant_keys = [key for key in apollo_data.keys() if key.startswith('RestaurantListSummary:')]
            print(f"Restaurant objects: {len(restaurant_keys)}")
            
            # List restaurants
            restaurants = []
            for key in restaurant_keys:
                value = apollo_data[key]
                name = value.get('name', 'NO_NAME')
                category = value.get('category', 'NO_CATEGORY')
                restaurants.append({'name': name, 'category': category})
            
            print("\nRestaurants found:")
            for i, restaurant in enumerate(restaurants, 1):
                print(f"{i}. {restaurant['name']} ({restaurant['category']})")
            
            # Test Starbucks search
            target = "스타벅스"
            found_starbucks = False
            
            for i, restaurant in enumerate(restaurants, 1):
                if target in restaurant['name'] or 'starbucks' in restaurant['name'].lower():
                    print(f"\nSTARBUCKS FOUND at rank {i}: {restaurant['name']}")
                    found_starbucks = True
                    break
            
            if not found_starbucks:
                print(f"\nSTARBUCKS NOT FOUND in restaurant names")
                # Show all names for debugging
                print("All restaurant names:")
                for restaurant in restaurants:
                    print(f"  - {restaurant['name']}")
            
            return True
            
        else:
            print("NOT FOUND: Apollo State pattern")
            return False
            
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    success = test_simple_parsing()
    
    if success:
        print("\nSUCCESS: JSON parsing works!")
    else:
        print("\nFAILED: JSON parsing failed")