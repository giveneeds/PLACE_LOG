'use client';

import { useState, useEffect } from 'react';
import { FaCoins, FaEye, FaShoppingCart, FaFilter, FaSearch } from 'react-icons/fa';

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

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['전체', '카페', '음식점', '병원', '미용실', '기타'];

  useEffect(() => {
    fetchRecipes();
  }, [selectedCategory]);

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
          <h1 className="text-display-large text-text-primary mb-4">
            마케팅 레시피 마켓플레이스
          </h1>
          <p className="text-text-secondary text-lg">
            검증된 마케팅 전략과 실무 노하우를 크레딧으로 구매하세요
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
                    {recipe.isPurchased && (
                      <span className="bg-success/20 text-success px-2 py-1 rounded text-sm font-medium">
                        구매완료
                      </span>
                    )}
                  </div>
                  <h3 className="text-text-primary font-semibold text-lg mb-2 line-clamp-2">
                    {recipe.title}
                  </h3>
                  <p className="text-text-secondary text-sm line-clamp-3">
                    {recipe.summary}
                  </p>
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
                  <button className="text-text-secondary hover:text-brand-primary text-sm font-medium">
                    자세히 보기 →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}