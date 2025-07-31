'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  TrendingUp, 
  TrendingDown, 
  Minus,
  Eye,
  Star,
  Bookmark,
  Lock,
  BarChart3,
  Calendar,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AnalysisPageProps {
  params: Promise<{ keyword: string }>;
}

interface PlaceAnalysis {
  id: string;
  place_name: string;
  current_rank: number;
  previous_rank: number;
  review_count: number;
  bookmark_count: number;
  rating: number;
  has_recipe: boolean;
  recipe_summary?: string;
  rank_history: Array<{
    rank: number;
    date: string;
    review_count: number;
  }>;
}

export default function AnalysisPage({ params }: AnalysisPageProps) {
  const [keyword, setKeyword] = useState<string>('');
  const [places, setPlaces] = useState<PlaceAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecipeModal, setShowRecipeModal] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setKeyword(decodeURIComponent(resolvedParams.keyword));
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (keyword) {
      fetchAnalysisData();
    }
  }, [keyword]);

  const fetchAnalysisData = async () => {
    try {
      // 실제 API에서는 키워드별 분석 데이터를 가져와야 함
      // 현재는 샘플 데이터로 구현
      const sampleData: PlaceAnalysis[] = [
        {
          id: '1',
          place_name: '스타벅스 강남점',
          current_rank: 1,
          previous_rank: 3,
          review_count: 1250,
          bookmark_count: 89,
          rating: 4.3,
          has_recipe: true,
          recipe_summary: '리뷰 관리를 통한 상위 노출 전략',
          rank_history: [
            { rank: 3, date: '2024-01-01', review_count: 1100 },
            { rank: 2, date: '2024-01-08', review_count: 1180 },
            { rank: 1, date: '2024-01-15', review_count: 1250 },
          ]
        },
        {
          id: '2', 
          place_name: '투썸플레이스 강남역점',
          current_rank: 2,
          previous_rank: 2,
          review_count: 980,
          bookmark_count: 65,
          rating: 4.1,
          has_recipe: false,
          rank_history: [
            { rank: 2, date: '2024-01-01', review_count: 950 },
            { rank: 2, date: '2024-01-08', review_count: 965 },
            { rank: 2, date: '2024-01-15', review_count: 980 },
          ]
        },
        {
          id: '3',
          place_name: '카페베네 강남점',
          current_rank: 5,
          previous_rank: 1,
          review_count: 750,
          bookmark_count: 42,
          rating: 3.9,
          has_recipe: true,
          recipe_summary: '포스팅 활동을 통한 브랜드 인지도 상승',
          rank_history: [
            { rank: 1, date: '2024-01-01', review_count: 800 },
            { rank: 3, date: '2024-01-08', review_count: 775 },
            { rank: 5, date: '2024-01-15', review_count: 750 },
          ]
        }
      ];
      
      setPlaces(sampleData);
    } catch (error) {
      console.error('Error fetching analysis data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankChange = (current: number, previous: number) => {
    return previous - current; // 순위가 올라가면 양수
  };

  const getRankChangeIcon = (current: number, previous: number) => {
    const change = getRankChange(current, previous);
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getRankChangeText = (current: number, previous: number) => {
    const change = getRankChange(current, previous);
    if (change > 0) return `+${change}`;
    if (change < 0) return `${change}`;
    return '±0';
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/tracking">
              <Button variant="outline" size="sm" className="border-border-primary text-text-secondary hover:text-text-primary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                순위 추적으로
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-text-primary">순위 비교 분석</h1>
          <p className="text-text-secondary mt-1">
            <span className="text-brand-primary font-semibold">"{keyword}"</span> 키워드의 플레이스별 상세 분석
          </p>
        </div>

        {/* Analysis Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-background-elevated border-border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">분석 플레이스</CardTitle>
              <MapPin className="h-4 w-4 text-brand-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">{places.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-background-elevated border-border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">성공 레시피 보유</CardTitle>
              <Eye className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {places.filter(p => p.has_recipe).length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background-elevated border-border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">평균 리뷰수</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {Math.round(places.reduce((sum, p) => sum + p.review_count, 0) / places.length).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background-elevated border-border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">상승 플레이스</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {places.filter(p => getRankChange(p.current_rank, p.previous_rank) > 0).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Places Comparison */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">플레이스별 상세 분석</h2>
          
          {places.map((place, index) => (
            <Card key={place.id} className="bg-background-elevated border-border-primary">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Basic Info & Stats */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-brand-primary">
                            {place.current_rank}위
                          </div>
                          <div className="flex items-center justify-center space-x-1 text-sm">
                            {getRankChangeIcon(place.current_rank, place.previous_rank)}
                            <span className={`font-medium ${
                              getRankChange(place.current_rank, place.previous_rank) > 0 
                                ? 'text-green-500' 
                                : getRankChange(place.current_rank, place.previous_rank) < 0 
                                  ? 'text-red-500' 
                                  : 'text-gray-500'
                            }`}>
                              {getRankChangeText(place.current_rank, place.previous_rank)}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-text-primary">
                            {place.place_name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-text-secondary mt-1">
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span>{place.rating}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="w-4 h-4" />
                              <span>리뷰 {place.review_count.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Bookmark className="w-4 h-4" />
                              <span>저장 {place.bookmark_count}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rank History Mini Chart */}
                    <div className="bg-background-base p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-text-secondary mb-3">순위 변화 추이</h4>
                      <div className="flex items-end space-x-2 h-20">
                        {place.rank_history.map((history, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center">
                            <div 
                              className="bg-brand-primary rounded-t w-full"
                              style={{ 
                                height: `${Math.max(20, (10 - history.rank) * 8)}px`,
                                minHeight: '8px'
                              }}
                            />
                            <div className="text-xs text-text-secondary mt-1">
                              {history.rank}위
                            </div>
                            <div className="text-xs text-text-muted">
                              {new Date(history.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Recipe Info */}
                  <div>
                    <div className="bg-background-base p-4 rounded-lg h-full">
                      {place.has_recipe ? (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-text-primary flex items-center space-x-2">
                              <Eye className="w-4 h-4 text-green-500" />
                              <span>성공 레시피 보유</span>
                            </h4>
                            <Badge variant="outline" className="text-green-500 border-green-500">
                              분석 가능
                            </Badge>
                          </div>
                          
                          <div className="mb-4">
                            <p className="text-text-secondary text-sm mb-3">
                              이 플레이스의 상위 노출 전략과 작업 내역을 확인할 수 있습니다.
                            </p>
                            <div className="bg-brand-primary/10 border border-brand-primary/20 p-3 rounded">
                              <p className="text-text-primary text-sm">
                                📝 {place.recipe_summary}
                              </p>
                            </div>
                          </div>

                          <Button 
                            className="w-full bg-brand-primary text-white hover:bg-brand-primaryLight"
                            onClick={() => router.push(`/recipes?keyword=${encodeURIComponent(keyword)}&place=${place.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            상세 레시피 보기 (1 크레딧)
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Lock className="w-12 h-12 text-text-muted mx-auto mb-3" />
                          <h4 className="font-medium text-text-secondary mb-2">
                            레시피 정보 없음  
                          </h4>
                          <p className="text-text-muted text-sm mb-4">
                            이 플레이스의 마케팅 전략 정보가 <br />
                            아직 수집되지 않았습니다.
                          </p>
                          <Badge variant="outline" className="text-text-muted border-border-primary">
                            분석 불가
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <Card className="bg-brand-primary/10 border border-brand-primary/20 mt-8">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              더 많은 성공 레시피를 확인해보세요
            </h3>
            <p className="text-text-secondary mb-4">
              다양한 업종별 상위 노출 전략과 실제 적용 사례를 만나보세요
            </p>
            <Link href="/recipes">
              <Button className="bg-brand-primary text-white hover:bg-brand-primaryLight">
                <BarChart3 className="w-4 h-4 mr-2" />
                전체 레시피 둘러보기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}