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

    // 플레이스 목록 조회
    const { data: places, error: placesError } = await supabase
      .from('tracked_places')
      .select(`
        id,
        place_name,
        search_keyword,
        is_active,
        created_at,
        user_id
      `)
      .order('created_at', { ascending: false })

    if (placesError) {
      throw placesError
    }

    // 각 플레이스의 최신 순위 및 크롤링 정보 조회
    const placesWithStats = await Promise.all(
      (places || []).map(async (place) => {
        // 사용자 이메일 조회
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', place.user_id)
          .single()

        // 최신 순위 조회
        const { data: latestRanking } = await supabase
          .from('rankings')
          .select('rank, checked_at')
          .eq('place_id', place.id)
          .order('checked_at', { ascending: false })
          .limit(1)
          .single()

        // 총 순위 기록 수
        const { count: totalRankings } = await supabase
          .from('rankings')
          .select('id', { count: 'exact', head: true })
          .eq('place_id', place.id)

        return {
          id: place.id,
          place_name: place.place_name,
          search_keyword: place.search_keyword,
          is_active: place.is_active,
          user_email: userProfile?.email || 'Unknown',
          latest_rank: latestRanking?.rank || null,
          latest_crawl: latestRanking?.checked_at || null,
          total_rankings: totalRankings || 0,
          created_at: place.created_at
        }
      })
    )

    return NextResponse.json({ places: placesWithStats })

  } catch (error: any) {
    console.error('Admin data places error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}