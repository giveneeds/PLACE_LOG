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
                {!recipe.isPurchased && (
                  <span className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded text-sm font-medium flex items-center space-x-1">
                    <FaLock className="text-xs" />
                    <span>프리미엄 콘텐츠</span>
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
            <div className="space-y-8">
              {/* Free Preview Section */}
              <div className="border border-border-primary rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">🆓 무료 미리보기</h3>
                  <span className="text-xs text-green-500 bg-green-500/20 px-2 py-1 rounded">무료</span>
                </div>
                <div className="prose prose-invert max-w-none">
                  <p className="text-text-secondary">
                    이 레시피는 <strong className="text-brand-primary">{recipe.category}</strong> 업종에서 실제로 성공한 마케팅 전략을 담고 있습니다.
                  </p>
                  <p className="text-text-secondary">
                    {recipe.summary}
                  </p>
                  <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded mt-4">
                    <p className="text-text-primary font-medium">💡 이 레시피에서 배울 수 있는 것:</p>
                    <ul className="text-text-secondary text-sm mt-2 space-y-1">
                      <li>• 검증된 상위 노출 전략과 구체적인 실행 방법</li>
                      <li>• 실제 성과 데이터와 분석 결과</li>
                      <li>• 업종별 최적화된 마케팅 접근법</li>
                      <li>• 예산별 단계적 실행 계획</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Premium Content Teaser */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background-elevated to-background-elevated z-10"></div>
                <div className="border border-border-primary rounded-lg p-6 opacity-60">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-text-primary">🔥 프리미엄 상세 전략</h3>
                    <span className="text-xs text-yellow-500 bg-yellow-500/20 px-2 py-1 rounded">프리미엄</span>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-text-secondary blur-sm">
                      상세한 실행 단계별 가이드와 구체적인 작업 내용이 포함되어 있습니다. 
                      키워드 선정부터 콘텐츠 최적화, 리뷰 관리 전략까지...
                    </p>
                    <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded mt-4 blur-sm">
                      <p className="text-text-primary font-medium">📊 실제 성과 데이터:</p>
                      <p className="text-text-secondary text-sm mt-2">
                        적용 후 30일 내 순위 상승률 85%, 월평균 매출 증가율...
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase CTA Section */}
              <div className="bg-gradient-to-r from-brand-primary/10 to-purple-500/10 border border-brand-primary/20 rounded-lg p-8 text-center">
                <FaLock className="text-4xl text-brand-primary mx-auto mb-4" />
                <h3 className="text-text-primary text-xl font-semibold mb-2">
                  완전한 성공 레시피 잠금 해제
                </h3>
                <p className="text-text-secondary mb-6">
                  지금까지 <strong className="text-brand-primary">{recipe.purchase_count}명</strong>이 이 레시피로 성과를 달성했습니다
                </p>
                
                {/* Social Proof */}
                <div className="flex items-center justify-center space-x-6 mb-6 text-sm text-text-secondary">
                  <div className="flex items-center space-x-1">
                    <span className="text-green-500">✓</span>
                    <span>실제 검증된 전략</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-green-500">✓</span>
                    <span>단계별 실행 가이드</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-green-500">✓</span>
                    <span>평생 액세스</span>
                  </div>
                </div>

                <div className="flex flex-col items-center space-y-4">
                  <div className="text-text-secondary">
                    보유 크레딧: <span className="font-semibold text-text-primary">{userCredits}</span>
                  </div>
                  
                  {insufficientCredits ? (
                    <div className="text-center">
                      <p className="text-error mb-4">
                        크레딧이 <span className="font-semibold">{recipe.price_credits - userCredits}</span>개 부족합니다
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => window.location.href = '/dashboard'}
                          className="bg-brand-primary hover:bg-brand-primaryLight text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <FaCoins />
                          <span>크레딧 충전하기</span>
                        </button>
                        <button
                          onClick={() => window.history.back()}
                          className="bg-background-base border border-border-primary text-text-secondary hover:text-text-primary px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                          다른 레시피 보기
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handlePurchase}
                      disabled={purchasing}
                      className="bg-brand-primary hover:bg-brand-primaryLight disabled:opacity-50 text-white px-8 py-4 rounded-lg font-medium transition-colors flex items-center space-x-2 text-lg"
                    >
                      <FaCoins />
                      <span>
                        {purchasing ? '구매 중...' : `${recipe.price_credits} 크레딧으로 잠금 해제`}
                      </span>
                    </button>
                  )}
                  
                  <p className="text-xs text-text-muted">
                    구매 후 즉시 전체 내용에 액세스할 수 있습니다
                  </p>
                </div>
              </div>

              {/* Additional Value Props */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-background-base border border-border-primary rounded-lg p-6">
                  <h4 className="font-semibold text-text-primary mb-3 flex items-center space-x-2">
                    <span className="text-green-500">📈</span>
                    <span>검증된 성과</span>
                  </h4>
                  <p className="text-text-secondary text-sm">
                    실제 플레이스에서 적용하여 순위 상승을 달성한 검증된 전략만을 제공합니다.
                  </p>
                </div>
                <div className="bg-background-base border border-border-primary rounded-lg p-6">
                  <h4 className="font-semibold text-text-primary mb-3 flex items-center space-x-2">
                    <span className="text-blue-500">⚡</span>
                    <span>즉시 적용 가능</span>
                  </h4>
                  <p className="text-text-secondary text-sm">
                    복잡한 이론이 아닌, 오늘부터 바로 실행할 수 있는 구체적인 액션 플랜을 제공합니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}