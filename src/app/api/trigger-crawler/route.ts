import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // GitHub Actions workflow 트리거
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN
    const GITHUB_REPO = process.env.GITHUB_REPO || 'giveneeds/PLACE_LOG'
    
    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/daily-crawler.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'master'
        })
      }
    )

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Crawler workflow triggered successfully',
        timestamp: new Date().toISOString()
      })
    } else {
      const error = await response.text()
      return NextResponse.json(
        { error: `Failed to trigger workflow: ${error}` },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Trigger crawler error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}