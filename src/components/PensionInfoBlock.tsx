import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { API_CONFIG } from '../config/pageConfig';

/**
 * 📊 국민연금 가입인원 정보 블럭
 * 작업요청서_20250618_009 - 국민연금 UI 추가
 * 작업요청서_20250618_010 - 국민연금 UI 미표시 디버깅 및 강제 표시 처리
 * 작업요청서_20250618_010_1 - 실데이터 표시 개선
 * 
 * 기능:
 * - 자동 사업자등록번호 조회 (props 기반)
 * - 공공데이터포털 API 호출
 * - 가입자 수 실시간 표시
 * - 로딩/에러 처리 포함
 */

type PensionData = {
  workplaceName: string;
  subscriberCount: number;
  referenceYearMonth: string;
  businessRegistrationNumber: string;
  responseTime: string;
};

type PensionInfoBlockProps = {
  defaultBizNo?: string; // 기본값으로 설정할 사업자번호 (선택사항)
  companyName?: string; // 회사명 (내부 DB에서 확보한 정보)
};

export default function PensionInfoBlock({ defaultBizNo, companyName }: PensionInfoBlockProps) {
  // 🔥 디버깅: 컴포넌트 마운트 확인 (작업요청서_20250618_010)
  console.log('🔥 국민연금 블럭 렌더링됨');
  console.log('🔥 Props received:', { defaultBizNo, companyName });

  const [pensionData, setPensionData] = useState<PensionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔍 국민연금 정보 조회 함수
  const fetchPensionInfo = async (bizno: string) => {
    // 사업자번호 포맷 검증 (간단한 검증)
    const cleanBizNo = bizno.replace(/[^0-9]/g, '');
    if (cleanBizNo.length !== 10) {
      setError('사업자등록번호 형식이 올바르지 않습니다.');
      return;
    }

    setLoading(true);
    setError(null);
    setPensionData(null);

    try {
      console.log('🚀 국민연금 API 호출 시작:', cleanBizNo);

      // 🌐 API 호출 (✅ POST 방식 + 사업장명 포함 - 요청서_20250619)
      const apiUrl = `${API_CONFIG.BASE_URL}/getPensionStatus`;
      
      // ✅ 회사명 전처리: "/파주공장" 등 제거하여 기본명만 추출 (요청서_20250619)
      const cleanCompanyName = companyName ? companyName.split('/')[0].trim() : null;
      console.log('🔧 사업장명 정규화:', companyName, '→', cleanCompanyName);
      console.log('📋 최종 전달 파라미터:', { bizNo: cleanBizNo, wkplNm: cleanCompanyName });
      
      const requestBody = {
        bizNo: cleanBizNo,
        wkplNm: cleanCompanyName // 전처리된 기본 회사명만 전달
      };
      
      console.log('🔍 API URL:', apiUrl);
      console.log('🔍 Request Body:', requestBody);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ API 응답 받음:', result);

      if (result.success && result.data) {
        setPensionData(result.data);
        console.log('✅ 국민연금 데이터 설정 완료:', result.data);
      } else {
        const errorMessage = result.error || '국민연금 정보를 찾을 수 없습니다.';
        setError(errorMessage);
        console.error('❌ API 오류:', errorMessage);
      }

    } catch (err) {
      console.error('❌ 국민연금 조회 오류:', err);
      
      let errorMessage = '국민연금 정보 조회 중 오류가 발생했습니다.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log('🏁 국민연금 조회 완료');
    }
  };

  // 🔄 자동 조회 useEffect (작업요청서_20250618_010_1)
  useEffect(() => {
    console.log('🔄 useEffect 트리거 - defaultBizNo:', defaultBizNo);
    
    if (defaultBizNo && defaultBizNo.trim()) {
      console.log('✅ 자동 국민연금 조회 시작:', defaultBizNo);
      fetchPensionInfo(defaultBizNo);
    } else {
      console.log('⚠️ defaultBizNo가 없어서 자동 조회하지 않음');
    }
  }, [defaultBizNo]);

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-blue-800">
          <span>🏛️</span>
          <span>국민연금 가입인원 정보</span>
          <Badge variant="default" className="text-xs bg-blue-100 border-blue-300 text-blue-600 border">
            자동 조회
          </Badge>
          {loading && (
            <Badge variant="default" className="text-xs bg-yellow-100 border-yellow-300 text-yellow-600 border">
              조회중...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 🔄 로딩 상태 */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-blue-600 font-medium">국민연금 정보를 조회하고 있습니다...</span>
            </div>
          </div>
        )}

        {/* 🚨 오류 메시지 */}
        {error && !loading && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800 text-sm">
              <div className="flex items-center space-x-2">
                <span>❌</span>
                <span>{error}</span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* 📊 성공 시 결과 표시 */}
        {pensionData && !loading && (
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 flex items-center space-x-2">
                  <span>🏢</span>
                  <span>사업장 정보</span>
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">사업장명:</span>
                    <span className="font-medium text-right max-w-40 truncate" title={pensionData.workplaceName}>
                      {pensionData.workplaceName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">사업자번호:</span>
                    <span className="font-medium">
                      {pensionData.businessRegistrationNumber}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 flex items-center space-x-2">
                  <span>👥</span>
                  <span>가입 현황</span>
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">가입자 수:</span>
                    <span className="font-bold text-lg text-blue-600">
                      {pensionData.subscriberCount}명
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">기준년월:</span>
                    <span className="font-medium">
                      {pensionData.referenceYearMonth}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">응답시간:</span>
                    <span className="font-medium text-green-600">
                      {pensionData.responseTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 📝 가입자 수 하이라이트 */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-center">
                <div className="text-sm text-blue-600 font-medium">국민연금 가입 인원</div>
                <div className="text-2xl font-bold text-blue-800 mt-1">
                  {pensionData.subscriberCount}명
                </div>
                <div className="text-xs text-blue-500 mt-1">
                  {pensionData.referenceYearMonth} 기준
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 📋 초기 상태 (데이터 없음) */}
        {!pensionData && !loading && !error && defaultBizNo && (
          <div className="text-center py-6 text-gray-500">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm">사업자번호: {defaultBizNo}</p>
            <p className="text-xs text-gray-400 mt-1">국민연금 정보를 준비하고 있습니다...</p>
          </div>
        )}

        {/* ⚠️ defaultBizNo가 없는 경우 */}
        {!defaultBizNo && (
          <div className="text-center py-6 text-gray-500">
            <div className="text-2xl mb-2">⚠️</div>
            <p className="text-sm">사업자등록번호가 전달되지 않았습니다.</p>
            <p className="text-xs text-gray-400 mt-1">회사 정보를 먼저 확인해주세요.</p>
          </div>
        )}

        {/* 💡 도움말 */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <div className="flex items-start space-x-2">
            <span>💡</span>
            <div>
              <strong>이용 안내:</strong> 공공데이터포털 국민연금공단 API를 통해 실시간 가입자 수를 조회합니다. 
              이 정보는 세액공제 계산과는 별도의 참고 정보입니다.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 