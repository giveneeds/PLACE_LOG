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

    // 시스템 상태 체크
    const [
      { data: dbTest, error: dbError },
      { data: lastCrawl },
      { count: totalRequests }
    ] = await Promise.all([
      // 데이터베이스 상태 체크
      supabase.from('profiles').select('id').limit(1),
      
      // 마지막 크롤링 시간
      supabase
        .from('rankings')
        .select('checked_at')
        .order('checked_at', { ascending: false })
        .limit(1)
        .single(),
      
      // 총 요청 수 (순위 기록으로 근사치)
      supabase
        .from('rankings')
        .select('id', { count: 'exact', head: true })
    ])

    // 데이터베이스 상태
    const databaseStatus = dbError ? 'error' : 'healthy'

    // 크롤러 상태 (마지막 크롤링이 24시간 이내면 running)
    const lastCrawlTime = lastCrawl?.checked_at ? new Date(lastCrawl.checked_at) : null
    const now = new Date()
    const hoursSinceLastCrawl = lastCrawlTime 
      ? (now.getTime() - lastCrawlTime.getTime()) / (1000 * 60 * 60) 
      : Infinity

    const crawlerStatus = hoursSinceLastCrawl < 24 ? 'running' : 'stopped'

    // GitHub Actions 상태 (임시로 active로 설정, 실제로는 GitHub API를 통해 확인 가능)
    const githubActionsStatus = 'active'

    // 시스템 업타임 (서버 시작 시간 기준, 임시로 고정값)
    const uptime = '24시간 15분'

    // 에러율 계산 (rank가 null인 비율)
    const { count: failedCrawls } = await supabase
      .from('rankings')
      .select('id', { count: 'exact', head: true })
      .is('rank', null)
      .gte('checked_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const { count: totalRecentCrawls } = await supabase
      .from('rankings')
      .select('id', { count: 'exact', head: true })
      .gte('checked_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const errorRate = totalRecentCrawls && totalRecentCrawls > 0 
      ? (failedCrawls / totalRecentCrawls) * 100 
      : 0

    const status = {
      database: databaseStatus,
      crawler: crawlerStatus,
      github_actions: githubActionsStatus,
      last_crawl: lastCrawl?.checked_at || null,
      uptime,
      total_requests: totalRequests || 0,
      error_rate: errorRate
    }

    return NextResponse.json({ status })

  } catch (error: any) {
    console.error('System status error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}