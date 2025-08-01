'use client'

import { useEffect, useState } from 'react'
import { AdminOnly } from '@/components/auth/role-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, Users, Database, CreditCard, Calendar, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface AnalyticsData {
  userGrowth: {
    daily: { date: string; count: number }[]
    weekly: { week: string; count: number }[]
    monthly: { month: string; count: number }[]
  }
  placeGrowth: {
    daily: { date: string; count: number }[]
    weekly: { week: string; count: number }[]
    monthly: { month: string; count: number }[]
  }
  rankingTrends: {
    daily: { date: string; count: number }[]
    averageRank: { date: string; rank: number }[]
  }
  revenueData: {
    daily: { date: string; amount: number }[]
    monthly: { month: string; amount: number }[]
    totalRevenue: number
    totalCredits: number
  }
  topKeywords: { keyword: string; count: number; avgRank: number }[]
  userActivity: {
    activeUsers: number
    newUsers: number
    churnRate: number
    averageSessionTime: string
  }
}

interface SummaryStats {
  totalUsers: number
  userGrowthRate: number
  totalPlaces: number
  placeGrowthRate: number
  totalRankings: number
  rankingGrowthRate: number
  totalRevenue: number
  revenueGrowthRate: number
}

export default function AdminAnalyticsPage() {
  const { toast } = useToast()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const [analyticsResponse, summaryResponse] = await Promise.all([
        fetch(`/api/admin/analytics?range=${timeRange}`),
        fetch('/api/admin/analytics/summary')
      ])

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        setAnalytics(analyticsData.analytics)
      }

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        setSummaryStats(summaryData.stats)
      }
    } catch (error: any) {
      toast({
        title: '분석 데이터 로드 실패',
        description: error.message || '분석 데이터를 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshAnalytics = async () => {
    try {
      setRefreshing(true)
      await fetchAnalytics()
      toast({
        title: '분석 데이터 새로고침 완료',
        description: '최신 분석 데이터가 업데이트되었습니다.',
      })
    } catch (error: any) {
      toast({
        title: '새로고침 실패',
        description: error.message || '데이터를 새로고침하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setRefreshing(false)
    }
  }

  const formatGrowthRate = (rate: number) => {
    const isPositive = rate >= 0
    const icon = isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
    const color = isPositive ? 'text-green-500' : 'text-red-500'
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        {icon}
        <span>{Math.abs(rate).toFixed(1)}%</span>
      </div>
    )
  }

  return (
    <AdminOnly fallback={
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">접근 권한이 없습니다</h2>
              <p className="text-gray-600 mb-4">관리자만 접근할 수 있는 페이지입니다.</p>
              <Link href="/dashboard">
                <Button>대시보드로 돌아가기</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <div className="min-h-screen bg-dark-base">
        <div className="container-content py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  관리자 대시보드
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">통계 및 분석</h1>
                <p className="text-gray-400">사용량 통계 및 비즈니스 분석</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">최근 7일</SelectItem>
                  <SelectItem value="30d">최근 30일</SelectItem>
                  <SelectItem value="90d">최근 90일</SelectItem>
                  <SelectItem value="1y">최근 1년</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={refreshAnalytics} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">로딩 중...</div>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">총 사용자</p>
                        <p className="text-2xl font-bold text-white">
                          {summaryStats?.totalUsers?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-500" />
                      </div>
                    </div>
                    <div className="mt-2">
                      {summaryStats?.userGrowthRate !== undefined && 
                        formatGrowthRate(summaryStats.userGrowthRate)
                      }
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">등록된 플레이스</p>
                        <p className="text-2xl font-bold text-white">
                          {summaryStats?.totalPlaces?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Database className="w-6 h-6 text-green-500" />
                      </div>
                    </div>
                    <div className="mt-2">
                      {summaryStats?.placeGrowthRate !== undefined && 
                        formatGrowthRate(summaryStats.placeGrowthRate)
                      }
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">순위 기록</p>
                        <p className="text-2xl font-bold text-white">
                          {summaryStats?.totalRankings?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-purple-500" />
                      </div>
                    </div>
                    <div className="mt-2">
                      {summaryStats?.rankingGrowthRate !== undefined && 
                        formatGrowthRate(summaryStats.rankingGrowthRate)
                      }
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">총 수익</p>
                        <p className="text-2xl font-bold text-white">
                          ₩{summaryStats?.totalRevenue?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-yellow-500" />
                      </div>
                    </div>
                    <div className="mt-2">
                      {summaryStats?.revenueGrowthRate !== undefined && 
                        formatGrowthRate(summaryStats.revenueGrowthRate)
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts and Analytics */}
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <Card className="border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      사용자 활동
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-800 rounded">
                        <span className="text-gray-300">활성 사용자</span>
                        <span className="text-white font-semibold">
                          {analytics?.userActivity?.activeUsers || 0}명
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800 rounded">
                        <span className="text-gray-300">신규 사용자</span>
                        <span className="text-white font-semibold">
                          {analytics?.userActivity?.newUsers || 0}명
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800 rounded">
                        <span className="text-gray-300">이탈률</span>
                        <span className="text-white font-semibold">
                          {analytics?.userActivity?.churnRate || 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800 rounded">
                        <span className="text-gray-300">평균 세션 시간</span>
                        <span className="text-white font-semibold">
                          {analytics?.userActivity?.averageSessionTime || '0분'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      인기 키워드
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics?.topKeywords?.slice(0, 5).map((keyword, index) => (
                        <div key={keyword.keyword} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs text-primary font-semibold">
                              {index + 1}
                            </div>
                            <span className="text-white">{keyword.keyword}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-semibold">{keyword.count}회</div>
                            <div className="text-xs text-gray-400">평균 {keyword.avgRank}위</div>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center text-gray-400 py-8">
                          키워드 데이터가 없습니다.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Analytics */}
              <Card className="border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    수익 분석
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gray-800 rounded">
                      <p className="text-gray-400 text-sm mb-2">총 크레딧 판매</p>
                      <p className="text-2xl font-bold text-white">
                        {analytics?.revenueData?.totalCredits?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-800 rounded">
                      <p className="text-gray-400 text-sm mb-2">총 수익</p>
                      <p className="text-2xl font-bold text-white">
                        ₩{analytics?.revenueData?.totalRevenue?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-800 rounded">
                      <p className="text-gray-400 text-sm mb-2">평균 거래액</p>
                      <p className="text-2xl font-bold text-white">
                        ₩{analytics?.revenueData?.totalCredits && analytics?.revenueData?.totalRevenue 
                          ? Math.round(analytics.revenueData.totalRevenue / analytics.revenueData.totalCredits).toLocaleString()
                          : '0'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </AdminOnly>
  )
}