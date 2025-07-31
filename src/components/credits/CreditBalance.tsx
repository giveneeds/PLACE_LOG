'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FaCoins } from 'react-icons/fa';

interface CreditBalanceProps {
  onRechargeClick?: () => void;
  className?: string;
}

export function CreditBalance({ onRechargeClick, className = '' }: CreditBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchBalance();
    
    // 실시간 구독
    const channel = supabase
      .channel('credit-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_credits'
      }, () => {
        fetchBalance();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/credits');
      if (response.ok) {
        const data = await response.json();
        setBalance(data.credits?.balance || 0);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <FaCoins className="w-5 h-5 text-yellow-500 animate-pulse" />
        <span className="text-gray-500">로딩중...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2 bg-dark-elevated2 px-3 py-2 rounded-lg border border-gray-800">
        <FaCoins className="w-5 h-5 text-primary" />
        <span className="font-semibold text-white">
          {balance !== null ? balance.toLocaleString() : '0'} 크레딧
        </span>
      </div>
      {onRechargeClick && (
        <button
          onClick={onRechargeClick}
          className="px-4 py-2 bg-primary text-white rounded-pill hover:bg-primary-light hover:scale-[1.02] active:scale-[0.98] transition-all duration-normal text-sm font-semibold"
        >
          충전하기
        </button>
      )}
    </div>
  );
}