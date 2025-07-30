'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Play, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AdminOnly } from '@/components/auth/role-guard'

export default function CrawlerManagementPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [lastRun, setLastRun] = useState<string | null>(null)
  const { toast } = useToast()

  const handleTriggerCrawler = async () => {
    setIsRunning(true)

    try {
      const response = await fetch('/api/trigger-crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger crawler')
      }

      setLastRun(data.timestamp)
      toast({
        title: '크롤러 실행 시작',
        description: 'GitHub Actions에서 크롤링을 시작했습니다. 결과는 몇 분 후에 확인하세요.',
        duration: 5000,
      })

    } catch (error: any) {
      console.error('Trigger failed:', error)
      toast({
        title: '크롤러 실행 실패',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <AdminOnly>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">크롤러 관리</h1>
          <p className="text-muted-foreground mt-1">
            네이버 플레이스 순위 크롤링을 관리합니다
          </p>
        </div>

        {/* 크롤러 상태 */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">자동 실행</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2회/일</div>
              <p className="text-xs text-muted-foreground">
                오전 11:20, 오후 1:50 (KST)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">크롤러 방식</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Python</div>
              <p className="text-xs text-muted-foreground">
                GitHub Actions + requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">마지막 실행</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {lastRun ? '성공' : '대기중'}
              </div>
              <p className="text-xs text-muted-foreground">
                {lastRun ? new Date(lastRun).toLocaleString('ko-KR') : '아직 실행되지 않음'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 수동 실행 */}
        <Card>
          <CardHeader>
            <CardTitle>수동 크롤링 실행</CardTitle>
            <CardDescription>
              등록된 모든 플레이스의 순위를 즉시 크롤링합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">전체 크롤링</h3>
                <p className="text-sm text-muted-foreground">
                  tracked_places에 등록된 모든 플레이스를 크롤링합니다
                </p>
              </div>
              <Button 
                onClick={handleTriggerCrawler} 
                disabled={isRunning}
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    실행 중...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    지금 실행
                  </>
                )}
              </Button>
            </div>

            {isRunning && (
              <div className="p-4 bg-blue-50 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-sm text-blue-700">
                    GitHub Actions에서 크롤링을 실행 중입니다...
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  완료까지 약 2-5분 소요됩니다. 결과는 대시보드에서 확인하세요.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 크롤링 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>크롤링 설정</CardTitle>
            <CardDescription>
              현재 적용된 크롤링 설정입니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">크롤링 방식</span>
                <Badge variant="secondary">Python + requests</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">실행 환경</span>
                <Badge variant="secondary">GitHub Actions</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">요청 간격</span>
                <Badge variant="secondary">2-5초</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">재시도 횟수</span>
                <Badge variant="secondary">3회</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 주의사항 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              주의사항
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• 네이버 서버에 과도한 부하를 주지 않도록 적절한 간격으로 요청합니다</p>
            <p>• 크롤링 결과는 네이버의 실시간 데이터 변동에 따라 달라질 수 있습니다</p>
            <p>• 웹 구조 변경 시 크롤러 업데이트가 필요할 수 있습니다</p>
            <p>• GitHub Actions 실행 한도를 고려하여 필요할 때만 수동 실행하세요</p>
          </CardContent>
        </Card>
      </div>
    </AdminOnly>
  )
}