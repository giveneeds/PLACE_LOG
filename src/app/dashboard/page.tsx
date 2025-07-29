'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth-provider'
import { useToast } from '@/hooks/use-toast'

interface TrackedPlace {
  id: string
  place_name: string
  place_url: string
  search_keyword: string
  is_active: boolean
  created_at: string
  latest_rank?: number
  previous_rank?: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [trackedPlaces, setTrackedPlaces] = useState<TrackedPlace[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchTrackedPlaces()
    }
  }, [user])

  const fetchTrackedPlaces = async () => {
    try {
      const { data, error } = await supabase
        .from('tracked_places')
        .select(`
          *,
          rankings (
            rank,
            checked_at
          )
        `)
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // 각 플레이스의 최신 순위와 이전 순위 계산
      const placesWithRanks = data?.map(place => {
        const rankings = place.rankings || []
        const sortedRankings = rankings.sort((a, b) => 
          new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime()
        )
        
        return {
          ...place,
          latest_rank: sortedRankings[0]?.rank || null,
          previous_rank: sortedRankings[1]?.rank || null,
        }
      }) || []

      setTrackedPlaces(placesWithRanks)
    } catch (error: any) {
      toast({
        title: '데이터 로드 실패',
        description: error.message || '데이터를 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

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

  const groupByKeyword = (places: TrackedPlace[]) => {
    const grouped = places.reduce((acc, place) => {
      const keyword = place.search_keyword
      if (!acc[keyword]) {
        acc[keyword] = []
      }
      acc[keyword].push(place)
      return acc
    }, {} as Record<string, TrackedPlace[]>)

    return Object.entries(grouped)
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

  const keywordGroups = groupByKeyword(trackedPlaces)

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">대시보드</h1>
          <p className="text-gray-600 mt-1">등록된 플레이스들의 순위 변화를 확인하세요</p>
        </div>
        <Link href="/dashboard/add-place">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            플레이스 추가
          </Button>
        </Link>
      </div>

      {keywordGroups.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">아직 등록된 플레이스가 없습니다.</p>
              <Link href="/dashboard/add-place">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  첫 번째 플레이스 추가하기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {keywordGroups.map(([keyword, places]) => (
            <Card key={keyword}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>"{keyword}" 검색 결과</span>
                  <Badge variant="secondary">{places.length}개 플레이스</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {places.map(place => {
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
                        </div>
                        <div className="flex items-center gap-4">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}