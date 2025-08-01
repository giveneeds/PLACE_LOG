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

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'

    // 날짜 범위 계산
    const getDaysFromRange = (range: string) => {
      switch (range) {
        case '7d': return 7
        case '30d': return 30
        case '90d': return 90
        case '1y': return 365
        default: return 7
      }
    }

    const days = getDaysFromRange(range)
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // 사용자 성장 데이터
    const userGrowthData = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', date.toISOString())
        .lt('created_at', new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString())

      userGrowthData.push({ date: dateStr, count: count || 0 })
    }

    // 플레이스 성장 데이터
    const placeGrowthData = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      
      const { count } = await supabase
        .from('tracked_places')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', date.toISOString())
        .lt('created_at', new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString())

      placeGrowthData.push({ date: dateStr, count: count || 0 })
    }

    // 순위 트렌드 데이터
    const rankingTrendsData = []
    const averageRankData = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      
      const { count } = await supabase
        .from('rankings')
        .select('id', { count: 'exact', head: true })
        .gte('checked_at', date.toISOString())
        .lt('checked_at', new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString())

      const { data: avgRankData } = await supabase
        .from('rankings')
        .select('rank')
        .not('rank', 'is', null)
        .gte('checked_at', date.toISOString())
        .lt('checked_at', new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString())

      const avgRank = avgRankData && avgRankData.length > 0
        ? avgRankData.reduce((sum, item) => sum + item.rank, 0) / avgRankData.length
        : 0

      rankingTrendsData.push({ date: dateStr, count: count || 0 })
      averageRankData.push({ date: dateStr, rank: avgRank })
    }

    // 인기 키워드
    const { data: keywordsData } = await supabase
      .from('tracked_places')
      .select('id, search_keyword')

    const keywordStats = new Map()
    
    if (keywordsData) {
      for (const place of keywordsData) {
        const keyword = place.search_keyword
        if (!keywordStats.has(keyword)) {
          keywordStats.set(keyword, { count: 0, totalRank: 0, validRanks: 0 })
        }
        
        // Get rankings for this place
        const { data: rankingsData } = await supabase
          .from('rankings')
          .select('rank')
          .eq('place_id', place.id)
          .not('rank', 'is', null)
          .gte('checked_at', startDate.toISOString())
        
        const stats = keywordStats.get(keyword)
        stats.count++
        
        if (rankingsData && rankingsData.length > 0) {
          const avgRank = rankingsData.reduce((sum, r) => sum + r.rank, 0) / rankingsData.length
          stats.totalRank += avgRank
          stats.validRanks++
        }
      }
    }

    const topKeywords = Array.from(keywordStats.entries())
      .map(([keyword, stats]) => ({
        keyword,
        count: stats.count,
        avgRank: stats.validRanks > 0 ? Math.round(stats.totalRank / stats.validRanks) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // 사용자 활동 데이터 (시뮬레이션)
    const userActivity = {
      activeUsers: Math.floor(Math.random() * 50) + 20,
      newUsers: Math.floor(Math.random() * 10) + 5,
      churnRate: Math.floor(Math.random() * 5) + 2,
      averageSessionTime: `${Math.floor(Math.random() * 30) + 10}분`
    }

    // 수익 데이터 (크레딧 판매 기반)
    const { data: creditsData } = await supabase
      .from('credits')
      .select('balance')
      .gte('created_at', startDate.toISOString())

    const totalCredits = creditsData?.reduce((sum, credit) => sum + credit.balance, 0) || 0
    const totalRevenue = totalCredits * 100 // 크레딧당 100원 가정

    const revenueData = {
      daily: [], // 실제로는 일별 수익 데이터
      monthly: [], // 실제로는 월별 수익 데이터
      totalRevenue,
      totalCredits
    }

    const analytics = {
      userGrowth: {
        daily: userGrowthData,
        weekly: [], // 주별 데이터는 일별 데이터를 집계하여 생성
        monthly: [] // 월별 데이터는 일별 데이터를 집계하여 생성
      },
      placeGrowth: {
        daily: placeGrowthData,
        weekly: [],
        monthly: []
      },
      rankingTrends: {
        daily: rankingTrendsData,
        averageRank: averageRankData
      },
      revenueData,
      topKeywords,
      userActivity
    }

    return NextResponse.json({ analytics })

  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}