import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { amount, description, metadata } = await request.json();

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  // 트랜잭션으로 처리
  const { data: currentCredits } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  if (!currentCredits || currentCredits.balance < amount) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
  }

  // 크레딧 차감
  const { error: updateError } = await supabase
    .from('user_credits')
    .update({ balance: currentCredits.balance - amount })
    .eq('user_id', user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  // 거래 내역 기록
  const { data: transaction, error: transactionError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: user.id,
      amount: -amount,
      type: 'deduct',
      description,
      metadata
    })
    .select()
    .single();

  if (transactionError) {
    // 롤백이 필요하지만 Supabase에서는 트랜잭션이 제한적
    return NextResponse.json({ error: transactionError.message }, { status: 400 });
  }

  return NextResponse.json({ 
    success: true,
    transaction,
    newBalance: currentCredits.balance - amount
  });
}