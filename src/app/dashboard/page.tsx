'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, TrendingUp, TrendingDown, Minus, BarChart, Search, BookOpen, Gift, RefreshCw, BarChart3, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { useToast } from '@/hooks/use-toast'
import { AuthenticatedOnly, AdminOnly } from '@/components/auth/role-guard'
import { useRealtimeUpdates } from '@/hooks/use-realtime'
import { CreditBalance } from '@/components/credits/CreditBalance'
import { CreditRechargeModal } from '@/components/credits/CreditRechargeModal'
import { RankingCompareDialog } from '@/components/dashboard/RankingCompareDialog'
import { BrandingReportDialog } from '@/components/dashboard/BrandingReportDialog'

interface TrackedPlace {
  id: string
  place_name: string
  place_url: string
  search_keyword: string
  is_active: boolean
  created_at: string
  latest_rank?: number
  previous_rank?: number
  keyword_id?: string
  period_start?: string
  period_end?: string
  place_tags?: Array<{
    tags: {
      id: string
      name: string
    }
  }>
}

interface Keyword {
  id: string
  keyword: string
  created_at: string
  tracked_places: TrackedPlace[]
}

interface RecentRecipe {
  id: string
  title: string
  category: string
  purchased_at: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [recentRecipes, setRecentRecipes] = useState<RecentRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const [refreshingPlaces, setRefreshingPlaces] = useState<Set<string>>(new Set())
  const [showCompareDialog, setShowCompareDialog] = useState<string | null>(null)
  const [showReportDialog, setShowReportDialog] = useState<string | null>(null)

  const fetchKeywords = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/keywords')
      if (!response.ok) throw new Error('Failed to fetch keywords')
      
      const { data } = await response.json()
      
      // Process each keyword's tracked places
      const processedKeywords = data?.map((keyword: any) => ({
        ...keyword,
        tracked_places: keyword.tracked_places?.map((place: any) => {
          const rankings = place.rankings || []
          const sortedRankings = rankings.sort((a: any, b: any) => 
            new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime()
          )
          
          return {
            ...place,
            latest_rank: sortedRankings[0]?.rank || null,
            previous_rank: sortedRankings[1]?.rank || null,
          }
        }) || []
      })) || []

      setKeywords(processedKeywords)
    } catch (error: any) {
      toast({
        title: '데이터 로드 실패',
        description: error.message || '데이터를 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }, [toast])

  const fetchRecentRecipes = useCallback(async () => {
    try {
      const response = await fetch('/api/recipes/purchases/recent')
      if (response.ok) {
        const data = await response.json()
        setRecentRecipes(data.purchases || [])
      }
    } catch (error) {
      // 조용히 실패 처리
      console.log('Failed to fetch recent recipes:', error)
    }
  }, [])

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchKeywords(),
        fetchRecentRecipes()
      ]).finally(() => setLoading(false))
    }
  }, [user, fetchKeywords, fetchRecentRecipes])

  // Subscribe to real-time updates
  useRealtimeUpdates('admin-updates', 'keyword-added', (payload) => {
    fetchKeywords() // Refresh data when new keyword is added
  })

  const getRankTrend = (latest: number | null, previous: number | null) => {
    if (!latest || !previous) return null
    
    if (latest < previous) return 'up'
    if (latest > previous) return 'down'
    return 'same'
  }

  const getRankTrendIcon = (trend: string | null) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-success" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-error" />
      case 'same':
        return <Minus className="w-4 h-4 text-gray-500" />
      default:
        return null
    }
  }

  const handleRefreshRank = async (placeId: string) => {
    // 이미 새로고침 중이면 무시
    if (refreshingPlaces.has(placeId)) return

    setRefreshingPlaces(prev => new Set(prev).add(placeId))

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
      await fetchKeywords()
    } catch (error: any) {
      toast({
        title: '재검색 실패',
        description: error.message || '순위 재검색 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setRefreshingPlaces(prev => {
        const newSet = new Set(prev)
        newSet.delete(placeId)
        return newSet
      })
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-base flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-400 mb-4">
              대시보드를 보려면 로그인해주세요.
            </p>
            <Link href="/login">
              <Button>로그인하기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-base flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
      </div>
    )
  }

  return (
    <AuthenticatedOnly fallback={
      <div className="min-h-screen bg-dark-base flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-400 mb-4">
              대시보드를 보려면 로그인해주세요.
            </p>
            <Link href="/login">
              <Button>로그인하기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    }>
      <div className="min-h-screen bg-dark-base">
        {/* Top Navigation */}
        <div className="border-b border-gray-800 bg-dark-elevated">
          <div className="container-content py-4">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-gradient">
                Place Log
              </div>
              
              {/* Credit Balance - 항상 표시 */}
              <CreditBalance 
                onRechargeClick={() => setShowRechargeModal(true)}
                className="flex-shrink-0"
              />
            </div>
          </div>
        </div>

        <div className="container-content py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-display-medium text-white mb-2">
              안녕하세요! 👋
            </h1>
            <p className="text-gray-400 text-lg">
              네이버 플레이스 순위 추적과 마케팅 레시피로 성과를 만들어보세요
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="card-hover border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Search className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">순위 검색</h3>
                    <p className="text-sm text-gray-400">키워드별 플레이스 순위 확인</p>
                  </div>
                </div>
                <Link href="/search" className="mt-4 block">
                  <Button variant="ghost" className="w-full justify-start">
                    지금 검색하기 (무료)
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="card-hover border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">마케팅 레시피</h3>
                    <p className="text-sm text-gray-400">검증된 상위노출 전략</p>
                  </div>
                </div>
                <Link href="/recipes" className="mt-4 block">
                  <Button variant="ghost" className="w-full justify-start">
                    레시피 둘러보기
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="card-hover border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-info/20 rounded-lg flex items-center justify-center">
                    <Gift className="w-6 h-6 text-info" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">결제 관리</h3>
                    <p className="text-sm text-gray-400">크레딧 충전 및 내역 확인</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setShowRechargeModal(true)}
                  >
                    크레딧 충전하기
                  </Button>
                  <Link href="/dashboard/payments" className="block">
                    <Button variant="ghost" className="w-full justify-start">
                      결제 내역 보기
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Recipes Section */}
          {recentRecipes.length > 0 && (
            <Card className="mb-8 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  최근 열람한 레시피
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentRecipes.slice(0, 6).map((recipe) => (
                    <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
                      <div className="p-4 bg-dark-elevated2 rounded-lg hover:bg-dark-surface transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                            {recipe.category}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-white text-sm line-clamp-2 mb-2">
                          {recipe.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {new Date(recipe.purchased_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tracked Places Section */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">순위 추적 현황</h2>
              <p className="text-gray-400 mt-1">등록된 플레이스들의 순위 변화를 확인하세요</p>
            </div>
            <AdminOnly>
              <Link href="/dashboard/add-place">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  플레이스 추가
                </Button>
              </Link>
            </AdminOnly>
          </div>

          {keywords.length === 0 ? (
            <Card className="border-gray-800">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    아직 등록된 플레이스가 없습니다
                  </h3>
                  <p className="text-gray-400 mb-6">
                    플레이스를 등록하면 실시간 순위 추적이 시작됩니다
                  </p>
                  <AdminOnly fallback={
                    <p className="text-sm text-gray-500">관리자가 플레이스를 등록하면 여기에 표시됩니다.</p>
                  }>
                    <Link href="/dashboard/add-place">
                      <Button size="lg">
                        <Plus className="w-4 h-4 mr-2" />
                        첫 번째 플레이스 추가하기
                      </Button>
                    </Link>
                  </AdminOnly>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {keywords.map((keyword) => (
                <Card key={keyword.id} className="border-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-white">
                      <span className="text-primary">"{keyword.keyword}"</span>
                      <span className="text-gray-400">검색 결과</span>
                      <Badge variant="secondary" className="bg-dark-elevated3 text-gray-300">
                        {keyword.tracked_places?.length || 0}개 플레이스
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {keyword.tracked_places?.length ? (
                      <div className="space-y-3">
                        {keyword.tracked_places.map(place => {
                          const trend = getRankTrend(place.latest_rank, place.previous_rank)
                          return (
                            <div
                              key={place.id}
                              className="flex items-center justify-between p-4 bg-dark-elevated2 rounded-lg hover:bg-dark-surface transition-colors border border-gray-800"
                            >
                              <Link href={`/dashboard/place/${place.id}`} className="flex-1">
                                <h3 className="font-medium text-white hover:text-primary transition-colors">{place.place_name}</h3>
                                <p className="text-sm text-gray-500 truncate max-w-md">
                                  {place.place_url}
                                </p>
                                {place.place_tags && place.place_tags.length > 0 && (
                                  <div className="flex gap-1 mt-2">
                                    {place.place_tags.map(({ tags }) => (
                                      <Badge key={tags.id} variant="outline" className="text-xs border-gray-700">
                                        {tags.name}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                {(place.period_start || place.period_end) && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    기간: {place.period_start || '시작일 미정'} ~ {place.period_end || '종료일 미정'}
                                  </p>
                                )}
                              </Link>
                              <div className="flex items-center gap-2">
                                <Link href={`/dashboard/place/${place.id}`}>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-gray-400 hover:text-white"
                                    title="상세 차트 보기"
                                  >
                                    <BarChart className="w-4 h-4" />
                                  </Button>
                                </Link>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-gray-400 hover:text-white"
                                  onClick={() => setShowCompareDialog(keyword.keyword)}
                                  title="순위 비교분석"
                                >
                                  <BarChart3 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-gray-400 hover:text-white"
                                  onClick={() => setShowReportDialog(place.id)}
                                  title="브랜딩 보고서"
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-gray-400 hover:text-white"
                                  onClick={() => handleRefreshRank(place.id)}
                                  disabled={refreshingPlaces.has(place.id)}
                                  title="순위 재검색"
                                >
                                  <RefreshCw className={`w-4 h-4 ${refreshingPlaces.has(place.id) ? 'animate-spin' : ''}`} />
                                </Button>
                                <div className="text-right">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-white">
                                      {place.latest_rank ? `${place.latest_rank}위` : '순위권 밖'}
                                    </span>
                                    {getRankTrendIcon(trend)}
                                  </div>
                                  {place.previous_rank && (
                                    <span className="text-sm text-gray-500">
                                      이전: {place.previous_rank}위
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        이 키워드에 등록된 플레이스가 없습니다.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Credit Recharge Modal */}
        <CreditRechargeModal
          isOpen={showRechargeModal}
          onClose={() => setShowRechargeModal(false)}
          onSuccess={() => {
            toast({
              title: '충전 요청 완료',
              description: '입금 확인 후 크레딧이 자동으로 충전됩니다.',
            })
          }}
        />

        {/* Ranking Compare Dialog */}
        {showCompareDialog && (
          <RankingCompareDialog 
            open={!!showCompareDialog}
            onOpenChange={(open) => !open && setShowCompareDialog(null)}
            keyword={showCompareDialog}
          />
        )}

        {/* Branding Report Dialog */}
        {showReportDialog && (
          <BrandingReportDialog 
            open={!!showReportDialog}
            onOpenChange={(open) => !open && setShowReportDialog(null)}
            placeId={showReportDialog}
          />
        )}
      </div>
    </AuthenticatedOnly>
  )
}