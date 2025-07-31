'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaCoins, FaEye, FaShoppingCart, FaFilter, FaSearch, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

interface Recipe {
  id: string;
  title: string;
  summary: string;
  price_credits: number;
  category: string;
  tags: string[];
  view_count: number;
  purchase_count: number;
  isPurchased: boolean;
  created_at: string;
}

function RecipesContent() {
  const searchParams = useSearchParams();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // URL 파라미터에서 키워드와 플레이스 정보 가져오기
  const urlKeyword = searchParams.get('keyword');
  const urlPlace = searchParams.get('place');

  const categories = ['전체', '카페', '음식점', '병원', '미용실', '기타'];

  useEffect(() => {
    // URL에 키워드가 있으면 검색어로 설정
    if (urlKeyword) {
      setSearchTerm(urlKeyword);
    }
    fetchRecipes();
  }, [selectedCategory, urlKeyword]);

  const fetchRecipes = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== '전체') {
        params.append('category', selectedCategory);
      }
      
      const response = await fetch(`/api/recipes?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setRecipes(data.recipes || []);
      } else {
        console.error('Failed to fetch recipes:', data.error);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRecipeClick = (recipeId: string) => {
    window.location.href = `/recipes/${recipeId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-base flex items-center justify-center">
        <div className="text-text-primary">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-base">
      {/* Header */}
      <div className="bg-background-elevated border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {urlKeyword && (
            <div className="flex items-center space-x-4 mb-4">
              <Link href="/tracking">
                <button className="flex items-center space-x-2 text-text-secondary hover:text-brand-primary transition-colors">
                  <FaArrowLeft />
                  <span>순위 추적으로 돌아가기</span>
                </button>
              </Link>
            </div>
          )}
          <h1 className="text-display-large text-text-primary mb-4">
            {urlKeyword ? (
              <>
                <span className="text-brand-primary">"{urlKeyword}"</span> 관련 마케팅 레시피
              </>
            ) : (
              '마케팅 레시피 마켓플레이스'
            )}
          </h1>
          <p className="text-text-secondary text-lg">
            {urlKeyword ? (
              <>해당 키워드와 관련된 검증된 마케팅 전략을 확인하세요</>
            ) : (
              <>검증된 마케팅 전략과 실무 노하우를 크레딧으로 구매하세요</>
            )}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="레시피 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background-elevated border border-border-primary rounded-lg pl-12 pr-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-brand-primary"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <FaFilter className="text-text-secondary mt-2 mr-2" />
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category === '전체' ? '' : category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  (selectedCategory === '' && category === '전체') || selectedCategory === category
                    ? 'bg-brand-primary text-text-primary'
                    : 'bg-background-elevated border border-border-primary text-text-secondary hover:text-text-primary hover:border-brand-primary'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Recipe Grid */}
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-text-secondary text-lg mb-4">레시피가 없습니다</div>
            <p className="text-text-muted">다른 카테고리를 선택하거나 검색어를 변경해보세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => handleRecipeClick(recipe.id)}
                className="bg-background-elevated border border-border-primary rounded-lg p-6 hover:border-brand-primary transition-all duration-200 cursor-pointer hover:shadow-lg"
              >
                {/* Recipe Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-brand-primary/20 text-brand-primary px-2 py-1 rounded text-sm font-medium">
                      {recipe.category}
                    </span>
                    <div className="flex items-center space-x-2">
                      {recipe.isPurchased ? (
                        <span className="bg-success/20 text-success px-2 py-1 rounded text-sm font-medium flex items-center space-x-1">
                          <FaEye className="text-xs" />
                          <span>구매완료</span>
                        </span>
                      ) : (
                        <span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-sm font-medium flex items-center space-x-1">
                          <FaCoins className="text-xs" />
                          <span>프리미엄</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="text-text-primary font-semibold text-lg mb-2 line-clamp-2">
                    {recipe.title}
                  </h3>
                  <p className="text-text-secondary text-sm line-clamp-3">
                    {recipe.summary}
                  </p>
                  {!recipe.isPurchased && (
                    <div className="mt-3 p-2 bg-brand-primary/10 border border-brand-primary/20 rounded text-xs">
                      <p className="text-brand-primary font-medium">💡 이 레시피로 얻을 수 있는 것:</p>
                      <p className="text-text-secondary mt-1">검증된 상위 노출 전략 • 단계별 실행 가이드 • 실제 성과 데이터</p>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {recipe.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="bg-background-base text-text-muted px-2 py-1 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                      {recipe.tags.length > 3 && (
                        <span className="text-text-muted text-xs">
                          +{recipe.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-text-secondary mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <FaEye className="text-xs" />
                      <span>{recipe.view_count}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FaShoppingCart className="text-xs" />
                      <span>{recipe.purchase_count}</span>
                    </div>
                  </div>
                  <div className="text-text-muted text-xs">
                    {new Date(recipe.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-brand-primary font-semibold">
                    <FaCoins />
                    <span>{recipe.price_credits} 크레딧</span>
                  </div>
                  {recipe.isPurchased ? (
                    <button className="text-success hover:text-success/80 text-sm font-medium">
                      내용 보기 →
                    </button>
                  ) : (
                    <button className="text-brand-primary hover:text-brand-primaryLight text-sm font-medium">
                      미리보기 →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Conversion CTA Section */}
        {filteredRecipes.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-brand-primary/10 to-purple-500/10 border border-brand-primary/20 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              🚀 성공하는 플레이스들의 비밀을 알아보세요
            </h2>
            <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
              실제로 상위 노출을 달성한 플레이스들의 검증된 마케팅 전략을 확인하고, 
              당신의 비즈니스에도 동일한 성과를 만들어보세요.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-background-elevated border border-border-primary rounded-lg p-4">
                <div className="text-2xl font-bold text-brand-primary mb-2">95%</div>
                <div className="text-sm text-text-secondary">평균 순위 상승률</div>
              </div>
              <div className="bg-background-elevated border border-border-primary rounded-lg p-4">
                <div className="text-2xl font-bold text-brand-primary mb-2">30일</div>
                <div className="text-sm text-text-secondary">평균 효과 발현 기간</div>
              </div>
              <div className="bg-background-elevated border border-border-primary rounded-lg p-4">
                <div className="text-2xl font-bold text-brand-primary mb-2">{filteredRecipes.filter(r => !r.isPurchased).length}+</div>
                <div className="text-sm text-text-secondary">검증된 성공 레시피</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-brand-primary hover:bg-brand-primaryLight text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <FaCoins />
                <span>크레딧 충전하고 시작하기</span>
              </button>
              <button
                onClick={() => window.location.href = '/tracking'}
                className="bg-background-base border border-border-primary text-text-secondary hover:text-text-primary px-8 py-3 rounded-lg font-medium transition-colors"
              >
                순위 추적부터 시작하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background-base flex items-center justify-center">
        <div className="text-text-primary">로딩 중...</div>
      </div>
    }>
      <RecipesContent />
    </Suspense>
  );
}