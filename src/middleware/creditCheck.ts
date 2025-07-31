import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface CreditRequirement {
  amount: number;
  description: string;
  metadata?: any;
}

export async function checkAndDeductCredits(
  request: NextRequest,
  requirement: CreditRequirement
): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  const supabase = await createClient();
  
  // 사용자 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  // 현재 크레딧 조회
  const { data: credits, error: creditError } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  if (creditError || !credits) {
    return { success: false, error: 'Failed to fetch credits' };
  }

  // 크레딧 부족 확인
  if (credits.balance < requirement.amount) {
    return { success: false, error: 'Insufficient credits' };
  }

  // 크레딧 차감
  const newBalance = credits.balance - requirement.amount;
  const { error: updateError } = await supabase
    .from('user_credits')
    .update({ balance: newBalance })
    .eq('user_id', user.id);

  if (updateError) {
    return { success: false, error: 'Failed to deduct credits' };
  }

  // 거래 내역 기록
  const { error: transactionError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: user.id,
      amount: -requirement.amount,
      type: 'deduct',
      description: requirement.description,
      metadata: requirement.metadata
    });

  if (transactionError) {
    // 거래 기록 실패는 크리티컬하지 않으므로 진행
    console.error('Failed to record transaction:', transactionError);
  }

  return { success: true, newBalance };
}

// 크레딧 요구사항을 확인만 하는 함수 (차감하지 않음)
export async function checkCredits(
  request: NextRequest,
  requiredAmount: number
): Promise<{ hasEnough: boolean; currentBalance?: number; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { hasEnough: false, error: 'Unauthorized' };
  }

  const { data: credits, error: creditError } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  if (creditError || !credits) {
    return { hasEnough: false, error: 'Failed to fetch credits' };
  }

  return {
    hasEnough: credits.balance >= requiredAmount,
    currentBalance: credits.balance
  };
}