import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 크레딧 패키지 정의
const CREDIT_PACKAGES = {
  '10': { credits: 10, price: 100000 },
  '50': { credits: 50, price: 450000 },
  '100': { credits: 100, price: 850000 }
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { packageType, depositorName, bankName } = await request.json();

  const selectedPackage = CREDIT_PACKAGES[packageType as keyof typeof CREDIT_PACKAGES];
  
  if (!selectedPackage) {
    return NextResponse.json({ error: 'Invalid package type' }, { status: 400 });
  }

  const { data: paymentRequest, error } = await supabase
    .from('payment_requests')
    .insert({
      user_id: user.id,
      amount: selectedPackage.price,
      credit_amount: selectedPackage.credits,
      depositor_name: depositorName,
      bank_name: bankName,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ 
    paymentRequest,
    bankInfo: {
      bankName: '국민은행',
      accountNumber: '564701-01-540185',
      accountHolder: '박성빈(기브니즈)',
      amount: selectedPackage.price
    }
  });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: requests, error } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ requests });
}