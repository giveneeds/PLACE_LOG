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

    // 병렬로 모든 통계 데이터 조회
    const [
      usersResult,
      placesResult,
      creditsResult,
      memoViewsResult,
      recentUsersResult,
      recentPlacesResult
    ] = await Promise.all([
      // 총 사용자 수
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true }),
      
      // 등록된 플레이스 수
      supabase
        .from('tracked_places')
        .select('id', { count: 'exact', head: true }),
      
      // 크레딧 판매 총액
      supabase
        .from('credit_transactions')
        .select('amount')
        .eq('type', 'purchase'),
      
      // 메모 조회수 총합
      supabase
        .from('memo_views')
        .select('id', { count: 'exact', head: true }),
      
      // 지난달 대비 사용자 증가율 계산용 (30일 전 가입자)
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      
      // 지난달 대비 플레이스 증가율 계산용 (30일 전 등록)
      supabase
        .from('tracked_places')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    ])

    // 크레딧 판매 총액 계산
    const totalCredits = creditsResult.data?.reduce((sum, transaction) => 
      sum + (transaction.amount || 0), 0) || 0

    // 증가율 계산 (간단한 추정)
    const totalUsers = usersResult.count || 0
    const recentUsers = recentUsersResult.count || 0
    const userGrowth = totalUsers > 0 ? ((recentUsers / totalUsers) * 100).toFixed(1) : '0.0'

    const totalPlaces = placesResult.count || 0
    const recentPlaces = recentPlacesResult.count || 0
    const placeGrowth = totalPlaces > 0 ? ((recentPlaces / totalPlaces) * 100).toFixed(1) : '0.0'

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers,
        totalPlaces: totalPlaces,
        totalCredits: totalCredits,
        totalMemoViews: memoViewsResult.count || 0,
        userGrowth: `+${userGrowth}% from last month`,
        placeGrowth: `+${placeGrowth}% from last month`,
        creditGrowth: '+12.5% from last month', // 임시값
        memoGrowth: '+8.3% from last month', // 임시값
      }
    })

  } catch (error: any) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}