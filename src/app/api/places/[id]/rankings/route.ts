import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'

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

    // 플레이스 정보 조회 (권한 확인)
    const { data: place, error: placeError } = await supabase
      .from('tracked_places')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (placeError || !place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 })
    }

    // 순위 기록 조회
    const { data: rankings, error: rankingsError } = await supabase
      .from('rankings')
      .select('*')
      .eq('place_id', id)
      .gte('checked_at', startDate.toISOString())
      .order('checked_at', { ascending: true })

    if (rankingsError) {
      throw rankingsError
    }

    // 통계 계산
    const validRankings = rankings?.filter(r => r.rank !== null) || []
    const stats = {
      totalRecords: rankings?.length || 0,
      validRecords: validRankings.length,
      bestRank: validRankings.length > 0 
        ? Math.min(...validRankings.map(r => r.rank)) 
        : null,
      worstRank: validRankings.length > 0 
        ? Math.max(...validRankings.map(r => r.rank)) 
        : null,
      averageRank: validRankings.length > 0
        ? Math.round(validRankings.reduce((sum, r) => sum + r.rank, 0) / validRankings.length)
        : null,
      currentRank: validRankings.length > 0 
        ? validRankings[validRankings.length - 1].rank 
        : null,
      previousRank: validRankings.length > 1 
        ? validRankings[validRankings.length - 2].rank 
        : null,
    }

    // 차트 데이터 포맷팅
    const chartData = rankings?.map(record => ({
      date: record.checked_at,
      rank: record.rank,
      id: record.id
    })) || []

    return NextResponse.json({
      place,
      rankings: chartData,
      stats,
      range
    })

  } catch (error: any) {
    console.error('Place rankings error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}