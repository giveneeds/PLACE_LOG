import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 레시피 생성
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 관리자 권한 확인
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const {
      title,
      summary,
      content,
      price_credits,
      category,
      tags,
      agency_contact
    } = await request.json();

    const { data: recipe, error } = await supabase
      .from('recipes')
      .insert({
        title,
        summary,
        content,
        price_credits,
        category,
        tags,
        agency_contact,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Recipe creation error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('Recipe creation error:', error);
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 });
  }
}

// 레시피 수정
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 관리자 권한 확인
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const {
      id,
      title,
      summary,
      content,
      price_credits,
      category,
      tags,
      agency_contact
    } = await request.json();

    const { data: recipe, error } = await supabase
      .from('recipes')
      .update({
        title,
        summary,
        content,
        price_credits,
        category,
        tags,
        agency_contact,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Recipe update error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('Recipe update error:', error);
    return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 });
  }
}

// 레시피 삭제
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 관리자 권한 확인
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { id } = await request.json();

    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Recipe deletion error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Recipe deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 });
  }
}