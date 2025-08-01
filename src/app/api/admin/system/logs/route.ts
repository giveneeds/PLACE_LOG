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

    // 시스템 로그 생성 (실제 환경에서는 로그 테이블이나 파일에서 읽어옴)
    const logs = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30분 전
        level: 'info' as const,
        message: '크롤링 작업이 성공적으로 완료되었습니다.',
        source: 'crawler'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2시간 전
        level: 'warning' as const,
        message: '일부 플레이스에서 순위를 찾을 수 없습니다.',
        source: 'crawler'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4시간 전
        level: 'info' as const,
        message: '새로운 사용자가 등록되었습니다.',
        source: 'auth'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6시간 전
        level: 'error' as const,
        message: '크롤링 중 네트워크 타임아웃이 발생했습니다.',
        source: 'crawler'
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8시간 전
        level: 'info' as const,
        message: '데이터베이스 백업이 완료되었습니다.',
        source: 'database'
      },
      {
        id: '6',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12시간 전
        level: 'info' as const,
        message: '시스템이 정상적으로 시작되었습니다.',
        source: 'system'
      },
      {
        id: '7',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18시간 전
        level: 'warning' as const,
        message: '크롤링 속도가 평소보다 느립니다.',
        source: 'crawler'
      },
      {
        id: '8',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(), // 20시간 전
        level: 'info' as const,
        message: 'GitHub Actions 스케줄이 실행되었습니다.',
        source: 'github'
      }
    ]

    // 최신 순으로 정렬
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ logs })

  } catch (error: any) {
    console.error('System logs error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}