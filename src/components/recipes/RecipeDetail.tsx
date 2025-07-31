'use client';

import { useState, useEffect } from 'react';
import { FaCoins, FaEye, FaShoppingCart, FaLock, FaUnlock, FaPhone, FaEnvelope } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

interface RecipeDetailProps {
  recipeId: string;
  onPurchaseSuccess?: () => void;
}

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
  agency_contact?: {
    name?: string;
    phone?: string;
    email?: string;
    description?: string;
  };
  isPurchased: boolean;
  requiresAuth?: boolean;
}

export function RecipeDetail({ recipeId, onPurchaseSuccess }: RecipeDetailProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchRecipe();
  }, [recipeId]);

  const fetchRecipe = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`);
      if (response.ok) {
        const data = await response.json();
        setRecipe(data);
      }
    } catch (error) {
      console.error('Failed to fetch recipe:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!recipe || purchasing) return;

    if (recipe.requiresAuth) {
      alert('구매하려면 로그인이 필요합니다.');
      return;
    }

    setPurchasing(true);
    try {
      const response = await fetch(`/api/recipes/${recipeId}/purchase`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchRecipe();
        onPurchaseSuccess?.();
        alert('레시피를 성공적으로 구매했습니다!');
      } else {
        const error = await response.json();
        if (error.error === 'Insufficient credits') {
          alert('크레딧이 부족합니다. 충전 후 다시 시도해주세요.');
        } else {
          alert('구매 중 오류가 발생했습니다.');
        }
      }
    } catch (error) {
      alert('구매 중 오류가 발생했습니다.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">로딩중...</div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">레시피를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded">
                  {recipe.category}
                </span>
                {recipe.isPurchased && (
                  <span className="text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded flex items-center gap-1">
                    <FaUnlock className="w-3.5 h-3.5" />
                    구매완료
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {recipe.title}
              </h1>
            </div>
            {!recipe.isPurchased && (
              <div className="text-right">
                <div className="flex items-center gap-2 text-2xl font-bold text-yellow-600 mb-2">
                  <FaCoins className="w-6 h-6" />
                  <span>{recipe.price_credits} 크레딧</span>
                </div>
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaLock className="w-4 h-4" />
                  {purchasing ? '구매중...' : '구매하기'}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <div className="flex items-center gap-1">
              <FaEye className="w-4 h-4" />
              <span>조회 {recipe.view_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <FaShoppingCart className="w-4 h-4" />
              <span>구매 {recipe.purchase_count}</span>
            </div>
          </div>

          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {recipe.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            {recipe.isPurchased && recipe.content ? (
              <>
                <div className="prose dark:prose-invert max-w-none mb-8">
                  <ReactMarkdown>{recipe.content}</ReactMarkdown>
                </div>
                
                {recipe.agency_contact && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      대행사 연락처
                    </h3>
                    <div className="space-y-3">
                      {recipe.agency_contact.name && (
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600 dark:text-gray-400 w-20">업체명</span>
                          <span className="font-medium">{recipe.agency_contact.name}</span>
                        </div>
                      )}
                      {recipe.agency_contact.phone && (
                        <div className="flex items-center gap-3">
                          <FaPhone className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="font-medium">{recipe.agency_contact.phone}</span>
                        </div>
                      )}
                      {recipe.agency_contact.email && (
                        <div className="flex items-center gap-3">
                          <FaEnvelope className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="font-medium">{recipe.agency_contact.email}</span>
                        </div>
                      )}
                      {recipe.agency_contact.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                          {recipe.agency_contact.description}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <FaLock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  요약
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                  {recipe.summary}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  전체 내용을 보려면 구매가 필요합니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}