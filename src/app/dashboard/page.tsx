'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, TrendingUp, TrendingDown, Minus, BarChart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { useToast } from '@/hooks/use-toast'
import { AuthenticatedOnly, AdminOnly } from '@/components/auth/role-guard'
import { useRealtimeUpdates } from '@/hooks/use-realtime'

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

export default function DashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(true)

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
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (user) {
      fetchKeywords()
    }
  }, [user, fetchKeywords])

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
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      case 'same':
        return <Minus className="w-4 h-4 text-gray-500" />
      default:
        return null
    }
  }


  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              대시보드를 보려면 로그인해주세요.
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


  return (
    <AuthenticatedOnly fallback={
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              대시보드를 보려면 로그인해주세요.
            </p>
          </CardContent>
        </Card>
      </div>
    }>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">대시보드</h1>
            <p className="text-gray-600 mt-1">등록된 플레이스들의 순위 변화를 확인하세요</p>
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">아직 등록된 플레이스가 없습니다.</p>
              <AdminOnly fallback={
                <p className="text-sm text-gray-500">관리자가 플레이스를 등록하면 여기에 표시됩니다.</p>
              }>
                <Link href="/dashboard/add-place">
                  <Button>
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
            <Card key={keyword.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>&quot;{keyword.keyword}&quot; 검색 결과</span>
                  <Badge variant="secondary">{keyword.tracked_places?.length || 0}개 플레이스</Badge>
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
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <h3 className="font-medium">{place.place_name}</h3>
                            <p className="text-sm text-gray-500 truncate max-w-md">
                              {place.place_url}
                            </p>
                            {place.place_tags && place.place_tags.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {place.place_tags.map(({ tags }) => (
                                  <Badge key={tags.id} variant="outline" className="text-xs">
                                    {tags.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {(place.period_start || place.period_end) && (
                              <p className="text-xs text-gray-400 mt-1">
                                기간: {place.period_start || '시작일 미정'} ~ {place.period_end || '종료일 미정'}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <Link href={`/dashboard/${place.id}`}>
                              <Button variant="ghost" size="sm">
                                <BarChart className="w-4 h-4 mr-2" />
                                상세 분석
                              </Button>
                            </Link>
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold">
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
                  <p className="text-center text-gray-500 py-4">
                    이 키워드에 등록된 플레이스가 없습니다.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </AuthenticatedOnly>
  )
}