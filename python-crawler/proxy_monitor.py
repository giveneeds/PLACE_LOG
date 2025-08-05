import os
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from supabase import create_client, Client

@dataclass
class ProxyUsageRecord:
    """프록시 사용 기록"""
    proxy_endpoint: str
    request_url: str
    status_code: Optional[int]
    response_time: float
    success: bool
    error_message: Optional[str]
    timestamp: str
    session_id: Optional[str] = None
    country: str = "KR"

class ProxyMonitor:
    """Bright Data 프록시 사용 모니터링 및 로깅"""
    
    def __init__(self, log_to_file: bool = True, log_to_supabase: bool = True):
        self.logger = logging.getLogger("ProxyMonitor")
        self.log_to_file = log_to_file
        self.log_to_supabase = log_to_supabase
        
        # 로깅 설정
        if self.log_to_file:
            self._setup_file_logging()
        
        # Supabase 설정
        if self.log_to_supabase:
            url = os.getenv('SUPABASE_URL')
            key = os.getenv('SUPABASE_SERVICE_KEY')
            if url and key:
                self.supabase: Client = create_client(url, key)
            else:
                self.supabase = None
                self.log_to_supabase = False
                self.logger.warning("Supabase credentials not found, disabling database logging")
        
        # 메모리에 임시 저장할 사용 기록
        self.usage_records: List[ProxyUsageRecord] = []
        self.max_memory_records = 1000  # 메모리에 최대 1000개 기록 유지
        
    def _setup_file_logging(self):
        """파일 로깅 설정"""
        log_dir = "logs"
        os.makedirs(log_dir, exist_ok=True)
        
        # 날짜별 로그 파일
        today = datetime.now().strftime("%Y%m%d")
        log_file = os.path.join(log_dir, f"proxy_usage_{today}.log")
        
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setLevel(logging.INFO)
        
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(formatter)
        
        self.logger.addHandler(file_handler)
        self.logger.setLevel(logging.INFO)
    
    def record_request(
        self, 
        proxy_endpoint: str, 
        request_url: str, 
        status_code: Optional[int], 
        response_time: float, 
        success: bool, 
        error_message: Optional[str] = None,
        session_id: Optional[str] = None,
        country: str = "KR"
    ):
        """프록시 요청 기록"""
        
        # 사용 기록 생성
        record = ProxyUsageRecord(
            proxy_endpoint=proxy_endpoint,
            request_url=request_url,
            status_code=status_code,
            response_time=response_time,
            success=success,
            error_message=error_message,
            timestamp=datetime.now().isoformat(),
            session_id=session_id,
            country=country
        )
        
        # 메모리에 저장
        self.usage_records.append(record)
        
        # 메모리 사용량 제한
        if len(self.usage_records) > self.max_memory_records:
            self.usage_records = self.usage_records[-self.max_memory_records:]
        
        # 로깅
        log_message = (
            f"Proxy: {proxy_endpoint} | "
            f"URL: {request_url[:50]}... | "
            f"Status: {status_code} | "
            f"Time: {response_time:.2f}s | "
            f"Success: {success}"
        )
        
        if success:
            self.logger.info(log_message)
        else:
            self.logger.error(f"{log_message} | Error: {error_message}")
        
        # Supabase에 저장
        if self.log_to_supabase:
            self._save_to_supabase(record)
    
    def _save_to_supabase(self, record: ProxyUsageRecord):
        """Supabase에 프록시 사용 기록 저장"""
        if not self.supabase:
            return
        
        try:
            data = {
                'proxy_endpoint': record.proxy_endpoint,
                'request_url': record.request_url,
                'status_code': record.status_code,
                'response_time': record.response_time,
                'success': record.success,
                'error_message': record.error_message,
                'session_id': record.session_id,
                'country': record.country,
                'created_at': record.timestamp
            }
            
            # proxy_usage_logs 테이블에 저장 (테이블이 없으면 수동으로 생성 필요)
            self.supabase.table('proxy_usage_logs').insert(data).execute()
            
        except Exception as e:
            self.logger.error(f"Failed to save proxy usage to Supabase: {e}")
    
    def get_usage_stats(self, hours: int = 24) -> Dict:
        """지정된 시간 내의 프록시 사용 통계"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        # 시간 필터링
        recent_records = [
            record for record in self.usage_records
            if datetime.fromisoformat(record.timestamp) > cutoff_time
        ]
        
        if not recent_records:
            return {
                'total_requests': 0,
                'successful_requests': 0,
                'failed_requests': 0,
                'success_rate': 0.0,
                'average_response_time': 0.0,
                'proxy_stats': {},
                'error_summary': {}
            }
        
        # 기본 통계
        total_requests = len(recent_records)
        successful_requests = sum(1 for r in recent_records if r.success)
        failed_requests = total_requests - successful_requests
        success_rate = (successful_requests / total_requests) * 100 if total_requests > 0 else 0
        
        # 응답 시간 통계
        response_times = [r.response_time for r in recent_records if r.response_time > 0]
        average_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        # 프록시별 통계
        proxy_stats = {}
        for record in recent_records:
            endpoint = record.proxy_endpoint
            if endpoint not in proxy_stats:
                proxy_stats[endpoint] = {
                    'total': 0,
                    'success': 0,
                    'failed': 0,
                    'avg_response_time': 0.0
                }
            
            proxy_stats[endpoint]['total'] += 1
            if record.success:
                proxy_stats[endpoint]['success'] += 1
            else:
                proxy_stats[endpoint]['failed'] += 1
        
        # 각 프록시의 응답 시간 계산
        for endpoint in proxy_stats:
            endpoint_records = [r for r in recent_records if r.proxy_endpoint == endpoint]
            response_times = [r.response_time for r in endpoint_records if r.response_time > 0]
            proxy_stats[endpoint]['avg_response_time'] = (
                sum(response_times) / len(response_times) if response_times else 0
            )
            proxy_stats[endpoint]['success_rate'] = (
                (proxy_stats[endpoint]['success'] / proxy_stats[endpoint]['total']) * 100
                if proxy_stats[endpoint]['total'] > 0 else 0
            )
        
        # 에러 요약
        error_summary = {}
        failed_records = [r for r in recent_records if not r.success and r.error_message]
        for record in failed_records:
            error_type = record.error_message[:100] if record.error_message else "Unknown error"
            error_summary[error_type] = error_summary.get(error_type, 0) + 1
        
        return {
            'period_hours': hours,
            'total_requests': total_requests,
            'successful_requests': successful_requests,
            'failed_requests': failed_requests,
            'success_rate': round(success_rate, 2),
            'average_response_time': round(average_response_time, 2),
            'proxy_stats': proxy_stats,
            'error_summary': error_summary
        }
    
    def export_usage_report(self, hours: int = 24, format: str = 'json') -> str:
        """사용 통계 리포트 내보내기"""
        stats = self.get_usage_stats(hours)
        
        if format.lower() == 'json':
            return json.dumps(stats, ensure_ascii=False, indent=2)
        
        elif format.lower() == 'text':
            report = f"""
🔍 Bright Data 프록시 사용 리포트 (최근 {hours}시간)
{'='*60}

📊 전체 통계:
- 총 요청 수: {stats['total_requests']}
- 성공한 요청: {stats['successful_requests']}
- 실패한 요청: {stats['failed_requests']}
- 성공률: {stats['success_rate']}%
- 평균 응답 시간: {stats['average_response_time']}초

🌐 프록시별 상세 통계:
"""
            for endpoint, data in stats['proxy_stats'].items():
                report += f"""
- {endpoint}:
  * 총 요청: {data['total']}
  * 성공: {data['success']}
  * 실패: {data['failed']}
  * 성공률: {data['success_rate']:.1f}%
  * 평균 응답시간: {data['avg_response_time']:.2f}초
"""
            
            if stats['error_summary']:
                report += f"\n❌ 에러 요약:\n"
                for error, count in stats['error_summary'].items():
                    report += f"- {error}: {count}회\n"
            
            return report
        
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    def cleanup_old_records(self, days: int = 7):
        """오래된 기록 정리"""
        cutoff_time = datetime.now() - timedelta(days=days)
        
        # 메모리에서 정리
        self.usage_records = [
            record for record in self.usage_records
            if datetime.fromisoformat(record.timestamp) > cutoff_time
        ]
        
        self.logger.info(f"Cleaned up records older than {days} days")
    
    def save_daily_summary(self):
        """일일 요약 저장"""
        stats = self.get_usage_stats(24)
        
        # 파일로 저장
        if self.log_to_file:
            today = datetime.now().strftime("%Y%m%d")
            summary_file = f"logs/daily_summary_{today}.json"
            
            with open(summary_file, 'w', encoding='utf-8') as f:
                json.dump(stats, f, ensure_ascii=False, indent=2)
            
            self.logger.info(f"Daily summary saved to {summary_file}")
        
        # Supabase에 저장
        if self.log_to_supabase and self.supabase:
            try:
                summary_data = {
                    'date': datetime.now().strftime("%Y-%m-%d"),
                    'total_requests': stats['total_requests'],
                    'successful_requests': stats['successful_requests'],
                    'failed_requests': stats['failed_requests'],
                    'success_rate': stats['success_rate'],
                    'average_response_time': stats['average_response_time'],
                    'proxy_stats': json.dumps(stats['proxy_stats']),
                    'error_summary': json.dumps(stats['error_summary']),
                    'created_at': datetime.now().isoformat()
                }
                
                # daily_proxy_summaries 테이블에 저장
                self.supabase.table('daily_proxy_summaries').insert(summary_data).execute()
                self.logger.info("Daily summary saved to Supabase")
                
            except Exception as e:
                self.logger.error(f"Failed to save daily summary to Supabase: {e}")

# 글로벌 모니터 인스턴스
_global_monitor: Optional[ProxyMonitor] = None

def get_proxy_monitor() -> ProxyMonitor:
    """글로벌 프록시 모니터 인스턴스 반환"""
    global _global_monitor
    if _global_monitor is None:
        _global_monitor = ProxyMonitor()
    return _global_monitor

def log_proxy_request(
    proxy_endpoint: str,
    request_url: str,
    status_code: Optional[int],
    response_time: float,
    success: bool,
    error_message: Optional[str] = None,
    session_id: Optional[str] = None,
    country: str = "KR"
):
    """편의 함수: 프록시 요청 로깅"""
    monitor = get_proxy_monitor()
    monitor.record_request(
        proxy_endpoint=proxy_endpoint,
        request_url=request_url,
        status_code=status_code,
        response_time=response_time,
        success=success,
        error_message=error_message,
        session_id=session_id,
        country=country
    )

# 사용 예시
if __name__ == "__main__":
    # 모니터 초기화
    monitor = ProxyMonitor()
    
    # 샘플 데이터 기록
    monitor.record_request(
        proxy_endpoint="brd-customer-hl_test-zone-datacenter_proxy1:22225",
        request_url="https://m.place.naver.com/restaurant/list?query=test",
        status_code=200,
        response_time=1.5,
        success=True
    )
    
    # 통계 출력
    stats = monitor.get_usage_stats()
    print(monitor.export_usage_report(format='text'))