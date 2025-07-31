'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  Filter,
  BarChart3,
  Eye,
  Star,
  MapPin,
  Calendar,
  Plus
} from 'lucide-react';
import Link from 'next/link';

interface TrackedPlace {
  id: string;
  place_name: string;
  place_url: string;
  search_keyword: string;
  is_active: boolean;
  created_at: string;
  latest_rank?: number;
  previous_rank?: number;
  review_count?: number;
  rating?: number;
  category?: string;
  address?: string;
  rankings?: Array<{
    rank: number;
    checked_at: string;
    review_count: number;
  }>;
}

interface Keyword {
  id: string;
  keyword: string;
  created_at: string;
  tracked_places: TrackedPlace[];
}

export default function TrackingPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKeyword, setSelectedKeyword] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rank' | 'change' | 'name'>('rank');

  useEffect(() => {
    fetchTrackedPlaces();
  }, []);

  const fetchTrackedPlaces = async () => {
    try {
      const response = await fetch('/api/admin/keywords');
      if (response.ok) {
        const { data } = await response.json();
        
        // Process keywords with ranking data
        const processedKeywords = data?.map((keyword: any) => ({
          ...keyword,
          tracked_places: keyword.tracked_places?.map((place: any) => {
            const rankings = place.rankings || [];
            const sortedRankings = rankings.sort((a: any, b: any) => 
              new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime()
            );
            
            return {
              ...place,
              latest_rank: sortedRankings[0]?.rank || null,
              previous_rank: sortedRankings[1]?.rank || null,
              review_count: sortedRankings[0]?.review_count || 0,
              rankings: sortedRankings.slice(0, 10) // 최근 10개만
            };
          }) || []
        })) || [];

        setKeywords(processedKeywords);
      }
    } catch (error) {
      console.error('Error fetching tracked places:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAllPlaces = () => {
    return keywords.flatMap(k => 
      k.tracked_places.map(place => ({
        ...place,
        keyword: k.keyword
      }))
    );
  };

  const getFilteredPlaces = () => {
    const allPlaces = getAllPlaces();
    
    let filtered = selectedKeyword === 'all' 
      ? allPlaces 
      : allPlaces.filter(place => place.keyword === selectedKeyword);

    // Sort places
    filtered = filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rank':
          return (a.latest_rank || 999) - (b.latest_rank || 999);
        case 'change':
          const changeA = getRankChange(a.latest_rank, a.previous_rank);
          const changeB = getRankChange(b.latest_rank, b.previous_rank);
          return changeB - changeA; // 순위 상승이 더 큰 것부터
        case 'name':
          return a.place_name.localeCompare(b.place_name);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getRankChange = (current?: number, previous?: number) => {
    if (!current || !previous) return 0;
    return previous - current; // 순위가 올라가면 양수
  };

  const getRankChangeIcon = (current?: number, previous?: number) => {
    const change = getRankChange(current, previous);
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getRankChangeText = (current?: number, previous?: number) => {
    const change = getRankChange(current, previous);
    if (change > 0) return `+${change}`;
    if (change < 0) return `${change}`;
    return '±0';
  };

  const getUniqueKeywords = () => {
    return keywords.map(k => k.keyword);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-base flex items-center justify-center">
        <div className="text-text-primary">로딩 중...</div>
      </div>
    );
  }

  const filteredPlaces = getFilteredPlaces();
  const totalPlaces = getAllPlaces().length;
  const activeKeywords = getUniqueKeywords().length;

  return (
    <div className="min-h-screen bg-background-base">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">내 플레이스 순위 추적</h1>
              <p className="text-text-secondary mt-1">등록된 플레이스들의 실시간 순위 변화를 확인하세요</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-background-elevated border-border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">총 추적 플레이스</CardTitle>
              <MapPin className="h-4 w-4 text-brand-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">{totalPlaces}</div>
            </CardContent>
          </Card>

          <Card className="bg-background-elevated border-border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">추적 키워드</CardTitle>
              <Search className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">{activeKeywords}</div>
            </CardContent>
          </Card>

          <Card className="bg-background-elevated border-border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">평균 순위</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {totalPlaces > 0 
                  ? Math.round(getAllPlaces().reduce((sum, place) => sum + (place.latest_rank || 0), 0) / totalPlaces)
                  : 0
                }위
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background-elevated border-border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">상승 중인 플레이스</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {getAllPlaces().filter(place => getRankChange(place.latest_rank, place.previous_rank) > 0).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <Card className="bg-background-elevated border-border-primary">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <Filter className="w-4 h-4 text-text-secondary" />
                  <select
                    value={selectedKeyword}
                    onChange={(e) => setSelectedKeyword(e.target.value)}
                    className="bg-background-base border border-border-primary rounded-lg px-3 py-2 text-text-primary"
                  >
                    <option value="all">모든 키워드</option>
                    {getUniqueKeywords().map(keyword => (
                      <option key={keyword} value={keyword}>{keyword}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary text-sm">정렬:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'rank' | 'change' | 'name')}
                    className="bg-background-base border border-border-primary rounded-lg px-3 py-2 text-text-primary"
                  >
                    <option value="rank">현재 순위</option>
                    <option value="change">순위 변화</option>
                    <option value="name">이름</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Places List */}
        {filteredPlaces.length === 0 ? (
          <Card className="bg-background-elevated border-border-primary">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-text-muted mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  추적 중인 플레이스가 없습니다
                </h3>
                <p className="text-text-secondary mb-6">
                  플레이스를 등록하면 실시간 순위 추적이 시작됩니다
                </p>
                <Link href="/search">
                  <Button className="bg-brand-primary text-white hover:bg-brand-primaryLight">
                    <Plus className="w-4 h-4 mr-2" />
                    첫 번째 플레이스 추가하기
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPlaces.map((place, index) => (
              <Card key={place.id} className="bg-background-elevated border-border-primary hover:border-brand-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    {/* Left: Rank and Place Info */}
                    <div className="flex items-center space-x-6">
                      {/* Rank Display */}
                      <div className="text-center">
                        <div className="text-3xl font-bold text-brand-primary">
                          {place.latest_rank || '?'}
                        </div>
                        <div className="text-xs text-text-secondary">순위</div>
                      </div>
                      
                      {/* Place Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-text-primary">
                            {place.place_name}
                          </h3>
                          <Badge variant="outline" className="text-text-secondary border-border-primary">
                            {place.keyword}
                          </Badge>
                          {!place.is_active && (
                            <Badge variant="outline" className="text-orange-500 border-orange-500">
                              비활성
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-text-secondary">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4" />
                            <span>리뷰 {place.review_count?.toLocaleString() || 0}개</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>등록: {new Date(place.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Rank Change and Actions */}
                    <div className="flex items-center space-x-6">
                      {/* Rank Change */}
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                          {getRankChangeIcon(place.latest_rank, place.previous_rank)}
                          <span className={`font-semibold ${
                            getRankChange(place.latest_rank, place.previous_rank) > 0 
                              ? 'text-green-500' 
                              : getRankChange(place.latest_rank, place.previous_rank) < 0 
                                ? 'text-red-500' 
                                : 'text-gray-500'
                          }`}>
                            {getRankChangeText(place.latest_rank, place.previous_rank)}
                          </span>
                        </div>
                        <div className="text-xs text-text-secondary">변화</div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Link href={`/dashboard/${place.id}`}>
                          <Button size="sm" variant="outline" className="border-border-primary text-text-secondary hover:text-text-primary">
                            <Eye className="w-4 h-4 mr-1" />
                            상세
                          </Button>
                        </Link>
                        <Link href={`/tracking/analysis/${encodeURIComponent(place.keyword)}`}>
                          <Button 
                            size="sm" 
                            className="bg-brand-primary text-white hover:bg-brand-primaryLight"
                          >
                            <BarChart3 className="w-4 h-4 mr-1" />
                            분석
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}