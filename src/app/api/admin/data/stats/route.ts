import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 사용자 인증 및 관리자 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // 통계 데이터 수집
    const [
      { count: totalPlaces },
      { count: activePlaces },
      { count: totalRankings },
      { count: recentRankings },
      { data: avgRankingData },
      { count: successfulCrawls },
      { count: totalCrawlAttempts }
    ] = await Promise.all([
      // 전체 플레이스 수
      supabase
        .from('tracked_places')
        .select('id', { count: 'exact', head: true }),
      
      // 활성 플레이스 수
      supabase
        .from('tracked_places')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      
      // 전체 순위 기록 수
      supabase
        .from('rankings')
        .select('id', { count: 'exact', head: true }),
      
      // 최근 7일간 순위 기록 수
      supabase
        .from('rankings')
        .select('id', { count: 'exact', head: true })
        .gte('checked_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      // 평균 순위 계산
      supabase
        .from('rankings')
        .select('rank')
        .not('rank', 'is', null),
      
      // 성공한 크롤링 수 (최근 30일)
      supabase
        .from('rankings')
        .select('id', { count: 'exact', head: true })
        .not('rank', 'is', null)
        .gte('checked_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      
      // 전체 크롤링 시도 수 (최근 30일)
      supabase
        .from('rankings')
        .select('id', { count: 'exact', head: true })
        .gte('checked_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    ])

    // 평균 순위 계산
    const avgRanking = avgRankingData && avgRankingData.length > 0
      ? avgRankingData.reduce((sum, item) => sum + (item.rank || 0), 0) / avgRankingData.length
      : null

    // 크롤링 성공률 계산
    const crawlSuccess = totalCrawlAttempts && totalCrawlAttempts > 0
      ? (successfulCrawls / totalCrawlAttempts) * 100
      : 0

    const stats = {
      totalPlaces: totalPlaces || 0,
      activePlaces: activePlaces || 0,
      totalRankings: totalRankings || 0,
      recentRankings: recentRankings || 0,
      avgRanking: avgRanking,
      crawlSuccess: crawlSuccess
    }

    return NextResponse.json({ stats })

  } catch (error: any) {
    console.error('Admin data stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}