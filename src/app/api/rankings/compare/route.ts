import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword')
    const range = searchParams.get('range') || '30d'

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 })
    }

    // 기간 계산
    const getDaysFromRange = (range: string) => {
      switch (range) {
        case '7d': return 7
        case '30d': return 30
        case '90d': return 90
        default: return 30
      }
    }

    const days = getDaysFromRange(range)
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // 해당 키워드로 등록된 모든 플레이스 조회
    const { data: places, error: placesError } = await supabase
      .from('tracked_places')
      .select('*')
      .eq('search_keyword', keyword)
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (placesError) {
      throw placesError
    }

    if (!places || places.length === 0) {
      return NextResponse.json({ 
        keyword,
        places: [],
        chartData: [],
        stats: {}
      })
    }

    // 각 플레이스의 순위 데이터 조회
    const placeRankings = await Promise.all(
      places.map(async (place) => {
        const { data: rankings } = await supabase
          .from('rankings')
          .select('*')
          .eq('place_id', place.id)
          .gte('checked_at', startDate.toISOString())
          .order('checked_at', { ascending: true })

        const validRankings = rankings?.filter(r => r.rank !== null) || []
        
        // 통계 계산
        const stats = {
          currentRank: validRankings.length > 0 
            ? validRankings[validRankings.length - 1].rank 
            : null,
          previousRank: validRankings.length > 1 
            ? validRankings[validRankings.length - 2].rank 
            : null,
          bestRank: validRankings.length > 0 
            ? Math.min(...validRankings.map(r => r.rank)) 
            : null,
          worstRank: validRankings.length > 0 
            ? Math.max(...validRankings.map(r => r.rank)) 
            : null,
          averageRank: validRankings.length > 0
            ? Math.round(validRankings.reduce((sum, r) => sum + r.rank, 0) / validRankings.length)
            : null,
          totalRecords: rankings?.length || 0,
          validRecords: validRankings.length
        }

        return {
          place,
          rankings: rankings || [],
          stats
        }
      })
    )

    // 차트 데이터 포맷팅 (모든 날짜를 통합)
    const allDates = new Set<string>()
    placeRankings.forEach(({ rankings }) => {
      rankings.forEach(r => {
        const date = new Date(r.checked_at).toISOString().split('T')[0]
        allDates.add(date)
      })
    })

    const sortedDates = Array.from(allDates).sort()
    
    const chartData = sortedDates.map(date => {
      const dataPoint: any = { date }
      
      placeRankings.forEach(({ place, rankings }) => {
        const dayRankings = rankings.filter(r => 
          new Date(r.checked_at).toISOString().split('T')[0] === date
        )
        
        if (dayRankings.length > 0) {
          // 해당 날짜의 마지막 순위 사용
          const lastRanking = dayRankings[dayRankings.length - 1]
          dataPoint[place.id] = lastRanking.rank
        }
      })
      
      return dataPoint
    })

    // 플레이스별 통계 정리
    const placeStats = placeRankings.reduce((acc, { place, stats }) => {
      acc[place.id] = {
        ...place,
        ...stats
      }
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      keyword,
      places: places.map(p => ({
        id: p.id,
        place_name: p.place_name,
        place_url: p.place_url
      })),
      chartData,
      stats: placeStats,
      range
    })

  } catch (error: any) {
    console.error('Rankings compare error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}