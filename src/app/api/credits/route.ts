import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: credits, error } = await supabase
    .from('user_credits')
    .select('balance, total_purchased')
    .eq('user_id', user.id)
    .single();

  if (error) {
    // If user_credits table doesn't exist or user has no credits record,
    // return default values instead of error
    console.log('Credits fetch error (returning defaults):', error.message);
    return NextResponse.json({ 
      credits: {
        balance: 3, // Default 3 credits for new users
        total_purchased: 0
      }
    });
  }

  return NextResponse.json({ credits });
}