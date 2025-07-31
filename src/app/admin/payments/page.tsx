'use client';

import { useState, useEffect } from 'react';
import { AdminOnly } from '@/components/auth/role-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface PaymentRequest {
  id: string;
  user_id: string;
  amount: number;
  credit_amount: number;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
  confirmed_at?: string;
  user_email?: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/admin/payments');
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      } else {
        console.error('Failed to fetch payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId: string, status: 'confirmed' | 'rejected') => {
    setProcessing(paymentId);
    try {
      const response = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: paymentId,
          status,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: status === 'confirmed' ? '입금 확인 완료' : '입금 거부 완료',
          description: data.message,
        });
        fetchPayments(); // 목록 새로고침
      } else {
        toast({
          title: '처리 실패',
          description: data.error || '처리 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: '처리 실패',
        description: '네트워크 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50"><Clock className="w-3 h-3 mr-1" />대기중</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-50"><CheckCircle className="w-3 h-3 mr-1" />승인</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50"><XCircle className="w-3 h-3 mr-1" />거부</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

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
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                관리자 대시보드
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">결제 관리</h1>
          <p className="text-gray-600 mt-1">무통장 입금 확인 및 크레딧 지급</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">대기중</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {payments.filter(p => p.status === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">승인완료</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {payments.filter(p => p.status === 'confirmed').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">거부</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {payments.filter(p => p.status === 'rejected').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 수익</CardTitle>
              <div className="text-green-600">₩</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  payments
                    .filter(p => p.status === 'confirmed')
                    .reduce((sum, p) => sum + p.amount, 0)
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>결제 요청 목록</CardTitle>
            <CardDescription>
              무통장 입금 요청 목록과 처리 상태를 확인할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                결제 요청이 없습니다.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>사용자</TableHead>
                    <TableHead>입금액</TableHead>
                    <TableHead>크레딧</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>요청일시</TableHead>
                    <TableHead>처리일시</TableHead>
                    <TableHead>액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.user_email || payment.user_id.slice(0, 8) + '...'}
                      </TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{payment.credit_amount} 크레딧</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>{formatDate(payment.created_at)}</TableCell>
                      <TableCell>
                        {payment.confirmed_at ? formatDate(payment.confirmed_at) : '-'}
                      </TableCell>
                      <TableCell>
                        {payment.status === 'pending' && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => updatePaymentStatus(payment.id, 'confirmed')}
                              disabled={processing === payment.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              승인
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updatePaymentStatus(payment.id, 'rejected')}
                              disabled={processing === payment.id}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              거부
                            </Button>
                          </div>
                        )}
                        {payment.status !== 'pending' && (
                          <span className="text-sm text-gray-500">처리완료</span>
                        )}
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