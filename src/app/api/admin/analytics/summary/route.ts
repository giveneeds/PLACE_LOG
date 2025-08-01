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

    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // 현재 총계
    const [
      { count: totalUsers },
      { count: totalPlaces },
      { count: totalRankings },
      { data: creditsData }
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('tracked_places').select('id', { count: 'exact', head: true }),
      supabase.from('rankings').select('id', { count: 'exact', head: true }),
      supabase.from('credits').select('balance')
    ])

    // 지난 주 대비 증가율 계산
    const [
      { count: usersLastWeek },
      { count: placesLastWeek },
      { count: rankingsLastWeek }
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .lt('created_at', lastWeek.toISOString()),
      supabase
        .from('tracked_places')
        .select('id', { count: 'exact', head: true })
        .lt('created_at', lastWeek.toISOString()),
      supabase
        .from('rankings')
        .select('id', { count: 'exact', head: true })
        .lt('checked_at', lastWeek.toISOString())
    ])

    // 성장률 계산
    const calculateGrowthRate = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    const userGrowthRate = calculateGrowthRate(totalUsers || 0, usersLastWeek || 0)
    const placeGrowthRate = calculateGrowthRate(totalPlaces || 0, placesLastWeek || 0)
    const rankingGrowthRate = calculateGrowthRate(totalRankings || 0, rankingsLastWeek || 0)

    // 수익 계산
    const totalCredits = creditsData?.reduce((sum, credit) => sum + credit.balance, 0) || 0
    const totalRevenue = totalCredits * 100 // 크레딧당 100원 가정

    // 지난 주 수익
    const { data: creditsLastWeek } = await supabase
      .from('credits')
      .select('balance')
      .lt('created_at', lastWeek.toISOString())

    const revenueLastWeek = (creditsLastWeek?.reduce((sum, credit) => sum + credit.balance, 0) || 0) * 100
    const revenueGrowthRate = calculateGrowthRate(totalRevenue, revenueLastWeek)

    const stats = {
      totalUsers: totalUsers || 0,
      userGrowthRate,
      totalPlaces: totalPlaces || 0,
      placeGrowthRate,
      totalRankings: totalRankings || 0,
      rankingGrowthRate,
      totalRevenue,
      revenueGrowthRate
    }

    return NextResponse.json({ stats })

  } catch (error: any) {
    console.error('Analytics summary error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}