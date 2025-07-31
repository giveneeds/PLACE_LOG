'use client';

import { useState, useEffect } from 'react';
import { FaCoins, FaEye, FaShoppingCart, FaLock, FaUnlock, FaPhone, FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

interface Recipe {
  id: string;
  title: string;
  summary: string;
  content?: string;
  price_credits: number;
  category: string;
  tags: string[];
  view_count: number;
  purchase_count: number;
  isPurchased: boolean;
  created_at: string;
  agency_contact?: string;
  requiresAuth?: boolean;
}

interface RecipeDetailProps {
  params: Promise<{ id: string }>;
}

export default function RecipeDetailPage({ params }: RecipeDetailProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [recipeId, setRecipeId] = useState<string>('');

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setRecipeId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (recipeId) {
      fetchRecipe();
      fetchUserCredits();
    }
  }, [recipeId]);

  const fetchRecipe = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`);
      const data = await response.json();
      
      if (response.ok) {
        setRecipe(data);
      } else {
        console.error('Failed to fetch recipe:', data.error);
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/credits');
      const data = await response.json();
      
      if (response.ok && data.credits) {
        setUserCredits(data.credits.balance);
      }
    } catch (error) {
      console.error('Error fetching user credits:', error);
    }
  };

  const handlePurchase = async () => {
    if (!recipe || purchasing) return;

    setPurchasing(true);
    try {
      const response = await fetch(`/api/recipes/${recipeId}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        // 구매 성공 - 페이지 새로고침하여 전체 내용 표시
        window.location.reload();
      } else {
        alert(data.error || '구매 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Error purchasing recipe:', error);
      alert('구매 중 오류가 발생했습니다.');
    } finally {
      setPurchasing(false);
    }
  };

  const goBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-base flex items-center justify-center">
        <div className="text-text-primary">로딩 중...</div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background-base flex items-center justify-center">
        <div className="text-center">
          <div className="text-text-primary text-xl mb-4">레시피를 찾을 수 없습니다</div>
          <button
            onClick={goBack}
            className="text-brand-primary hover:text-brand-primaryLight"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const canAccessFullContent = recipe.isPurchased || recipe.requiresAuth === false;
  const insufficientCredits = userCredits < recipe.price_credits;

  return (
    <div className="min-h-screen bg-background-base">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={goBack}
          className="flex items-center space-x-2 text-text-secondary hover:text-brand-primary mb-6 transition-colors"
        >
          <FaArrowLeft />
          <span>레시피 목록으로</span>
        </button>

        {/* Recipe Header */}
        <div className="bg-background-elevated border border-border-primary rounded-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <span className="bg-brand-primary/20 text-brand-primary px-3 py-1 rounded text-sm font-medium">
                  {recipe.category}
                </span>
                {recipe.isPurchased && (
                  <span className="bg-success/20 text-success px-3 py-1 rounded text-sm font-medium flex items-center space-x-1">
                    <FaUnlock className="text-xs" />
                    <span>구매완료</span>
                  </span>
                )}
              </div>
              <h1 className="text-display-medium text-text-primary mb-4">
                {recipe.title}
              </h1>
              <p className="text-text-secondary text-lg leading-relaxed">
                {recipe.summary}
              </p>
            </div>
          </div>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-background-base text-text-muted px-3 py-1 rounded text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats and Price */}
          <div className="flex items-center justify-between pt-6 border-t border-border-primary">
            <div className="flex items-center space-x-6 text-text-secondary">
              <div className="flex items-center space-x-2">
                <FaEye />
                <span>조회 {recipe.view_count}회</span>
              </div>
              <div className="flex items-center space-x-2">
                <FaShoppingCart />
                <span>구매 {recipe.purchase_count}회</span>
              </div>
              <div className="text-text-muted text-sm">
                {new Date(recipe.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center space-x-2 text-brand-primary font-semibold text-xl">
              <FaCoins />
              <span>{recipe.price_credits} 크레딧</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-background-elevated border border-border-primary rounded-lg p-8">
          {canAccessFullContent ? (
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{recipe.content || recipe.summary}</ReactMarkdown>
              
              {/* Agency Contact */}
              {recipe.agency_contact && (
                <div className="mt-8 p-6 bg-background-base border border-border-primary rounded-lg">
                  <h3 className="text-text-primary font-semibold mb-4 flex items-center space-x-2">
                    <FaPhone />
                    <span>대행사 연락처</span>
                  </h3>
                  <div className="space-y-2 text-text-secondary">
                    <ReactMarkdown>{recipe.agency_contact}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <FaLock className="text-6xl text-text-muted mx-auto mb-6" />
              <h3 className="text-text-primary text-xl font-semibold mb-4">
                전체 내용을 보려면 구매가 필요합니다
              </h3>
              <p className="text-text-secondary mb-8">
                이 레시피의 상세한 마케팅 전략과 실무 노하우를 확인하세요
              </p>
              
              <div className="flex flex-col items-center space-y-4">
                <div className="text-text-secondary">
                  보유 크레딧: <span className="font-semibold text-text-primary">{userCredits}</span>
                </div>
                
                {insufficientCredits ? (
                  <div className="text-center">
                    <p className="text-error mb-4">크레딧이 부족합니다</p>
                    <button
                      onClick={() => window.location.href = '/dashboard'}
                      className="bg-brand-primary hover:bg-brand-primaryLight text-text-primary px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                      크레딧 충전하기
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="bg-brand-primary hover:bg-brand-primaryLight disabled:opacity-50 text-text-primary px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <FaCoins />
                    <span>
                      {purchasing ? '구매 중...' : `${recipe.price_credits} 크레딧으로 구매하기`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}