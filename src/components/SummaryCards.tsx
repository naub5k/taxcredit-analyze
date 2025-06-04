import React from 'react';
import { Card, CardContent } from './ui/card';
import { formatCurrency } from '../services/taxCreditService';

/**
 * 💰 SummaryCards v2.1 - IDE작업기준서 완전 반영
 * 4개 핵심 요약 카드: 총가능금액/즉시신청/신중검토/신청불가
 * 한헬스케어 예시 기준: 3.2억원 총계
 */

interface SummaryCardsProps {
  summary: {
    기간경과미신청: number;
    사후관리종료: number;
    사후관리진행중: number;
    총계: number;
  };
  executiveReport: {
    핵심요약: {
      총세액공제가능액: string;
      즉시신청추천액: string;
      신중검토필요액: string;
      신청불가액: string;
    };
  };
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, executiveReport }) => {
  // 카드 데이터 구성 (IDE작업기준서 기준)
  const cardData = [
    {
      icon: "💰",
      title: "총 가능금액",
      value: executiveReport.핵심요약.총세액공제가능액,
      amount: summary.총계,
      gradient: "from-blue-500 to-blue-600",
      description: "전체 세액공제 대상금액"
    },
    {
      icon: "💚",
      title: "즉시 신청", 
      value: executiveReport.핵심요약.즉시신청추천액,
      amount: summary.사후관리종료,
      gradient: "from-green-500 to-green-600",
      description: "사후관리 완료로 안전한 신청"
    },
    {
      icon: "⚠️",
      title: "신중 검토",
      value: executiveReport.핵심요약.신중검토필요액,
      amount: summary.사후관리진행중,
      gradient: "from-orange-500 to-orange-600", 
      description: "추징 위험 검토 필요"
    },
    {
      icon: "❌",
      title: "신청 불가",
      value: executiveReport.핵심요약.신청불가액,
      amount: summary.기간경과미신청,
      gradient: "from-red-500 to-red-600",
      description: "경정청구 기간 만료"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {cardData.map((card, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-0">
            <div className={`bg-gradient-to-r ${card.gradient} text-white p-6 text-center`}>
              {/* 아이콘 */}
              <div className="text-3xl mb-2">{card.icon}</div>
              
              {/* 제목 */}
              <div className="text-sm opacity-90 mb-1">{card.title}</div>
              
              {/* 금액 */}
              <div className="text-2xl font-bold mb-1">{card.value}</div>
              
              {/* 설명 */}
              <div className="text-xs opacity-80">{card.description}</div>
              
              {/* 진행률 표시 (총계 대비 비율) */}
              {index > 0 && summary.총계 > 0 && (
                <div className="mt-3">
                  <div className="bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-white rounded-full h-2 transition-all duration-300"
                      style={{ 
                        width: `${Math.round((card.amount / summary.총계) * 100)}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs mt-1 opacity-90">
                    전체의 {Math.round((card.amount / summary.총계) * 100)}%
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 