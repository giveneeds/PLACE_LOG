'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RankTrendChart } from '@/components/charts/rank-trend-chart'
import { ReviewTrendChart } from '@/components/charts/review-trend-chart'
import { ArrowLeft, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/components/auth-provider'
import { useToast } from '@/hooks/use-toast'

interface AnalyticsData {
  placeId: string
  placeName: string
  placeUrl: string
  keyword: string
  data: Array<{
    date: string
    rank: number | null
    reviewCount: number | null
    visitorReviewCount: number | null
    blogReviewCount: number | null
  }>
  statistics: {
    averageRank: number | null
    bestRank: number | null
    worstRank: number | null
    rankChange: number | null
    reviewGrowth: number | null
  }
}

export default function PlaceAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const placeId = params.placeId as string
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!user) return

    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/analytics/overview?placeId=${placeId}&period=${period}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics')
        }

        const { data } = await response.json()
        setAnalytics(data[0] || null)
      } catch (error: any) {
        toast({
          title: '데이터 로드 실패',
          description: error.message || '분석 데이터를 불러오는 중 오류가 발생했습니다.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [user, placeId, period, toast])

  const getRankChangeIcon = (change: number | null) => {
    if (!change) return <Minus className="w-4 h-4 text-gray-500" />
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    return <TrendingDown className="w-4 h-4 text-red-500" />
  }

  const getRankChangeText = (change: number | null) => {
    if (!change) return '변동 없음'
    if (change > 0) return `${change}위 상승`
    return `${Math.abs(change)}위 하락`
  }

  const handleRefreshRank = async () => {
    setRefreshing(true)

    try {
      const response = await fetch('/api/rankings/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ placeId }),
      })

      if (!response.ok) {
        throw new Error('Failed to refresh ranking')
      }

      const result = await response.json()
      
      toast({
        title: '순위 재검색 완료',
        description: result.result?.success 
          ? `현재 순위: ${result.result.rank}위`
          : '순위권 밖',
      })

      // 데이터 새로고침
      const analyticsResponse = await fetch(`/api/analytics/overview?placeId=${placeId}&period=${period}`)
      if (analyticsResponse.ok) {
        const { data } = await analyticsResponse.json()
        setAnalytics(data[0] || null)
      }
    } catch (error: any) {
      toast({
        title: '재검색 실패',
        description: error.message || '순위 재검색 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setRefreshing(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              분석 데이터를 보려면 로그인해주세요.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">로딩 중...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              분석 데이터를 찾을 수 없습니다.
            </p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                대시보드로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{analytics.placeName}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              키워드: "{analytics.keyword}"
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshRank}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? '검색 중...' : '순위 재검색'}
          </Button>
          
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="기간 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">최근 7일</SelectItem>
              <SelectItem value="30d">최근 30일</SelectItem>
              <SelectItem value="90d">최근 90일</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 순위</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.statistics.averageRank ? `${analytics.statistics.averageRank}위` : '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최고/최저 순위</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.statistics.bestRank || '-'} / {analytics.statistics.worstRank || '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">순위 변동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {getRankChangeText(analytics.statistics.rankChange)}
              </span>
              {getRankChangeIcon(analytics.statistics.rankChange)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">리뷰 증가</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{analytics.statistics.reviewGrowth || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RankTrendChart 
          data={analytics.data}
          title="순위 변화 추이"
          description={`"${analytics.keyword}" 검색 시 순위 변화`}
        />
        
        <ReviewTrendChart 
          data={analytics.data}
          title="리뷰 증가 추이"
          description="방문자 리뷰와 블로그 리뷰 증가량"
        />
      </div>

      {/* Place Info */}
      <Card>
        <CardHeader>
          <CardTitle>플레이스 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">URL:</span>
              <a 
                href={analytics.placeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-sm text-primary hover:underline"
              >
                {analytics.placeUrl}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}