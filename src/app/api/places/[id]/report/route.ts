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

    // 최근 30일 순위 기록 조회
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const { data: rankings, error: rankingsError } = await supabase
      .from('rankings')
      .select('*')
      .eq('place_id', id)
      .gte('checked_at', thirtyDaysAgo.toISOString())
      .order('checked_at', { ascending: true })

    if (rankingsError) {
      throw rankingsError
    }

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

    // 순위 변화 분석
    const rankChange = stats.currentRank && stats.previousRank 
      ? stats.previousRank - stats.currentRank 
      : 0

    // 트렌드 분석
    let trend = 'stable'
    if (validRankings.length >= 7) {
      const recentWeek = validRankings.slice(-7)
      const previousWeek = validRankings.slice(-14, -7)
      
      if (previousWeek.length >= 7) {
        const recentAvg = recentWeek.reduce((sum, r) => sum + r.rank, 0) / recentWeek.length
        const previousAvg = previousWeek.reduce((sum, r) => sum + r.rank, 0) / previousWeek.length
        
        if (previousAvg - recentAvg > 2) trend = 'improving'
        else if (recentAvg - previousAvg > 2) trend = 'declining'
      }
    }

    // 분석 텍스트 생성
    const analysis = {
      summary: generateSummary(place, stats, trend),
      strengths: generateStrengths(stats, trend),
      weaknesses: generateWeaknesses(stats, trend),
      recommendations: generateRecommendations(stats, trend)
    }

    // 차트 데이터 포맷팅
    const chartData = rankings?.map(record => ({
      date: record.checked_at,
      rank: record.rank,
    })) || []

    return NextResponse.json({
      place,
      stats,
      trend,
      analysis,
      chartData,
      generatedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Place report error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

function generateSummary(place: any, stats: any, trend: string): string {
  const trendText = trend === 'improving' ? '상승 추세' : trend === 'declining' ? '하락 추세' : '안정적'
  
  return `${place.place_name}은(는) 현재 "${place.search_keyword}" 키워드에서 ${stats.currentRank || '순위권 밖'}위를 기록하고 있으며, 최근 30일간 ${trendText}를 보이고 있습니다. 평균 순위는 ${stats.averageRank || '-'}위이며, 최고 ${stats.bestRank || '-'}위에서 최저 ${stats.worstRank || '-'}위 사이에서 변동하고 있습니다.`
}

function generateStrengths(stats: any, trend: string): string[] {
  const strengths = []
  
  if (stats.currentRank && stats.currentRank <= 10) {
    strengths.push('상위 10위 내 안정적인 순위 유지')
  }
  
  if (trend === 'improving') {
    strengths.push('최근 순위가 지속적으로 상승하는 긍정적 트렌드')
  }
  
  if (stats.bestRank && stats.bestRank <= 5) {
    strengths.push(`최고 ${stats.bestRank}위까지 도달한 경험 보유`)
  }
  
  if (stats.validRecords > 20) {
    strengths.push('충분한 데이터로 신뢰할 수 있는 분석 가능')
  }
  
  return strengths.length > 0 ? strengths : ['지속적인 순위 추적으로 데이터 축적 중']
}

function generateWeaknesses(stats: any, trend: string): string[] {
  const weaknesses = []
  
  if (stats.currentRank && stats.currentRank > 20) {
    weaknesses.push('현재 순위가 20위 밖으로 개선이 필요')
  }
  
  if (trend === 'declining') {
    weaknesses.push('최근 순위가 하락하는 부정적 트렌드')
  }
  
  if (stats.worstRank && stats.bestRank && (stats.worstRank - stats.bestRank) > 20) {
    weaknesses.push('순위 변동 폭이 커서 안정성 부족')
  }
  
  if (stats.validRecords < stats.totalRecords * 0.8) {
    weaknesses.push('측정 실패율이 높아 데이터 신뢰성 개선 필요')
  }
  
  return weaknesses.length > 0 ? weaknesses : ['특별한 약점이 발견되지 않음']
}

function generateRecommendations(stats: any, trend: string): string[] {
  const recommendations = []
  
  if (stats.currentRank && stats.currentRank > 10) {
    recommendations.push('리뷰 관리 및 포스팅 활동 강화로 순위 상승 도모')
  }
  
  if (trend === 'declining') {
    recommendations.push('경쟁사 분석을 통해 순위 하락 원인 파악 필요')
  }
  
  if (stats.worstRank && stats.bestRank && (stats.worstRank - stats.bestRank) > 20) {
    recommendations.push('일관된 마케팅 전략으로 순위 안정화 필요')
  }
  
  recommendations.push('주기적인 순위 모니터링으로 변화에 빠르게 대응')
  recommendations.push('키워드별 상위 노출 전략 레시피 참고 권장')
  
  return recommendations
}