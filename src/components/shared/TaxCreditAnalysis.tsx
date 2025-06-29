import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";

interface TaxCreditData {
  expectedAmount: number;
  riskLevel: 'low' | 'medium' | 'high';
  aiRecommendation: string;
  detailedAnalysis: {
    baseYear: string;
    employeeCount: number;
    qualifiedEmployees: number;
    creditAmount: number;
    riskFactors: string[];
  }[];
}

interface TaxCreditAnalysisProps {
  taxCreditData: TaxCreditData;
  accessLevel?: 'public' | 'partner' | 'premium';
  showAnalysis?: boolean;
}

const TaxCreditAnalysis: React.FC<TaxCreditAnalysisProps> = ({ 
  taxCreditData, 
  accessLevel = 'public',
  showAnalysis = true 
}) => {
  // 프리미엄 레벨에서만 세액공제 분석 표시
  const canShowAnalysis = accessLevel === 'premium';
  
  // 위험도에 따른 색상 결정
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-700 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  // 위험도 이모지
  const getRiskEmoji = (risk: string) => {
    switch (risk) {
      case 'low': return '✅';
      case 'medium': return '⚠️';
      case 'high': return '🚨';
      default: return '❓';
    }
  };

  // 분석이 잠겨있을 때 표시할 내용
  if (!canShowAnalysis || !showAnalysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>💰 세액공제 분석 결과</CardTitle>
          <p className="text-sm text-gray-600">AI 기반 세액공제 예상액 및 위험도 분석</p>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* 흐린 배경 미리보기 */}
            <div className="opacity-20 pointer-events-none space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800">예상 세액공제</h4>
                  <p className="text-2xl font-bold text-blue-600">***,***,*** 원</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800">위험도</h4>
                  <p className="text-xl font-bold text-yellow-600">⚠️ ***</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800">AI 추천</h4>
                  <p className="text-sm text-purple-600">*** 권장</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">📊 연도별 상세 분석</h4>
                <div className="space-y-2">
                  {[1, 2, 3].map((_, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="flex justify-between">
                        <span>20** 기준연도</span>
                        <span className="font-bold">***,*** 원</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 잠금 오버레이 */}
            <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center rounded-lg">
              <div className="text-center p-8">
                <div className="text-6xl mb-6">🔐</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">프리미엄 전용 기능</h3>
                <p className="text-gray-600 mb-2">
                  AI 기반 세액공제 분석은 프리미엄 회원 전용 기능입니다.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  • 정확한 세액공제 예상액 계산<br/>
                  • 위험도 분석 및 대응 방안<br/>
                  • 연도별 상세 분석 및 AI 추천
                </p>
                <div className="space-y-2">
                  <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold">
                    프리미엄 회원 가입하기
                  </button>
                  <p className="text-xs text-gray-400">7일 무료 체험 가능</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>💰 세액공제 분석 결과</CardTitle>
        <p className="text-sm text-gray-600">AI 기반 세액공제 예상액 및 위험도 분석</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 핵심 지표 요약 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800">총 예상 세액공제</h4>
              <p className="text-2xl font-bold text-blue-600">
                {taxCreditData.expectedAmount.toLocaleString()} 원
              </p>
              <p className="text-xs text-blue-500 mt-1">
                최근 3개년 기준 추정
              </p>
            </div>
            
            <div className={`p-4 rounded-lg border ${getRiskColor(taxCreditData.riskLevel)}`}>
              <h4 className="font-semibold">위험도 평가</h4>
              <p className="text-xl font-bold">
                {getRiskEmoji(taxCreditData.riskLevel)} {taxCreditData.riskLevel.toUpperCase()}
              </p>
              <p className="text-xs mt-1">
                {taxCreditData.riskLevel === 'low' && '안전한 수준'}
                {taxCreditData.riskLevel === 'medium' && '보통 주의 필요'}
                {taxCreditData.riskLevel === 'high' && '높은 위험 주의'}
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800">AI 추천 등급</h4>
              <p className="text-lg font-bold text-purple-600">
                {taxCreditData.riskLevel === 'low' && '✨ 적극 권장'}
                {taxCreditData.riskLevel === 'medium' && '👍 신중 권장'}
                {taxCreditData.riskLevel === 'high' && '⚠️ 검토 필요'}
              </p>
              <p className="text-xs text-purple-500 mt-1">AI 신뢰도 87%</p>
            </div>
          </div>
          
          {/* AI 추천사항 */}
          <Alert>
            <AlertDescription>
              <div className="flex items-start gap-3">
                <div className="text-2xl">🤖</div>
                <div>
                  <h4 className="font-semibold mb-2">AI 분석 의견</h4>
                  <p className="text-sm leading-relaxed">{taxCreditData.aiRecommendation}</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
          
          {/* 연도별 상세 분석 */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              📊 연도별 상세 분석
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                프리미엄 전용
              </span>
            </h4>
            
            <div className="space-y-4">
              {taxCreditData.detailedAnalysis.map((analysis, index) => (
                <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="text-lg font-bold text-gray-800">
                      {analysis.baseYear} 기준연도 분석
                    </h5>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">예상 세액공제</p>
                      <p className="text-xl font-bold text-blue-600">
                        {analysis.creditAmount.toLocaleString()} 원
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white p-3 rounded border">
                      <p className="text-sm text-gray-600">총 근로자 수</p>
                      <p className="text-lg font-bold text-gray-800">{analysis.employeeCount} 명</p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-sm text-gray-600">공제대상 근로자</p>
                      <p className="text-lg font-bold text-green-600">{analysis.qualifiedEmployees} 명</p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-sm text-gray-600">공제율</p>
                      <p className="text-lg font-bold text-purple-600">
                        {((analysis.qualifiedEmployees / analysis.employeeCount) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  {/* 위험 요소 */}
                  {analysis.riskFactors.length > 0 && (
                    <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                      <h6 className="font-semibold text-yellow-800 mb-2">⚠️ 주의 사항</h6>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {analysis.riskFactors.map((risk, riskIndex) => (
                          <li key={riskIndex} className="flex items-start gap-2">
                            <span className="text-yellow-500">•</span>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* 액션 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <button className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              📄 상세 분석 보고서 다운로드
            </button>
            <button className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold">
              👨‍💼 세무사 상담 신청
            </button>
            <button className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-semibold">
              📊 시뮬레이션 실행
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaxCreditAnalysis;
