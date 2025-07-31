'use client';

import { useState, useEffect } from 'react';
import { AdminOnly } from '@/components/auth/role-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  ArrowLeft,
  BookOpen,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface Recipe {
  id: string;
  title: string;
  summary: string;
  content: string;
  price_credits: number;
  category: string;
  tags: string[];
  view_count: number;
  purchase_count: number;
  is_active: boolean;
  created_at: string;
  agency_contact?: string;
}

export default function AdminRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    price_credits: 1,
    category: '',
    tags: '',
    agency_contact: '',
  });
  const { toast } = useToast();

  const categories = ['카페', '음식점', '병원', '미용실', '기타'];

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await fetch('/api/recipes?limit=100');
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes || []);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const recipeData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      price_credits: Number(formData.price_credits),
    };

    try {
      const response = await fetch('/api/admin/recipes', {
        method: editingRecipe ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingRecipe ? { ...recipeData, id: editingRecipe.id } : recipeData),
      });

      if (response.ok) {
        toast({
          title: editingRecipe ? '레시피 수정 완료' : '레시피 등록 완료',
          description: '레시피가 성공적으로 저장되었습니다.',
        });
        setShowCreateDialog(false);
        setEditingRecipe(null);
        resetForm();
        fetchRecipes();
      } else {
        const data = await response.json();
        toast({
          title: '저장 실패',
          description: data.error || '저장 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast({
        title: '저장 실패',
        description: '네트워크 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setFormData({
      title: recipe.title,
      summary: recipe.summary,
      content: recipe.content,
      price_credits: recipe.price_credits,
      category: recipe.category,
      tags: recipe.tags.join(', '),
      agency_contact: recipe.agency_contact || '',
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (recipeId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch('/api/admin/recipes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: recipeId }),
      });

      if (response.ok) {
        toast({
          title: '삭제 완료',
          description: '레시피가 삭제되었습니다.',
        });
        fetchRecipes();
      } else {
        toast({
          title: '삭제 실패',
          description: '삭제 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast({
        title: '삭제 실패',
        description: '네트워크 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      summary: '',
      content: '',
      price_credits: 1,
      category: '',
      tags: '',
      agency_contact: '',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const totalViews = recipes.reduce((sum, recipe) => sum + recipe.view_count, 0);
  const totalPurchases = recipes.reduce((sum, recipe) => sum + recipe.purchase_count, 0);
  const totalRevenue = recipes.reduce((sum, recipe) => sum + (recipe.price_credits * recipe.purchase_count), 0);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  return (
    <AdminOnly fallback={
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">접근 권한이 없습니다</h2>
              <p className="text-gray-600 mb-4">관리자만 접근할 수 있는 페이지입니다.</p>
              <Link href="/dashboard">
                <Button>대시보드로 돌아가기</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  관리자 대시보드
                </Button>
              </Link>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingRecipe(null); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  새 레시피 등록
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingRecipe ? '레시피 수정' : '새 레시피 등록'}
                  </DialogTitle>
                  <DialogDescription>
                    마케팅 레시피 정보를 입력해주세요.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">제목</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">카테고리</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">선택해주세요</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="price_credits">가격 (크레딧)</Label>
                    <Input
                      id="price_credits"
                      type="number"
                      min="1"
                      value={formData.price_credits}
                      onChange={(e) => setFormData({ ...formData, price_credits: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="마케팅, 네이버플레이스, 상위노출"
                    />
                  </div>
                  <div>
                    <Label htmlFor="summary">요약</Label>
                    <Textarea
                      id="summary"
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">상세 내용 (마크다운)</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={10}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="agency_contact">대행사 연락처</Label>
                    <Textarea
                      id="agency_contact"
                      value={formData.agency_contact}
                      onChange={(e) => setFormData({ ...formData, agency_contact: e.target.value })}
                      rows={4}
                      placeholder="대행사 정보와 연락처를 입력해주세요"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                      취소
                    </Button>
                    <Button type="submit">
                      {editingRecipe ? '수정' : '등록'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <h1 className="text-3xl font-bold">레시피 관리</h1>
          <p className="text-gray-600 mt-1">마케팅 레시피 등록, 수정, 삭제</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 레시피</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recipes.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 조회수</CardTitle>
              <Eye className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 판매수</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPurchases}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 수익</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRevenue} 크레딧</div>
            </CardContent>
          </Card>
        </div>

        {/* Recipes Table */}
        <Card>
          <CardHeader>
            <CardTitle>레시피 목록</CardTitle>
            <CardDescription>
              등록된 모든 레시피를 관리할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recipes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                등록된 레시피가 없습니다.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>가격</TableHead>
                    <TableHead>조회수</TableHead>
                    <TableHead>판매수</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead>액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipes.map((recipe) => (
                    <TableRow key={recipe.id}>
                      <TableCell className="font-medium max-w-xs">
                        <div className="truncate">{recipe.title}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{recipe.category}</Badge>
                      </TableCell>
                      <TableCell>{recipe.price_credits} 크레딧</TableCell>
                      <TableCell>{recipe.view_count}</TableCell>
                      <TableCell>{recipe.purchase_count}</TableCell>
                      <TableCell>
                        <Badge variant={recipe.is_active ? "default" : "secondary"}>
                          {recipe.is_active ? '활성' : '비활성'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(recipe.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/recipes/${recipe.id}`, '_blank')}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(recipe)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(recipe.id)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminOnly>
  );
}