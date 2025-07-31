'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { CreditRechargeModal } from '@/components/credits/CreditRechargeModal';

interface PaymentRequest {
  id: string;
  amount: number;
  credit_amount: number;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
  confirmed_at?: string;
  depositor_name: string;
  bank_name: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRechargeModal, setShowRechargeModal] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payment/request');
      if (response.ok) {
        const data = await response.json();
        setPayments(data.requests || []);
      } else {
        console.error('Failed to fetch payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
            <Clock className="w-3 h-3 mr-1" />
            입금 대기중
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge variant="outline" className="bg-success/20 text-success border-success/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            입금 확인
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">
            <XCircle className="w-3 h-3 mr-1" />
            입금 거부
          </Badge>
        );
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
      <div className="min-h-screen bg-background-base flex items-center justify-center">
        <div className="text-text-primary">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-base">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="border-border-primary text-text-secondary hover:text-text-primary">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  대시보드
                </Button>
              </Link>
            </div>
            <Button 
              onClick={() => setShowRechargeModal(true)}
              className="bg-brand-primary text-text-primary hover:bg-brand-primaryLight"
            >
              <Plus className="w-4 h-4 mr-2" />
              크레딧 충전
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-text-primary">결제 내역</h1>
          <p className="text-text-secondary mt-1">크레딧 충전 요청 및 결제 상태를 확인하세요</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-background-elevated border-border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">총 결제 요청</CardTitle>
              <div className="text-text-muted">💳</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">{payments.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-background-elevated border-border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">입금 대기중</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {payments.filter(p => p.status === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background-elevated border-border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">입금 확인</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {payments.filter(p => p.status === 'confirmed').length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background-elevated border-border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">총 충전 크레딧</CardTitle>
              <div className="text-brand-primary">🪙</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {payments
                  .filter(p => p.status === 'confirmed')
                  .reduce((sum, p) => sum + p.credit_amount, 0)
                } 크레딧
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card className="bg-background-elevated border-border-primary">
          <CardHeader>
            <CardTitle className="text-text-primary">결제 요청 목록</CardTitle>
            <CardDescription className="text-text-secondary">
              크레딧 충전 요청 내역과 결제 상태를 확인할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-text-secondary text-lg mb-4">결제 요청 내역이 없습니다</div>
                <p className="text-text-muted mb-6">크레딧을 충전하여 서비스를 이용해보세요</p>
                <Button 
                  onClick={() => setShowRechargeModal(true)}
                  className="bg-brand-primary text-text-primary hover:bg-brand-primaryLight"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  첫 크레딧 충전하기
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border-primary">
                      <TableHead className="text-text-secondary">요청일시</TableHead>
                      <TableHead className="text-text-secondary">입금액</TableHead>
                      <TableHead className="text-text-secondary">크레딧</TableHead>
                      <TableHead className="text-text-secondary">입금자명</TableHead>
                      <TableHead className="text-text-secondary">은행</TableHead>
                      <TableHead className="text-text-secondary">상태</TableHead>
                      <TableHead className="text-text-secondary">확인일시</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id} className="border-border-primary">
                        <TableCell className="text-text-primary">
                          {formatDate(payment.created_at)}
                        </TableCell>
                        <TableCell className="font-medium text-text-primary">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell className="text-brand-primary font-semibold">
                          {payment.credit_amount} 크레딧
                        </TableCell>
                        <TableCell className="text-text-primary">
                          {payment.depositor_name}
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {payment.bank_name}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-text-secondary">
                          {payment.confirmed_at ? formatDate(payment.confirmed_at) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bank Account Info */}
        <Card className="bg-background-elevated border-border-primary mt-8">
          <CardHeader>
            <CardTitle className="text-text-primary">입금 계좌 정보</CardTitle>
            <CardDescription className="text-text-secondary">
              아래 계좌로 입금하시면 관리자 확인 후 크레딧이 지급됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-text-secondary">은행명</span>
                  <div className="font-semibold text-text-primary">국민은행</div>
                </div>
                <div>
                  <span className="text-text-secondary">계좌번호</span>
                  <div className="font-semibold text-text-primary">564701-01-540185</div>
                </div>
                <div>
                  <span className="text-text-secondary">예금주</span>
                  <div className="font-semibold text-text-primary">박성빈(기브니즈)</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Recharge Modal */}
      <CreditRechargeModal
        isOpen={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
        onSuccess={() => {
          fetchPayments(); // 결제 목록 새로고침
        }}
      />
    </div>
  );
}