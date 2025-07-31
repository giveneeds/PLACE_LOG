'use client';

import { useState } from 'react';
import { FaCoins, FaEye, FaShoppingCart, FaLock } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface RecipeCardProps {
  id: string;
  title: string;
  summary: string;
  priceCredits: number;
  category: string;
  tags: string[];
  viewCount: number;
  purchaseCount: number;
  isPurchased: boolean;
  onPurchaseClick?: (id: string) => void;
}

export function RecipeCard({
  id,
  title,
  summary,
  priceCredits,
  category,
  tags,
  viewCount,
  purchaseCount,
  isPurchased,
  onPurchaseClick
}: RecipeCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    router.push(`/recipes/${id}`);
  };

  const handlePurchase = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPurchaseClick?.(id);
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer border border-gray-200 dark:border-gray-700 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                {category}
              </span>
              {isPurchased && (
                <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                  구매완료
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {title}
            </h3>
          </div>
          {!isPurchased && (
            <div className="flex items-center gap-1 text-yellow-600 font-bold">
              <FaCoins className="w-4 h-4" />
              <span>{priceCredits}</span>
            </div>
          )}
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
          {summary}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
              >
                #{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <FaEye className="w-3.5 h-3.5" />
              <span>{viewCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <FaShoppingCart className="w-3.5 h-3.5" />
              <span>{purchaseCount}</span>
            </div>
          </div>
          
          {!isPurchased && isHovered && (
            <button
              onClick={handlePurchase}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaLock className="w-3.5 h-3.5" />
              구매하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}