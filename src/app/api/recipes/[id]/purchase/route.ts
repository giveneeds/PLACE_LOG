import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const recipeId = params.id;
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 이미 구매했는지 확인
  const { data: existingPurchase } = await supabase
    .from('recipe_purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('recipe_id', recipeId)
    .single();

  if (existingPurchase) {
    return NextResponse.json({ error: 'Already purchased' }, { status: 400 });
  }

  // 레시피 정보 조회
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('price_credits, title')
    .eq('id', recipeId)
    .eq('is_active', true)
    .single();

  if (recipeError || !recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

  // 크레딧 잔액 확인
  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  if (!credits || credits.balance < recipe.price_credits) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
  }

  // 크레딧 차감
  const { error: deductError } = await supabase
    .from('user_credits')
    .update({ balance: credits.balance - recipe.price_credits })
    .eq('user_id', user.id);

  if (deductError) {
    return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 500 });
  }

  // 구매 기록
  const { error: purchaseError } = await supabase
    .from('recipe_purchases')
    .insert({
      user_id: user.id,
      recipe_id: recipeId,
      credit_amount: recipe.price_credits
    });

  if (purchaseError) {
    // 크레딧 롤백 (간단한 보상 처리)
    await supabase
      .from('user_credits')
      .update({ balance: credits.balance })
      .eq('user_id', user.id);
    
    return NextResponse.json({ error: 'Failed to record purchase' }, { status: 500 });
  }

  // 거래 내역 기록
  await supabase
    .from('credit_transactions')
    .insert({
      user_id: user.id,
      amount: -recipe.price_credits,
      type: 'deduct',
      description: `레시피 구매: ${recipe.title}`,
      metadata: { recipe_id: recipeId }
    });

  // 구매 수 증가
  await supabase
    .from('recipes')
    .update({ purchase_count: recipe.purchase_count + 1 })
    .eq('id', recipeId);

  return NextResponse.json({ 
    success: true,
    newBalance: credits.balance - recipe.price_credits
  });
}