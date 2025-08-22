import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch recent recipe purchases for the user
    // Since this is a placeholder, return empty data for now
    // TODO: Implement actual purchase history when purchase system is ready
    return NextResponse.json({ 
      purchases: [],
      success: true 
    })
    
  } catch (error) {
    console.error('Error in GET /api/recipes/purchases/recent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}