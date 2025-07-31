import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 관리자 권한 확인
async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', userId)
    .single();
  
  return !error && !!data;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user || !(await isAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 모든 결제 요청 조회 (상태별 필터링 제거)
  const { data: payments, error } = await supabase
    .from('payment_requests')
    .select(`
      *,
      user:user_id (
        email,
        raw_user_meta_data
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 데이터 변환 (user_email 필드 추가)
  const formattedPayments = payments?.map(payment => ({
    ...payment,
    user_email: payment.user?.email || 'Unknown'
  })) || [];

  return NextResponse.json({ payments: formattedPayments });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user || !(await isAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { payment_id, status } = await request.json();

    if (!payment_id || !['confirmed', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // 결제 요청 정보 조회
    const { data: payment, error: fetchError } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', payment_id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !payment) {
      return NextResponse.json({ error: 'Payment request not found or already processed' }, { status: 404 });
    }

    // 결제 상태 업데이트
    const updateData = status === 'confirmed' 
      ? { 
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: user.id
        }
      : { 
          status: 'rejected',
          confirmed_at: new Date().toISOString()
        };

    const { error: updateError } = await supabase
      .from('payment_requests')
      .update(updateData)
      .eq('id', payment_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // 승인된 경우에만 크레딧 지급
    if (status === 'confirmed') {
      // 현재 크레딧 조회
      const { data: currentCredits } = await supabase
        .from('user_credits')
        .select('balance, total_purchased')
        .eq('user_id', payment.user_id)
        .single();

      const newBalance = (currentCredits?.balance || 0) + payment.credit_amount;
      const newTotalPurchased = (currentCredits?.total_purchased || 0) + payment.credit_amount;

      // 크레딧 업데이트
      const { error: creditError } = await supabase
        .from('user_credits')
        .update({
          balance: newBalance,
          total_purchased: newTotalPurchased
        })
        .eq('user_id', payment.user_id);

      if (creditError) {
        // 롤백
        await supabase
          .from('payment_requests')
          .update({ status: 'pending' })
          .eq('id', payment_id);
        
        return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
      }

      // 거래 내역 기록
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: payment.user_id,
          amount: payment.credit_amount,
          type: 'purchase',
          description: `무통장 입금 확인 - ${payment.amount.toLocaleString()}원`,
          metadata: { payment_request_id: payment_id }
        });
    }

    return NextResponse.json({ 
      success: true,
      message: status === 'confirmed' ? '입금이 확인되어 크레딧이 지급되었습니다.' : '입금 요청이 거부되었습니다.'
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user || !(await isAdmin(supabase, user.id))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { paymentId, action } = await request.json();

  if (!paymentId || !['confirm', 'cancel'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // 결제 요청 정보 조회
  const { data: payment, error: fetchError } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('id', paymentId)
    .eq('status', 'pending')
    .single();

  if (fetchError || !payment) {
    return NextResponse.json({ error: 'Payment request not found' }, { status: 404 });
  }

  if (action === 'confirm') {
    // 트랜잭션 시작
    // 1. 결제 상태 업데이트
    const { error: updateError } = await supabase
      .from('payment_requests')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        confirmed_by: user.id
      })
      .eq('id', paymentId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // 2. 크레딧 추가
    const { data: currentCredits } = await supabase
      .from('user_credits')
      .select('balance, total_purchased')
      .eq('user_id', payment.user_id)
      .single();

    const newBalance = (currentCredits?.balance || 0) + payment.credit_amount;
    const newTotalPurchased = (currentCredits?.total_purchased || 0) + payment.credit_amount;

    const { error: creditError } = await supabase
      .from('user_credits')
      .update({
        balance: newBalance,
        total_purchased: newTotalPurchased
      })
      .eq('user_id', payment.user_id);

    if (creditError) {
      // 롤백 시도
      await supabase
        .from('payment_requests')
        .update({ status: 'pending' })
        .eq('id', paymentId);
      
      return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
    }

    // 3. 거래 내역 기록
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: payment.user_id,
        amount: payment.credit_amount,
        type: 'purchase',
        description: `무통장 입금 - ${payment.credit_amount} 크레딧`,
        metadata: { payment_id: paymentId, amount_krw: payment.amount }
      });

    return NextResponse.json({ 
      success: true,
      message: 'Payment confirmed',
      creditsAdded: payment.credit_amount
    });

  } else if (action === 'cancel') {
    const { error: cancelError } = await supabase
      .from('payment_requests')
      .update({
        status: 'cancelled',
        notes: '관리자에 의해 취소됨'
      })
      .eq('id', paymentId);

    if (cancelError) {
      return NextResponse.json({ error: cancelError.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Payment cancelled'
    });
  }
}