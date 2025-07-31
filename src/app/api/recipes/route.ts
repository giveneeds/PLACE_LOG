import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase
    .from('recipes')
    .select('id, title, summary, price_credits, category, tags, view_count, purchase_count, created_at', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq('category', category);
  }

  const { data: recipes, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 사용자가 구매한 레시피 확인
  const { data: { user } } = await supabase.auth.getUser();
  
  let purchasedRecipes = [];
  if (user) {
    const { data: purchases } = await supabase
      .from('recipe_purchases')
      .select('recipe_id')
      .eq('user_id', user.id);
    
    purchasedRecipes = purchases?.map(p => p.recipe_id) || [];
  }

  const recipesWithPurchaseStatus = recipes?.map(recipe => ({
    ...recipe,
    isPurchased: purchasedRecipes.includes(recipe.id)
  }));

  return NextResponse.json({ 
    recipes: recipesWithPurchaseStatus,
    total: count,
    limit,
    offset
  });
}