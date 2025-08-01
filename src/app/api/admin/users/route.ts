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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // 사용자 목록 조회 (페이지네이션)
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        role,
        created_at,
        credits!inner(balance),
        tracked_places(id)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (usersError) {
      throw usersError
    }

    // 총 사용자 수 (페이지네이션용)
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    // 데이터 가공
    const processedUsers = users?.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      credit_balance: user.credits?.balance || 0,
      tracked_places_count: user.tracked_places?.length || 0,
    })) || []

    return NextResponse.json({
      users: processedUsers,
      pagination: {
        page,
        limit,
        total: totalUsers || 0,
        totalPages: Math.ceil((totalUsers || 0) / limit),
      }
    })

  } catch (error: any) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// 사용자 역할 변경
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 관리자 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId, newRole } = await request.json()

    if (!userId || !newRole || !['user', 'admin'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    // 자기 자신의 권한은 변경할 수 없음
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Update user role error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}