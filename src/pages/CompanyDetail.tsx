import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  analyzeCompanyTaxCredit, 
  formatCurrency, 
  formatBizno,
  generateExecutiveReport
} from '../services/taxCreditService';
import { SummaryCards } from '../components/SummaryCards';
import { 
  InsuCleanRecord, 
  InsuCleanApiResponse, 
  InsuCleanApiError,
  getYearValue,
  getExclusionStatus
} from '../types/InsuCleanRecord';
import { API_CONFIG } from '../config/pageConfig';

/**
 * 📊 CompanyDetail v2.1
 * IDE작업기준서 + 함수작성기준 완전 반영
 * - InsuCleanRecord 타입 적용 (작업요청서_20250604_002)
 * - API 호출경로 수정 (작업요청서_20250604_003)
 * - API 응답구조 점검 (작업요청서_20250604_004)
 * - 렌더링 오류수정 (작업요청서_20250604_005)
 * - 타입단언 오류해결 (작업요청서_20250604_006)
 * - 4개 핵심 요약 카드
 * - 실시간 조정 패널 (청년 비율/사회보험료 슬라이더)
 * - 3단계 분류 시스템
 * - 시계열 분석 테이블
 */

// 🎯 TypeScript 타입 정의 (실제 반환값 구조 기준)
type AnalysisResult = {
  results: {
    year: string;
    increaseCount: number;
    employmentCredit: number;
    socialInsuranceCredit: number;
    totalCredit: number;
    status: string;
    classification: {
      key: string;
      status: string;
      icon: string;
      title: string;
      color: string;
      bgColor: string;
      textColor: string;
      gradient: string;
      description: string;
      recommendation: string;
      risk_level: string;
    };
    amendmentDeadline: string;
    managementEndDate: string;
    riskAnalysis: {
      status: string;
      classification: any;
      amendment: any;
      postManagement: any;
    };
    duplicateRule: {
      isDuplicateAllowed: boolean;
      reason: string;
      applicableRule: string;
    };
  }[];
  summary: {
    기간경과미신청: number;
    사후관리종료: number;
    사후관리진행중: number;
    총계: number;
  };
  companyInfo?: {
    bizno: string;
    companyName: string;
    companyType: string;
    region: string;
    industry: string;
    industryCode: string;
    sido: string;
    gugun: string;
    establishedDate: string;
  };
};

// 🔍 타입 가드 헬퍼 함수들 (작업요청서_20250604_006 + 20250604_007 개선)
const isSuccessResponse = (response: InsuCleanApiResponse | InsuCleanApiError): response is InsuCleanApiResponse => {
  // ✅ 더 관대한 성공 조건: success가 true이기만 하면 성공으로 판단
  return response.success === true;
};

const isErrorResponse = (response: InsuCleanApiResponse | InsuCleanApiError): response is InsuCleanApiError => {
  // ✅ 명확한 에러 조건: success가 false이고 error 키가 있는 경우
  return response.success === false && 'error' in response;
};

// 🔍 데이터 유효성 검사 헬퍼 함수 (작업요청서_20250604_008 - 실제 응답 구조 반영)
const hasValidData = (response: any): boolean => {
  // ✅ 실제 API 응답 구조에 맞게 수정 (data 대신 analysisData 체크)
  if (response && typeof response === 'object') {
    // 방법 1: data 키가 있는 경우 (기존 기대 구조)
    if ('data' in response && response.data && typeof response.data === 'object') {
      return true;
    }
    // 방법 2: analysisData 키가 있는 경우 (현재 실제 응답 구조)
    if ('analysisData' in response && response.analysisData && typeof response.analysisData === 'object') {
      return true;
    }
  }
  return false;
};

export default function CompanyDetail() {
  const { bizno } = useParams();
  
  // ✅ 명시적 타입 선언 - 더 유연한 타입으로 수정 (작업요청서_20250604_005)
  const [companyData, setCompanyData] = useState<InsuCleanRecord | any | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 🎛️ 실시간 조정 상태 (IDE작업기준서 반영)
  const [youthRatio, setYouthRatio] = useState(0); // 청년 비율 (0~1)
  const [socialInsuranceRate, setSocialInsuranceRate] = useState(1.0); // 실제 사회보험료 배수

  // 📊 회사 데이터 가져오기 (✅ InsuCleanRecord 타입 + API_CONFIG 적용)
  const fetchCompanyDataHandler = useCallback(async () => {
    if (!bizno) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // ✅ API_CONFIG 설정값 사용 (작업요청서_20250604_003)
      const apiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ANALYZE}?bizno=${bizno}`;
      
      // 🔍 상세 디버깅 로그 추가
      console.log('🚀 fetchCompanyDataHandler 시작');
      console.log('🔍 사용된 API_CONFIG.BASE_URL:', API_CONFIG.BASE_URL);
      console.log('🔍 사용된 API_CONFIG.ENDPOINTS.ANALYZE:', API_CONFIG.ENDPOINTS.ANALYZE);
      console.log('🔍 최종 조합된 API 호출 URL:', apiUrl);
      console.log('🔍 호출 시각:', new Date().toISOString());
      
      const response = await fetch(apiUrl);
      console.log('✅ fetch 응답 받음, status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: InsuCleanApiResponse | InsuCleanApiError = await response.json();
      
      // 🔍 API 응답 구조 완전 출력 (작업요청서_20250604_004)
      console.log('🔍 === API 응답 구조 전체 출력 시작 ===');
      console.log('🔍 typeof result:', typeof result);
      console.log('🔍 result 전체:', result);
      console.log('🔍 JSON.stringify(result):', JSON.stringify(result, null, 2));
      console.log('🔍 result.success:', result.success);
      console.log('🔍 result.success 타입:', typeof result.success);
      console.log('🔍 Object.keys(result):', Object.keys(result || {}));
      
      console.log('🔍 === API 응답 구조 전체 출력 종료 ===');
      
      console.log('✅ JSON 파싱 완료, result.success:', result.success);
      
      // 🔍 조건문 디버깅 추가 - 타입 가드 사용
      console.log('🔍 조건문 체크 시작 - isSuccessResponse(result)');
      console.log('🔍 result.success:', result.success);
      console.log('🔍 "data" in result:', 'data' in result);
      console.log('🔍 isSuccessResponse(result):', isSuccessResponse(result));
      console.log('🔍 hasValidData(result):', hasValidData(result));
      
      // ✅ 개선된 응답 처리 로직 (작업요청서_20250604_007 + 회의록 적용)
      if (result.success === true) {
        console.log('🔍 === API 응답 성공 - 데이터 처리 시작 ===');
        
        if (hasValidData(result)) {
          const apiResponse = result as InsuCleanApiResponse;
          console.log('🔍 === companyData 설정 과정 시작 ===');
          
          // ✅ 실제 응답 구조에 따른 데이터 추출 (작업요청서_20250604_008 + 010 타입 수정)
          let actualData: Record<string, any> | null = null;
          
          if (apiResponse.data) {
            // 기존 기대 구조: result.data
            console.log('🔍 기존 data 구조 사용:', apiResponse.data);
            actualData = apiResponse.data;
          } else if ((apiResponse as any).analysisData) {
            // 실제 응답 구조: result.analysisData
            console.log('🔍 analysisData 구조 감지:', (apiResponse as any).analysisData);
            
            // ✅ analysisData에서 실제 DB 컬럼 추출 시도
            const analysisData = (apiResponse as any).analysisData;
            if (Array.isArray(analysisData) && analysisData.length > 0) {
              // analysisData가 배열인 경우 첫 번째 요소에서 실제 데이터 추출
              const firstItem = analysisData[0];
              console.log('🔍 analysisData 첫 번째 항목:', firstItem);
              
              // ✅ 실제 DB 컬럼이 직접 포함되어 있는지 확인
              if (firstItem.사업장명 || firstItem.companyProfile?.name) {
                actualData = firstItem;
              } else {
                // companyProfile 등에서 매핑된 데이터 추출
                actualData = {
                  사업장명: firstItem.companyProfile?.name || '정보없음',
                  업종명: firstItem.companyProfile?.industry || '정보없음',
                  시도: firstItem.companyProfile?.location || '정보없음',
                  사업자등록번호: firstItem.companyProfile?.bizno || bizno || '정보없음',
                  // TODO: 다른 컬럼들도 매핑 필요
                };
              }
            } else if (typeof analysisData === 'object') {
              // analysisData가 객체인 경우
              actualData = analysisData;
            }
          }
          
          console.log('🔍 최종 추출된 데이터:', actualData);
          
          if (actualData) {
            // 🎯 추출된 데이터를 companyData로 설정
            setCompanyData(actualData);
            
            console.log('🔍 setCompanyData 호출 완료');
            console.log('🔍 설정할 데이터 - 사업장명:', actualData?.사업장명);
            console.log('🔍 설정할 데이터 - 시도:', actualData?.시도);
            console.log('🔍 설정할 데이터 - 업종명:', actualData?.업종명);
            console.log('🔍 === companyData 설정 과정 종료 ===');
            
            console.log('✅ 추출된 전체 데이터:', actualData);
            console.log('📋 데이터 키 개수:', Object.keys(actualData).length);
            console.log('🎯 타입 확인 - 사업장명:', actualData.사업장명);
            console.log('🎯 타입 확인 - 시도:', actualData.시도);
            console.log('🎯 타입 확인 - 제외여부:', actualData.제외여부);
            
            // ✅ 중요: 실제 DB 컬럼 검증 (작업요청서_20250604_008 핵심 + 011 null 체크 추가)
            console.log('🔍 === 실제 DB 컬럼 존재 여부 검증 ===');
            const expectedColumns = [
              '사업자등록번호', '사업장명', '우편번호', '사업장주소',
              '업종코드', '업종명', '성립일자', '2016', '2017', '2018', '2019', '2020',
              '2021', '2022', '2023', '2024', '2025', '중복횟수', '분류', '시도', '구군', '제외여부'
            ];
            
            // ✅ actualData null 체크 추가 (작업요청서_20250604_011 + 012 단언 처리)
            if (actualData) {
              // ✅ TypeScript 단언 처리로 null 가능성 완전 제거 (작업요청서_20250604_012)
              const data = actualData!;
              const missingColumns = expectedColumns.filter(col => !(col in data));
              const existingColumns = expectedColumns.filter(col => col in data);
              
              console.log('✅ 존재하는 컬럼들:', existingColumns);
              console.log('❌ 누락된 컬럼들:', missingColumns);
              console.log(`📊 컬럼 충족률: ${existingColumns.length}/${expectedColumns.length} (${Math.round(existingColumns.length/expectedColumns.length*100)}%)`);
              
              if (missingColumns.length > 0) {
                console.warn('⚠️ 유비님 요구사항 미충족: 일부 DB 컬럼이 API 응답에 누락되었습니다.');
                console.warn('⚠️ 누락된 컬럼:', missingColumns.join(', '));
              }
            } else {
              console.warn('⚠️ actualData가 null이므로 컬럼 검증을 건너뜁니다.');
              console.log('❌ 누락된 컬럼들: 전체 (데이터 없음)');
              console.log('📊 컬럼 충족률: 0/22 (0%)');
            }
            console.log('🔍 === 실제 DB 컬럼 검증 완료 ===');
          } else {
            console.log('🔍 데이터 추출 실패');
            setError('응답에서 유효한 데이터를 추출할 수 없습니다.');
          }
        } else {
          console.log('🔍 API 응답은 성공이지만 data가 없거나 유효하지 않음');
          console.log('🔍 result 구조:', Object.keys(result || {}));
          // ✅ 성공 응답이지만 데이터가 없는 경우 - 일반적인 메시지로 처리
          setError('응답 데이터가 비어있습니다. 다른 사업자번호를 시도해보세요.');
        }
      } else if (result.success === false) {
        console.log('🔍 === API 응답 실패 - 에러 처리 시작 ===');
        
        if (isErrorResponse(result)) {
          console.log('🔍 에러 응답 처리:', result.error);
          setError(result.error || '회사 정보를 찾을 수 없습니다.');
        } else {
          console.log('🔍 에러 응답이지만 error 키가 없음');
          setError('서버에서 오류가 발생했습니다.');
        }
      } else {
        console.log('🔍 === 예상하지 못한 응답 구조 ===');
        // ✅ 회의록 해결방안 적용: 타입 단언으로 never 타입 오류 해결
        const res = result as any;
        console.log('🔍 result.success 값:', res.success);
        console.log('🔍 typeof result.success:', typeof res.success);
        console.log('🔍 전체 result:', result);
        // ✅ 이 경우에만 "알 수 없는 응답 구조" 메시지 표시 (드물게 발생)
        setError('예상하지 못한 응답 형식입니다.');
      }
    } catch (err) {
      console.error('❌ 데이터 가져오기 오류:', err);
      
      // ✅ TypeScript 안전한 오류 처리
      if (err instanceof Error) {
        console.error('❌ 오류 상세:', err.message, err.stack);
      } else {
        console.error('❌ 알 수 없는 오류 타입:', err);
      }
      
      setError('회사 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      console.log('🏁 fetchCompanyDataHandler 종료');
    }
  }, [bizno]);

  // 🧮 세액공제 분석 실행
  const calculateTaxCreditAnalysis = useCallback(() => {
    if (!companyData) return;
    
    try {
      const result = analyzeCompanyTaxCredit(companyData, youthRatio, socialInsuranceRate);
      setAnalysisResult(result);
    } catch (err) {
      console.error('❌ 분석 오류:', err);
      
      // ✅ TypeScript 안전한 오류 처리
      if (err instanceof Error) {
        console.error('❌ 분석 오류 상세:', err.message, err.stack);
      } else {
        console.error('❌ 알 수 없는 분석 오류 타입:', err);
      }
      
      setError('세액공제 분석 중 오류가 발생했습니다.');
    }
  }, [companyData, youthRatio, socialInsuranceRate]);

  // 🎯 초기 데이터 로드
  useEffect(() => {
    console.log('🔄 useEffect 트리거 - fetchCompanyDataHandler 호출 예정');
    console.log('🔍 현재 bizno:', bizno);
    fetchCompanyDataHandler();
  }, [fetchCompanyDataHandler, bizno]);

  // 🔄 데이터 변경 시 재분석
  useEffect(() => {
    console.log('🔄 useEffect 트리거 - calculateTaxCreditAnalysis 호출 예정');
    console.log('🔍 companyData 존재 여부:', companyData ? 'YES' : 'NO');
    calculateTaxCreditAnalysis();
  }, [calculateTaxCreditAnalysis, companyData]);

  // 🔍 companyData 상태 변경 추적 (작업요청서_20250604_005)
  useEffect(() => {
    console.log('🔍 === companyData 상태 변경 감지 ===');
    console.log('🔍 companyData:', companyData);
    console.log('🔍 companyData 타입:', typeof companyData);
    console.log('🔍 companyData가 null인가?:', companyData === null);
    console.log('🔍 companyData가 undefined인가?:', companyData === undefined);
    
    if (companyData) {
      console.log('🔍 companyData 키들:', Object.keys(companyData));
      console.log('🔍 companyData.사업장명:', companyData.사업장명);
      console.log('🔍 companyData.시도:', companyData.시도);
      console.log('🔍 companyData.업종명:', companyData.업종명);
      console.log('🔍 companyData.제외여부:', companyData.제외여부);
      console.log('🔍 getExclusionStatus(companyData):', getExclusionStatus(companyData));
    } else {
      console.log('🔍 companyData가 비어있습니다.');
    }
    console.log('🔍 === companyData 상태 변경 감지 종료 ===');
  }, [companyData]);

  // 📱 청년 비율 변경 핸들러
  const handleYouthRatioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRatio = parseFloat(event.target.value) / 100;
    setYouthRatio(newRatio);
  };

  // 🛡️ 사회보험료 배수 변경 핸들러  
  const handleSocialInsuranceRateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRate = parseFloat(event.target.value);
    setSocialInsuranceRate(newRate);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg text-gray-600">회사 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={fetchCompanyDataHandler} 
          className="mt-4"
        >
          다시 시도
        </Button>
      </div>
    );
  }

  if (!companyData || !analysisResult) {
    // 🔍 렌더링 조건문 디버깅 (작업요청서_20250604_005 + 007 개선)
    console.log('🔍 === 렌더링 조건문 체크 ===');
    console.log('🔍 companyData:', companyData);
    console.log('🔍 companyData 존재:', !!companyData);
    console.log('🔍 analysisResult:', analysisResult);
    console.log('🔍 analysisResult 존재:', !!analysisResult);
    console.log('🔍 렌더링 조건: (!companyData || !analysisResult):', (!companyData || !analysisResult));
    
    // ✅ 더 구체적인 메시지 제공 (작업요청서_20250604_007)
    let message = '분석할 데이터가 없습니다.';
    let suggestion = '';
    
    if (!companyData && !analysisResult) {
      message = '회사 데이터를 불러오지 못했습니다.';
      suggestion = '사업자번호를 확인하고 다시 시도해보세요.';
    } else if (!companyData) {
      message = '회사 정보를 찾을 수 없습니다.';
      suggestion = '입력하신 사업자번호에 해당하는 데이터가 없습니다.';
    } else if (!analysisResult) {
      message = '세액공제 분석 중입니다.';
      suggestion = '잠시만 기다려주세요...';
    }
    
    console.log('🔍 선택된 메시지:', message);
    console.log('🔍 === 렌더링 조건문 체크 종료 ===');
    
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">{message}</div>
              {suggestion && <div className="text-sm text-gray-600">{suggestion}</div>}
            </div>
          </AlertDescription>
        </Alert>
        {/* ✅ 데이터 불러오기 재시도 버튼 추가 */}
        {!companyData && (
          <Button 
            onClick={fetchCompanyDataHandler} 
            className="mt-4"
            disabled={loading}
          >
            {loading ? '불러오는 중...' : '다시 시도'}
          </Button>
        )}
      </div>
    );
  }

  // 🎯 실무진 리포트 생성
  const executiveReport = generateExecutiveReport(analysisResult.summary, analysisResult.companyInfo);

  // 🔍 렌더링 직전 최종 확인 (작업요청서_20250604_005)
  console.log('🔍 === 렌더링 직전 최종 데이터 확인 ===');
  console.log('🔍 companyData?.사업장명:', companyData?.사업장명);
  console.log('🔍 companyData?.시도:', companyData?.시도);
  console.log('🔍 companyData?.업종명:', companyData?.업종명);
  console.log('🔍 companyData?.제외여부:', companyData?.제외여부);
  console.log('🔍 formatBizno(companyData?.사업자등록번호):', formatBizno(companyData?.사업자등록번호 || bizno || '정보없음'));
  console.log('🔍 === 렌더링 직전 최종 데이터 확인 종료 ===');

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* 🏢 회사 정보 헤더 + 🔍 데이터 출처 표시 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-800">
                {/* ✅ InsuCleanRecord 타입 정확한 컬럼명 사용 - 안전한 접근 */}
                {(() => {
                  try {
                    const companyName = companyData?.사업장명 || '회사명 없음';
                    console.log('🔍 렌더링 중 - 사업장명:', companyName);
                    return companyName;
                  } catch (err) {
                    console.error('❌ 사업장명 렌더링 오류:', err);
                    return '회사명 오류';
                  }
                })()}
              </h1>
              {/* 🔍 데이터 출처 표시 */}
              <div className="flex space-x-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {bizno ? `사업자번호: ${bizno}` : '사업자번호 없음'}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  {companyData ? 'DB 연결됨' : 'DB 연결 안됨'}
                </span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                  {analysisResult ? '분석 완료' : '분석 대기'}
                </span>
              </div>
            </div>
            <p className="text-lg text-gray-600 mt-1">
              {/* ✅ InsuCleanRecord.사업자등록번호 사용 - 안전한 접근 */}
              사업자번호: {(() => {
                try {
                  const biznoFormatted = formatBizno(companyData?.사업자등록번호 || bizno || '정보없음');
                  console.log('🔍 렌더링 중 - 포맷된 사업자번호:', biznoFormatted);
                  return biznoFormatted;
                } catch (err) {
                  console.error('❌ 사업자번호 렌더링 오류:', err);
                  return bizno || '정보없음';
                }
              })()}
            </p>
            <div className="flex space-x-4 mt-2">
              {/* ✅ InsuCleanRecord 정확한 컬럼명들 사용 - 안전한 접근 */}
              <Badge variant="outline">{(() => {
                try {
                  const sido = companyData?.시도 || '지역정보없음';
                  console.log('🔍 렌더링 중 - 시도:', sido);
                  return sido;
                } catch (err) {
                  console.error('❌ 시도 렌더링 오류:', err);
                  return '지역정보오류';
                }
              })()}</Badge>
              <Badge variant="outline">{(() => {
                try {
                  const industry = companyData?.업종명 || '업종정보없음';
                  console.log('🔍 렌더링 중 - 업종명:', industry);
                  return industry;
                } catch (err) {
                  console.error('❌ 업종명 렌더링 오류:', err);
                  return '업종정보오류';
                }
              })()}</Badge>
              <Badge variant="outline">중소기업</Badge>
            </div>
            
            {/* 🔍 디버깅 정보 (InsuCleanRecord 타입 검증) */}
            <details className="mt-4">
              <summary className="text-sm text-gray-500 cursor-pointer">🔍 데이터 출처 디버깅 정보</summary>
              <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                <div><strong>URL 파라미터:</strong> {bizno || '없음'}</div>
                <div><strong>컴퍼니 데이터:</strong> {companyData ? 'O' : 'X'}</div>
                <div><strong>분석 결과:</strong> {analysisResult ? 'O' : 'X'}</div>
                <div><strong>로딩 상태:</strong> {loading ? '로딩중' : '완료'}</div>
                <div><strong>에러 상태:</strong> {error || '없음'}</div>
                {companyData && (
                  <div className="mt-2">
                    <strong>InsuCleanRecord 타입 검증:</strong>
                    <div className="ml-2 mt-1">
                      <div>✅ 사업장명: {companyData.사업장명}</div>
                      <div>✅ 시도: {companyData.시도}</div>
                      <div>✅ 구군: {companyData.구군}</div>
                      <div>✅ 업종명: {companyData.업종명}</div>
                      <div>✅ 제외여부: {getExclusionStatus(companyData)}</div>
                      <div>✅ 2024년도: {getYearValue(companyData, "2024")}</div>
                      <div>✅ 2023년도: {getYearValue(companyData, "2023")}</div>
                      <div>✅ 2022년도: {getYearValue(companyData, "2022")}</div>
                    </div>
                    <div className="mt-1">
                      <strong>전체 컬럼 키:</strong> {Object.keys(companyData).join(', ')}
                    </div>
                    <div className="mt-1">
                      <strong>연도별 데이터 확인:</strong>
                      <div className="ml-2">
                        {["2020", "2021", "2022", "2023", "2024"].map(year => (
                          <span key={year} className="mr-3">
                            {year}: {getYearValue(companyData, year)}명
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </details>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">분석일자</p>
            <p className="text-lg font-semibold">{new Date().toISOString().split('T')[0]}</p>
          </div>
        </div>
      </div>

      {/* 💰 4개 핵심 요약 카드 (IDE작업기준서 반영) */}
      <SummaryCards 
        summary={analysisResult.summary}
        executiveReport={executiveReport}
      />

      {/* 📋 실행 권고사항 패널 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📋</span>
            <span>실행 권고사항</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {executiveReport.실행권고사항.map((recommendation, index) => (
              recommendation && (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                  <div className="text-xl">{recommendation.charAt(0)}</div>
                  <p className="flex-1 text-sm">{recommendation.slice(2)}</p>
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 🎛️ 실시간 조정 패널 (IDE작업기준서 반영) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🔧</span>
            <span>세부 조정</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 청년 비율 슬라이더 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">청년 비율</label>
                <span className="text-sm text-gray-600">{Math.round(youthRatio * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(youthRatio * 100)}
                onChange={handleYouthRatioChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <p className="text-xs text-gray-500">
                전체 직원 중 청년등(만 15~34세) 비율을 설정하세요.
              </p>
            </div>

            {/* 실제 사회보험료 배수 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">실제 사회보험료</label>
                <span className="text-sm text-gray-600">표준의 {socialInsuranceRate}배</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={socialInsuranceRate}
                onChange={handleSocialInsuranceRateChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <p className="text-xs text-gray-500">
                실제 사회보험료가 표준값(1인당 연간 10만원)보다 높거나 낮은 경우 조정하세요.
              </p>
            </div>

            {/* 재계산 버튼 */}
            <Button 
              onClick={calculateTaxCreditAnalysis}
              className="w-full"
            >
              재계산
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 📊 상세 분석 탭 */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline">시계열 분석</TabsTrigger>
          <TabsTrigger value="details">상세 내역</TabsTrigger>
        </TabsList>

        {/* 📅 시계열 분석 테이블 */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>연도별 세액공제 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">귀속연도</th>
                      <th className="border border-gray-200 px-4 py-3 text-right font-medium text-gray-900">증가인원</th>
                      <th className="border border-gray-200 px-4 py-3 text-right font-medium text-gray-900">고용증대</th>
                      <th className="border border-gray-200 px-4 py-3 text-right font-medium text-gray-900">사회보험료</th>
                      <th className="border border-gray-200 px-4 py-3 text-right font-medium text-gray-900">합계</th>
                      <th className="border border-gray-200 px-4 py-3 text-center font-medium text-gray-900">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResult.results.map((result, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3 text-left">{result.year}</td>
                        <td className="border border-gray-200 px-4 py-3 text-right">{result.increaseCount}명</td>
                        <td className="border border-gray-200 px-4 py-3 text-right">{formatCurrency(result.employmentCredit)}</td>
                        <td className="border border-gray-200 px-4 py-3 text-right">{formatCurrency(result.socialInsuranceCredit)}</td>
                        <td className="border border-gray-200 px-4 py-3 text-right font-semibold">{formatCurrency(result.totalCredit)}</td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <Badge 
                            variant={
                              result.status === '사후관리종료' ? 'default' :
                              result.status === '사후관리진행중' ? 'secondary' : 'destructive'
                            }
                            className={
                              result.status === '사후관리종료' ? 'bg-green-100 text-green-800' :
                              result.status === '사후관리진행중' ? 'bg-orange-100 text-orange-800' : 
                              'bg-red-100 text-red-800'
                            }
                          >
                            {result.status === '사후관리종료' ? '💚 즉시신청' :
                             result.status === '사후관리진행중' ? '⚠️ 신중검토' : '❌ 신청불가'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100">
                    <tr>
                      <td className="border border-gray-200 px-4 py-3 font-semibold">합계</td>
                      <td className="border border-gray-200 px-4 py-3 text-right font-semibold">
                        {analysisResult.results.reduce((sum, r) => sum + r.increaseCount, 0)}명
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-right font-semibold">
                        {formatCurrency(analysisResult.results.reduce((sum, r) => sum + r.employmentCredit, 0))}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-right font-semibold">
                        {formatCurrency(analysisResult.results.reduce((sum, r) => sum + r.socialInsuranceCredit, 0))}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-right font-semibold text-lg text-blue-600">
                        {formatCurrency(analysisResult.summary.총계)}
                      </td>
                      <td className="border border-gray-200 px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 📋 상세 내역 */}
        <TabsContent value="details">
          <div className="space-y-6">
            {analysisResult.results.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{result.year}년 귀속분</span>
                    <Badge 
                      variant={
                        result.status === '사후관리종료' ? 'default' :
                        result.status === '사후관리진행중' ? 'secondary' : 'destructive'
                      }
                      className={
                        result.status === '사후관리종료' ? 'bg-green-100 text-green-800' :
                        result.status === '사후관리진행중' ? 'bg-orange-100 text-orange-800' : 
                        'bg-red-100 text-red-800'
                      }
                    >
                      {result.status === '사후관리종료' ? '💚 즉시신청' :
                       result.status === '사후관리진행중' ? '⚠️ 신중검토' : '❌ 신청불가'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800">기본 정보</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">증가 인원:</span>
                          <span className="font-medium">{result.increaseCount}명</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">고용증대세액공제:</span>
                          <span className="font-medium">{formatCurrency(result.employmentCredit)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">사회보험료세액공제:</span>
                          <span className="font-medium">{formatCurrency(result.socialInsuranceCredit)}</span>
                        </div>
                        <hr />
                        <div className="flex justify-between font-semibold">
                          <span>총 세액공제:</span>
                          <span className="text-blue-600">{formatCurrency(result.totalCredit)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800">기간 정보</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">경정청구 만료일:</span>
                          <span className="font-medium">{result.amendmentDeadline}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">사후관리 종료일:</span>
                          <span className="font-medium">{result.managementEndDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 