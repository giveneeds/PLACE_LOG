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
          bankName: '신한은행'
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
      <div className="bg-dark-elevated2 rounded-xl max-w-lg w-full p-6 relative border border-gray-800 shadow-overlay">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <FaTimes className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
          <FaCoins className="text-primary" />
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
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {pkg.credits} 크레딧
                      </div>
                      {pkg.discount && (
                        <div className="text-sm text-green-600 dark:text-green-400">
                          {pkg.discount}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {pkg.price.toLocaleString()}원
                  </div>
                </label>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                입금자명
              </label>
              <input
                type="text"
                value={depositorName}
                onChange={(e) => setDepositorName(e.target.value)}
                placeholder="실제 입금하실 분의 성함"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '처리중...' : '무통장 입금 요청'}
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">입금 정보</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">은행명</span>
                  <span className="font-medium">신한은행</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">계좌번호</span>
                  <span className="font-medium">110-123-456789</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">예금주</span>
                  <span className="font-medium">플레이스로그</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">입금액</span>
                  <span className="font-bold text-lg text-blue-600">
                    {PACKAGES.find(p => p.credits === selectedPackage)?.price.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ 반드시 등록하신 입금자명(<strong>{depositorName}</strong>)으로 입금해주세요.
                입금 확인 후 크레딧이 자동으로 충전됩니다.
              </p>
            </div>

            <button
              onClick={() => {
                onClose();
                onSuccess?.();
              }}
              className="w-full py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}