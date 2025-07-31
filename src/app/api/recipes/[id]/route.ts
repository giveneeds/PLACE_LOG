import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const recipeId = params.id;

  // 레시피 기본 정보 조회
  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .eq('is_active', true)
    .single();

  if (error || !recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

  // 조회수 증가
  await supabase
    .from('recipes')
    .update({ view_count: recipe.view_count + 1 })
    .eq('id', recipeId);

  // 사용자 인증 확인
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // 로그인하지 않은 경우 요약만 반환
    return NextResponse.json({
      id: recipe.id,
      title: recipe.title,
      summary: recipe.summary,
      price_credits: recipe.price_credits,
      category: recipe.category,
      tags: recipe.tags,
      view_count: recipe.view_count + 1,
      purchase_count: recipe.purchase_count,
      isPurchased: false,
      requiresAuth: true
    });
  }

  // 구매 여부 확인
  const { data: purchase } = await supabase
    .from('recipe_purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('recipe_id', recipeId)
    .single();

  if (purchase) {
    // 구매한 경우 전체 내용 반환
    return NextResponse.json({
      ...recipe,
      isPurchased: true,
      view_count: recipe.view_count + 1
    });
  }

  // 구매하지 않은 경우
  return NextResponse.json({
    id: recipe.id,
    title: recipe.title,
    summary: recipe.summary,
    price_credits: recipe.price_credits,
    category: recipe.category,
    tags: recipe.tags,
    view_count: recipe.view_count + 1,
    purchase_count: recipe.purchase_count,
    isPurchased: false
  });
}