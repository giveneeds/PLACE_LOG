#!/usr/bin/env python3
"""
크롤러 실패 원인 상세 분석 도구
실제 오류 로그와 현상을 바탕으로 정확한 원인 파악
"""
import os
import sys
import time
import json
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class FailureAnalyzer:
    """크롤러 실패 원인 분석기"""
    
    def __init__(self):
        self.results = {
            "analysis_time": datetime.now().isoformat(),
            "tests": [],
            "issues_found": [],
            "recommendations": []
        }
    
    def analyze_with_detailed_logging(self):
        """상세 로깅과 함께 실패 원인 분석"""
        print("🔬 크롤러 실패 원인 상세 분석")
        print("=" * 80)
        
        # Chrome 설정
        options = Options()
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        # 모바일 User-Agent
        options.add_argument('--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1')
        
        driver = None
        
        try:
            print("🚗 Chrome WebDriver 초기화 중...")
            driver = webdriver.Chrome(options=options)
            driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            print("✅ WebDriver 초기화 성공")
            
            # 테스트 케이스들
            test_cases = [
                {
                    "name": "모바일 네이버 검색",
                    "url": "https://m.search.naver.com/search.naver?where=m&query=서울 상암 맛집",
                    "target": "맥도날드상암DMC점"
                },
                {
                    "name": "모바일 플레이스 리스트", 
                    "url": "https://m.place.naver.com/list?query=서울 상암 맛집",
                    "target": "맥도날드상암DMC점"
                },
                {
                    "name": "데스크톱 검색",
                    "url": "https://search.naver.com/search.naver?where=nexearch&query=서울 상암 맛집",
                    "target": "맥도날드상암DMC점"
                }
            ]
            
            for i, test_case in enumerate(test_cases, 1):
                print(f"\n📝 테스트 {i}: {test_case['name']}")
                print("-" * 50)
                
                test_result = self._analyze_single_page(driver, test_case)
                self.results["tests"].append(test_result)
                
                # 테스트 간 지연
                time.sleep(3)
            
            # 종합 분석
            self._generate_recommendations()
            
        except Exception as e:
            print(f"❌ WebDriver 초기화 실패: {e}")
            self.results["issues_found"].append(f"WebDriver initialization failed: {e}")
            
        finally:
            if driver:
                driver.quit()
                print("🔒 WebDriver 종료")
        
        # 결과 저장
        self._save_results()
    
    def _analyze_single_page(self, driver, test_case):
        """단일 페이지 상세 분석"""
        result = {
            "name": test_case["name"],
            "url": test_case["url"],
            "target": test_case["target"],
            "timestamp": datetime.now().isoformat(),
            "success": False,
            "issues": [],
            "findings": {}
        }
        
        try:
            print(f"🌐 URL 접속: {test_case['url']}")
            
            # 페이지 로드
            start_time = time.time()
            driver.get(test_case["url"])
            load_time = time.time() - start_time
            
            print(f"   ⏱️  페이지 로드 시간: {load_time:.2f}초")
            result["findings"]["load_time"] = load_time
            
            # 기본 대기
            time.sleep(5)
            
            # 현재 URL 확인 (리다이렉트 여부)
            current_url = driver.current_url
            if current_url != test_case["url"]:
                print(f"   🔄 리다이렉트 감지: {current_url}")
                result["findings"]["redirected_url"] = current_url
                
                # CAPTCHA 또는 차단 페이지 감지
                if "captcha" in current_url.lower() or "blocked" in current_url.lower():
                    result["issues"].append("CAPTCHA 또는 차단 페이지로 리다이렉트됨")
                    print("   ❌ CAPTCHA/차단 페이지 감지")
                    return result
            
            # 페이지 소스 기본 분석
            page_source = driver.page_source
            result["findings"]["page_size"] = len(page_source)
            print(f"   📄 페이지 크기: {len(page_source):,} bytes")
            
            # 목표 텍스트 존재 확인
            has_target = test_case["target"] in page_source
            result["findings"]["has_target_text"] = has_target
            print(f"   🎯 목표 텍스트 '{test_case['target']}' 존재: {has_target}")
            
            if has_target:
                target_count = page_source.count(test_case["target"])
                result["findings"]["target_text_count"] = target_count
                print(f"   📊 목표 텍스트 언급 횟수: {target_count}")
            else:
                # 부분 매치 시도
                partial_matches = ["맥도날드", "상암", "DMC"]
                for partial in partial_matches:
                    if partial in page_source:
                        count = page_source.count(partial)
                        print(f"   🔍 부분 매치 '{partial}': {count}번 발견")
                        result["findings"][f"partial_match_{partial}"] = count
            
            # JavaScript 오류 확인
            js_errors = driver.get_log('browser')
            if js_errors:
                print(f"   ⚠️  JavaScript 오류 {len(js_errors)}개 발견")
                result["findings"]["js_errors"] = len(js_errors)
                for error in js_errors[:3]:  # 처음 3개만 출력
                    print(f"      {error['level']}: {error['message'][:100]}")
            
            # 플레이스 관련 요소 분석
            place_analysis = self._analyze_place_elements(driver)
            result["findings"]["place_elements"] = place_analysis
            
            # 스크롤 테스트
            scroll_result = self._test_scroll_loading(driver)
            result["findings"]["scroll_test"] = scroll_result
            
            # 성공 여부 판단
            if has_target and place_analysis["total_place_items"] > 0:
                result["success"] = True
                print("   ✅ 기본 분석 성공")
            else:
                print("   ❌ 기본 분석 실패")
                if not has_target:
                    result["issues"].append("목표 텍스트를 찾을 수 없음")
                if place_analysis["total_place_items"] == 0:
                    result["issues"].append("플레이스 아이템을 찾을 수 없음")
            
        except TimeoutException as e:
            result["issues"].append(f"페이지 로드 타임아웃: {e}")
            print(f"   ⏰ 타임아웃: {e}")
            
        except Exception as e:
            result["issues"].append(f"예상치 못한 오류: {e}")
            print(f"   ❌ 오류: {e}")
        
        return result
    
    def _analyze_place_elements(self, driver):
        """플레이스 관련 요소들 상세 분석"""
        print("   🔍 플레이스 요소 분석:")
        
        analysis = {
            "total_place_items": 0,
            "selectors_tested": {},
            "working_selectors": [],
            "has_place_links": False,
            "has_more_button": False
        }
        
        # 다양한 선택자들 테스트
        selectors_to_test = [
            ("li", "모든 리스트 아이템"),
            ("li[data-place-id]", "플레이스 ID 속성"),
            ("li[data-nclick*='plc']", "네이버 클릭 추적"),
            (".place_list li", "플레이스 리스트"),
            ("ul.list_place li", "리스트 플레이스"),
            (".place_item", "플레이스 아이템"),
            (".search_list_item", "검색 리스트 아이템"),
            ("div[role='listitem']", "ARIA 리스트 아이템"),
            ("a[href*='place']", "플레이스 링크"),
            (".place_name", "플레이스 이름"),
        ]
        
        for selector, description in selectors_to_test:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                text_elements = [el for el in elements if el.text.strip()]
                
                analysis["selectors_tested"][selector] = {
                    "total": len(elements),
                    "with_text": len(text_elements),
                    "description": description
                }
                
                print(f"      {selector:25} ({description:20}): {len(elements):3d}개 (텍스트: {len(text_elements):3d}개)")
                
                if len(text_elements) > 0:
                    analysis["working_selectors"].append(selector)
                    
                    # 가장 많은 아이템을 가진 선택자 기록
                    if len(text_elements) > analysis["total_place_items"]:
                        analysis["total_place_items"] = len(text_elements)
                        analysis["best_selector"] = selector
                
            except Exception as e:
                print(f"      {selector:25}: 오류 - {e}")
                analysis["selectors_tested"][selector] = {"error": str(e)}
        
        # 플레이스 관련 링크 확인
        try:
            place_links = driver.find_elements(By.CSS_SELECTOR, "a[href*='place']")
            analysis["has_place_links"] = len(place_links) > 0
            analysis["place_links_count"] = len(place_links)
            print(f"      플레이스 링크: {len(place_links)}개")
        except:
            pass
        
        # 더보기 버튼 확인
        more_button_selectors = [
            "a:contains('더보기')",
            ".more_btn",
            ".place_more",
            "button[class*='more']"
        ]
        
        for selector in more_button_selectors:
            try:
                if "contains" in selector:
                    elements = driver.find_elements(By.XPATH, "//a[contains(text(), '더보기')]")
                else:
                    elements = driver.find_elements(By.CSS_SELECTOR, selector)
                
                if elements:
                    analysis["has_more_button"] = True
                    print(f"      더보기 버튼 발견: {selector}")
                    break
            except:
                continue
        
        return analysis
    
    def _test_scroll_loading(self, driver):
        """스크롤 로딩 테스트"""
        print("   📜 스크롤 테스트:")
        
        try:
            # 초기 높이
            initial_height = driver.execute_script("return document.body.scrollHeight")
            print(f"      초기 페이지 높이: {initial_height}px")
            
            # 스크롤 다운
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(3)
            
            # 새로운 높이
            new_height = driver.execute_script("return document.body.scrollHeight")
            print(f"      스크롤 후 높이: {new_height}px")
            
            height_increased = new_height > initial_height
            print(f"      동적 로딩: {'✅ 있음' if height_increased else '❌ 없음'}")
            
            return {
                "initial_height": initial_height,
                "new_height": new_height,
                "dynamic_loading": height_increased,
                "height_increase": new_height - initial_height
            }
            
        except Exception as e:
            print(f"      스크롤 테스트 오류: {e}")
            return {"error": str(e)}
    
    def _generate_recommendations(self):
        """분석 결과 기반 추천사항 생성"""
        print(f"\n💡 분석 결과 및 추천사항")
        print("-" * 50)
        
        # 공통 문제점 분석
        total_tests = len(self.results["tests"])
        successful_tests = sum(1 for test in self.results["tests"] if test["success"])
        
        print(f"성공한 테스트: {successful_tests}/{total_tests}")
        
        if successful_tests == 0:
            self.results["recommendations"].extend([
                "🚨 모든 테스트가 실패했습니다. 네이버의 봇 탐지 시스템이 작동하고 있을 가능성이 높습니다.",
                "🔄 다른 User-Agent를 시도해보세요.",
                "⏰ 요청 간격을 더 길게 설정하세요 (10-30초).",
                "🌐 프록시 서버를 사용해보세요.",
                "📱 실제 모바일 기기에서 테스트해보세요."
            ])
        
        # 개별 문제점 분석
        all_issues = []
        for test in self.results["tests"]:
            all_issues.extend(test["issues"])
        
        if "CAPTCHA 또는 차단 페이지로 리다이렉트됨" in all_issues:
            self.results["recommendations"].append("🛡️ 네이버의 봇 차단 시스템이 활성화되었습니다. IP 변경이 필요할 수 있습니다.")
        
        if any("목표 텍스트를 찾을 수 없음" in issue for issue in all_issues):
            self.results["recommendations"].extend([
                "🔍 검색 키워드나 대상 업체를 다시 확인하세요.",
                "📍 해당 업체가 실제로 검색 결과에 있는지 수동으로 확인하세요.",
                "🏪 업체명이 정확한지 확인하세요."
            ])
        
        if any("플레이스 아이템을 찾을 수 없음" in issue for issue in all_issues):
            self.results["recommendations"].extend([
                "🔧 CSS 선택자가 변경되었을 가능성이 높습니다.",
                "👨‍💻 브라우저 개발자 도구로 현재 페이지 구조를 분석하세요.",
                "📄 저장된 HTML 파일을 확인하여 실제 구조를 파악하세요."
            ])
        
        # 추천사항 출력
        for recommendation in self.results["recommendations"]:
            print(f"   {recommendation}")
    
    def _save_results(self):
        """분석 결과 저장"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"failure_analysis_{timestamp}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 분석 결과가 {filename}에 저장되었습니다.")

def quick_diagnosis():
    """빠른 진단"""
    print("⚡ 빠른 진단 시작")
    print("-" * 30)
    
    # 환경 체크
    print("🔍 환경 체크:")
    
    # Chrome 설치 확인
    try:
        options = Options()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        
        driver = webdriver.Chrome(options=options)
        print("   ✅ Chrome WebDriver 정상")
        driver.quit()
    except Exception as e:
        print(f"   ❌ Chrome WebDriver 문제: {e}")
        return
    
    # 네트워크 연결 확인
    try:
        import requests
        response = requests.get("https://www.naver.com", timeout=5)
        print(f"   ✅ 네이버 연결 정상 (상태: {response.status_code})")
    except Exception as e:
        print(f"   ❌ 네이버 연결 문제: {e}")
        return
    
    print("   ✅ 기본 환경 정상 - 상세 분석을 진행합니다.")

if __name__ == "__main__":
    print("🔬 네이버 플레이스 크롤러 실패 원인 분석기")
    print("=" * 80)
    
    # 빠른 진단
    quick_diagnosis()
    
    # 상세 분석
    analyzer = FailureAnalyzer()
    analyzer.analyze_with_detailed_logging()
    
    print(f"\n📋 다음 단계:")
    print("1. 생성된 JSON 파일에서 상세 분석 결과를 확인하세요")
    print("2. 추천사항을 바탕으로 크롤러를 수정하세요") 
    print("3. 필요시 수동으로 네이버 페이지를 확인하세요")