'use client';

import { useState } from 'react';
import { FaCoins, FaTimes } from 'react-icons/fa';

interface CreditPackage {
  credits: number;
  price: number;
  discount?: string;
}

const PACKAGES: CreditPackage[] = [
  { credits: 10, price: 100000 },
  { credits: 50, price: 450000, discount: '10% 할인' },
  { credits: 100, price: 850000, discount: '15% 할인' }
];

interface CreditRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreditRechargeModal({ isOpen, onClose, onSuccess }: CreditRechargeModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<number>(50);
  const [depositorName, setDepositorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBankInfo, setShowBankInfo] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!depositorName.trim()) {
      alert('입금자명을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/payment/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageType: selectedPackage.toString(),
          depositorName,
          bankName: '국민은행'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setShowBankInfo(true);
      } else {
        throw new Error('결제 요청 실패');
      }
    } catch (error) {
      alert('결제 요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-background-elevated rounded-xl max-w-lg w-full p-6 relative border border-border-primary shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors"
        >
          <FaTimes className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-text-primary">
          <FaCoins className="text-brand-primary" />
          크레딧 충전
        </h2>

        {!showBankInfo ? (
          <>
            <div className="space-y-3 mb-6">
              {PACKAGES.map((pkg) => (
                <label
                  key={pkg.credits}
                  className={`
                    flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${selectedPackage === pkg.credits 
                      ? 'border-brand-primary bg-brand-primary/10' 
                      : 'border-border-primary hover:border-brand-primary/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="package"
                      value={pkg.credits}
                      checked={selectedPackage === pkg.credits}
                      onChange={(e) => setSelectedPackage(Number(e.target.value))}
                      className="w-4 h-4 text-brand-primary"
                    />
                    <div>
                      <div className="font-semibold text-text-primary">
                        {pkg.credits} 크레딧
                      </div>
                      {pkg.discount && (
                        <div className="text-sm text-success">
                          {pkg.discount}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-text-primary">
                    {pkg.price.toLocaleString()}원
                  </div>
                </label>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                입금자명
              </label>
              <input
                type="text"
                value={depositorName}
                onChange={(e) => setDepositorName(e.target.value)}
                placeholder="실제 입금하실 분의 성함"
                className="w-full px-4 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-background-base text-text-primary placeholder-text-muted"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 bg-brand-primary text-text-primary rounded-lg font-medium hover:bg-brand-primaryLight transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '처리중...' : '무통장 입금 요청'}
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 text-text-primary">입금 정보</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">은행명</span>
                  <span className="font-medium text-text-primary">국민은행</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">계좌번호</span>
                  <span className="font-medium text-text-primary">564701-01-540185</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">예금주</span>
                  <span className="font-medium text-text-primary">박성빈(기브니즈)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">입금액</span>
                  <span className="font-bold text-lg text-brand-primary">
                    {PACKAGES.find(p => p.credits === selectedPackage)?.price.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg">
              <p className="text-sm text-warning">
                ⚠️ 반드시 등록하신 입금자명(<strong className="text-text-primary">{depositorName}</strong>)으로 입금해주세요.
                입금 확인 후 크레딧이 자동으로 충전됩니다.
              </p>
            </div>

            <button
              onClick={() => {
                onClose();
                onSuccess?.();
              }}
              className="w-full py-3 bg-background-base border border-border-primary text-text-primary rounded-lg font-medium hover:bg-background-elevated transition-colors"
            >
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}