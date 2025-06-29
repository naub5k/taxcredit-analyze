import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
// 🔗 **공통 컴포넌트 import - 공개구조 분할 기반**
import { CompanyInfo, GrowthChart, TaxCreditAnalysis } from "./shared";
// 🏛️ 국민연금 블럭 import 추가 (작업요청서_20250618_010)
// import PensionInfoBlock from './PensionInfoBlock'; // 기능 완성 전까지 주석 처리
// Recharts 제거 완료 - 커스텀 그라데이션 차트 사용
// Service 함수들을 동적으로 import

const TaxCreditDashboard = () => {
  const [searchParams] = useSearchParams();
  const { bizno: urlBizno } = useParams(); // URL 패스에서 bizno 추출
  const navigate = useNavigate();
  const [bizno, setBizno] = useState('');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 🔗 **Visual에서 전달받은 자동 분석 파라미터 처리**
  const autoAnalyze = searchParams.get('autoAnalyze') === 'true';
  const expandAll = searchParams.get('expandAll') === 'true';
  
  // 🏢 **업종 선택 상태 관리**
  const [industryOptions, setIndustryOptions] = useState<any[]>([]);
  const [showIndustrySelector, setShowIndustrySelector] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedIndustry, setSelectedIndustry] = useState<any>(null);
  
  // 🔢 **업종별 연도별 인원수 데이터 캐시**
  const [optionEmployeeData, setOptionEmployeeData] = useState<{[optionId: string]: {[year: string]: number}}>({});
  
  // 📊 **특정 업종 옵션의 연도별 데이터 가져오기**
  const fetchOptionEmployeeData = useCallback(async (optionId: string, bizno: string) => {
    const cacheKey = `${bizno}-${optionId}`;
    
    // 이미 캐시된 데이터가 있으면 사용
    if (optionEmployeeData[cacheKey]) {
      console.log('📋 캐시된 데이터 사용:', cacheKey);
      return optionEmployeeData[cacheKey];
    }
    
    try {
      console.log('📊 업종별 데이터 가져오기:', optionId, bizno);
      const response = await fetch(`https://taxcredit-api-func.azurewebsites.net/api/analyze?bizno=${bizno}&recordId=${optionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }
      
      const apiData = await response.json();
      console.log('✅ 업종별 데이터 수신:', optionId, apiData);
      
      if (apiData.success && apiData.data) {
        const employeeData: {[key: string]: number} = {};
        
        // 연도 형태의 키만 추출 (4자리 숫자)
        for (const [key, value] of Object.entries(apiData.data)) {
          if (key.match(/^\d{4}$/)) { // 4자리 연도인 경우만
            const year = parseInt(key);
            if (year >= 2019 && year <= 2025) {
              const numValue = parseInt(String(value)) || 0;
              if (!isNaN(numValue)) {
                employeeData[key] = numValue;
              }
            }
          }
        }
        
        console.log('📊 추출된 연도별 데이터:', optionId, employeeData);
        
        // 캐시에 저장 (bizno-optionId 형태로)
        setOptionEmployeeData(prev => ({
          ...prev,
          [cacheKey]: employeeData
        }));
        
        return employeeData;
      }
    } catch (error) {
      console.error('❌ 업종별 데이터 가져오기 실패:', optionId, error);
    }
    
    return {};
  }, []);
  
  // 🎛️ **연도별 개별 조정 파라미터** - 각 연도마다 다른 설정 가능
  const [yearlyParams, setYearlyParams] = useState<{[year: string]: {youthCount: number, socialInsurance: number}}>({});
  
  // 특정 연도의 파라미터 가져오기 (기본값 포함)
  const getYearParams = (year: string, increaseCount: number) => {
    const params = yearlyParams[year];
    return {
      youthCount: params?.youthCount ?? 0, // 기본값: 0명 (사용자가 직접 설정 필요)
      socialInsurance: params?.socialInsurance ?? 120 // 기본값: 120만원
    };
  };

  // 특정 연도의 파라미터 업데이트
  const updateYearParams = (year: string, field: 'youthCount' | 'socialInsurance', value: number) => {
    setYearlyParams(prev => ({
      ...prev,
      [year]: {
        ...prev[year],
        youthCount: prev[year]?.youthCount ?? 0,
        socialInsurance: prev[year]?.socialInsurance ?? 120, // 기본값 120만원 유지
        [field]: value
      }
    }));
  };

  // 📂 **아코디언 상태 관리** - 연도별 펼침/접힘
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  
  const toggleYear = (year: string) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
  };

    const isYearExpanded = (year: string) => expandedYears.has(year);

  // 🚨 **환수 위험 계산 함수** - useMemo에서 사용하므로 먼저 정의
  const calculateRecallRisk = (previousResults: any[], decreaseYear: string, decreaseCount: number) => {
    const decreaseYearNum = parseInt(decreaseYear);
    const recallTargets = [];
    
    // 🛡️ **안전 장치: previousResults null 체크**
    if (!previousResults || !Array.isArray(previousResults)) {
      console.warn('⚠️ calculateRecallRisk: previousResults가 유효하지 않음', previousResults);
      return {
        decreaseYear,
        decreaseCount,
        recallTargets: [],
        totalRecallAmount: 0,
        description: `${decreaseYear}년 ${decreaseCount}명 감소 (환수 대상 분석 불가)`
      };
    }
    
    // 감소 연도부터 3년 전까지의 증가분 찾기
    for (let i = decreaseYearNum - 1; i >= decreaseYearNum - 3; i--) {
      const targetResult = previousResults.find(r => 
        r && // 🛡️ r이 null이 아닌지 확인
        r.baseYear && // 🛡️ baseYear 속성이 존재하는지 확인
        parseInt(r.baseYear) === i && 
        r.changeType === 'increase'
      );
      
      if (targetResult) {
        recallTargets.push({
          year: i.toString(),
          increaseCount: targetResult.increaseCount || 0,
          employmentCredit: targetResult.employmentCredit || {},
          socialCredit: targetResult.socialCredit || {},
          estimatedRecallAmount: targetResult.availableTotal || 0 // 간단 추정
        });
      }
    }
    
    return {
      decreaseYear,
      decreaseCount,
      recallTargets,
      totalRecallAmount: recallTargets.reduce((sum, target) => sum + (target.estimatedRecallAmount || 0), 0),
      description: `${decreaseYear}년 ${decreaseCount}명 감소로 인해 ${recallTargets.length}년치 세액공제 환수 위험`
    };
  };

  // 🚨 **사후관리 상태 분석 함수**
  const analyzePostManagementStatus = (employeeData: any, baseYear: string) => {
    const currentYear = new Date().getFullYear();
    const baseYearNum = parseInt(baseYear);
    const postManagementEndYear = baseYearNum + 2; // 3년간 사후관리 (기준연도 포함)
    
    // 사후관리 상태 결정
    let status = '';
    let confidence = '';
    let icon = '';
    let bgColor = '';
    let textColor = '';
    let description = '';
    
    if (postManagementEndYear < currentYear) {
      // 사후관리 완료 (확실함)
      status = '사후관리완료';
      confidence = '확실함';
      icon = '💚';
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      description = `${postManagementEndYear}년 완료 - 안전한 세액공제`;
    } else if (postManagementEndYear === currentYear) {
      // 사후관리 마지막 해 (2024년 데이터 영향)
      status = '사후관리진행중';
      confidence = '불확실';
      icon = '⚠️';
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      description = `${currentYear}년 데이터 확인 필요 - 정확도 주의`;
    } else {
      // 사후관리 미완료 (미래 데이터 필요)
      status = '사후관리미완료';
      confidence = '불확실';
      icon = '❓';
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      description = `${postManagementEndYear}년까지 인원 유지 필요`;
    }
    
    // 실제 인원 감소 체크 (데이터가 있는 경우에만)
    const riskDetails = [];
    if (employeeData && Object.keys(employeeData).length > 0) {
      const years = Object.keys(employeeData).sort();
      const baseYearIndex = years.indexOf(baseYear);
      
      // 기준년도 이후 사후관리 기간 체크
      for (let i = baseYearIndex + 1; i < Math.min(baseYearIndex + 3, years.length); i++) {
        const checkYear = years[i];
        const previousYear = years[i-1];
        const currentEmployees = employeeData[checkYear];
        const previousEmployees = employeeData[previousYear];
        const change = currentEmployees - previousEmployees;
        
        if (change < 0) { // 인원 감소 발견
          riskDetails.push({
            year: checkYear,
            decrease: Math.abs(change),
            currentEmployees,
            previousEmployees,
            riskLevel: Math.abs(change) > 2 ? 'HIGH' : 'MEDIUM'
          });
        }
      }
    }
    
    // 실제 위험 발견 시 상태 업데이트
    if (riskDetails.length > 0) {
      status = '추징위험';
      confidence = '위험';
      icon = '🚨';
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      description = `인원 감소로 인한 추징 위험`;
    }
    
    return {
      status,
      confidence,
      icon,
      bgColor,
      textColor,
      description,
      postManagementEndYear,
      riskDetails,
      isRisky: riskDetails.length > 0,
      totalDecrease: riskDetails.reduce((sum, risk) => sum + risk.decrease, 0)
    };
  };

  // 🔄 **상세 분석 계산 - 사후관리 위험도 포함 (안전 장치 포함)**
  const detailedAnalysis = useMemo(() => {
    console.log('🔄 detailedAnalysis 계산 시작 (모든 연도 변화 포함)');
    
    // 🛡️ **안전 장치: 기본 검증**
    if (!analysisData) {
      console.log('❌ analysisData가 없음');
      return [];
    }

    // 📅 **경정청구 기한 만료 체크 함수**
    const isAmendmentExpired = (baseYear: string, currentDate = new Date()) => {
      const amendmentDeadline = new Date(parseInt(baseYear) + 6, 2, 31); // 3월 31일
      return currentDate > amendmentDeadline;
    };

    if (typeof analysisData !== 'object' || !analysisData.companyInfo) {
      console.error('❌ 잘못된 analysisData 구조:', analysisData);
      return [];
    }

    console.log('🔍 analysisData:', analysisData);
    console.log('🔍 employeeData:', analysisData.employeeData);
    console.log('🔍 analysisResults:', analysisData.analysisResults);

    // 🚀 **API에서 이미 계산된 결과가 있는 경우 우선 사용하되, 감소분 분석 추가**
    if (analysisData.analysisResults && analysisData.analysisResults.length > 0) {
      console.log('✅ API 계산 결과 사용 + 감소분 분석 추가');
      
      const apiResults = analysisData.analysisResults.map((result: any) => {
        const currentDate = new Date();
        const baseYear = result.year;
        const increaseCount = result.increaseCount || 0;
        
        // 🚨 **중요: API에서 음수값이 오는 경우 감소분으로 처리해야 함**
        if (increaseCount < 0) {
          console.warn(`⚠️ ${baseYear}년 API 결과에서 음수 increaseCount 감지: ${increaseCount} → 감소분으로 처리 필요`);
          // 이 결과는 건너뛰고, employeeData에서 감소분으로 처리됨
          return null;
        }
        
        // 🎯 **사용자 조정값 가져오기**
        const params = yearlyParams[baseYear];
        const youthCount = params?.youthCount ?? 0;
        const socialInsurance = params?.socialInsurance ?? 120;
        const adjustedYouthCount = Math.min(youthCount, increaseCount);
        const othersCount = increaseCount - adjustedYouthCount;
        
        console.log(`🔄 ${baseYear}년 사용자 조정값:`, { 
          youthCount, 
          socialInsurance,
          adjustedYouthCount,
          othersCount 
        });
        
        // 🚨 **경정청구 기한 계산 - 1차년도 기준으로 모든 연도 동일 적용**
        const getAmendmentDeadlines = (year: string) => {
          const baseYearNum = parseInt(year);
          // 📅 **중요**: 경정청구는 1차년도 귀속분 기준으로만 가능하므로 모든 연도 기한이 동일
          const amendmentDeadline = new Date(baseYearNum + 6, 2, 31); // 1차년도 기준 5년 후 3월 31일
          return {
            year1: { year: baseYearNum, deadline: amendmentDeadline },
            year2: { year: baseYearNum + 1, deadline: amendmentDeadline }, // 1차년도와 동일한 기한
            year3: { year: baseYearNum + 2, deadline: amendmentDeadline }  // 1차년도와 동일한 기한
          };
        };

        const deadlines = getAmendmentDeadlines(baseYear);
        const year1Available = currentDate <= deadlines.year1.deadline;
        const year2Available = currentDate <= deadlines.year2.deadline;
        const year3Available = currentDate <= deadlines.year3.deadline;

        // 🧮 **사용자 조정값으로 재계산**
        const region = analysisData.companyInfo.region || '수도권';
        const youthRate = region === '수도권' ? 1100 : 1200;
        const othersRate = region === '수도권' ? 700 : 770;
        
        // 고용증대세액공제 재계산
        const employmentCreditPerYear = (adjustedYouthCount * youthRate + othersCount * othersRate) * 10000;
        
        // 사회보험료세액공제 재계산
        const youthSocialCredit = adjustedYouthCount * socialInsurance * 10000 * 1.0;
        const othersSocialCredit = othersCount * socialInsurance * 10000 * 0.5;
        const socialCreditPerYear = youthSocialCredit + othersSocialCredit;

        // 🚨 사후관리 상태 분석
        const postManagementStatus = analyzePostManagementStatus(analysisData.employeeData, baseYear);

        return {
          baseYear,
          increaseCount,
          adjustedYouthCount,
          othersCount,
          changeType: 'increase', // 증가
          employmentCredit: {
            year1: { amount: year1Available ? employmentCreditPerYear : 0, available: year1Available },
            year2: { amount: year2Available ? employmentCreditPerYear : 0, available: year2Available },
            year3: { amount: year3Available ? employmentCreditPerYear : 0, available: year3Available }
          },
          socialCredit: {
            year1: { amount: year1Available ? socialCreditPerYear : 0, available: year1Available },
            year2: { amount: year2Available ? socialCreditPerYear : 0, available: year2Available }
          },
          deadlines,
          availableTotal: 
            (year1Available ? employmentCreditPerYear + socialCreditPerYear : 0) +
            (year2Available ? employmentCreditPerYear + socialCreditPerYear : 0) +
            (year3Available ? employmentCreditPerYear : 0),
          // 🚨 사후관리 상태 추가
          postManagementStatus,
          // API 원본 결과도 포함
          apiResult: result
        };
      });

      // 📊 **employeeData에서 감소분 분석 추가**
      const employeeData = analysisData.employeeData;
      const decreaseAnalysis = [];
      
      if (employeeData && Object.keys(employeeData).length > 0) {
        const years = Object.keys(employeeData).sort();
        console.log('🔍 감소분 분석할 years:', years);
        
        for (let i = 1; i < years.length; i++) {
          const currentYear = years[i];
          const previousYear = years[i-1];
          const currentEmployees = employeeData[currentYear];
          const previousEmployees = employeeData[previousYear];
          const changeCount = currentEmployees - previousEmployees;
          
          console.log(`🔍 ${currentYear}년 분석:`, {
            currentYear,
            previousYear,
            currentEmployees,
            previousEmployees,
            changeCount
          });
          
          // 📉 **감소가 있는 경우 환수 위험 분석**
          if (changeCount < 0) {
            const decreaseCount = Math.abs(changeCount); // 항상 양수로 저장
            // 해당 연도부터 3년 전까지의 세액공제 환수 대상 찾기
            const recallRisk = calculateRecallRisk(apiResults, currentYear, decreaseCount);
            
            decreaseAnalysis.push({
              baseYear: currentYear,
              increaseCount: 0, // 감소의 경우 증가량은 0
              decreaseCount: decreaseCount, // 실제 감소량 (양수)
              changeCount: changeCount, // 원본 변화량 (음수)
              adjustedYouthCount: 0,
              othersCount: 0,
              changeType: 'decrease', // 감소
              employmentCredit: { year1: { amount: 0, available: false }, year2: { amount: 0, available: false }, year3: { amount: 0, available: false } },
              socialCredit: { year1: { amount: 0, available: false }, year2: { amount: 0, available: false } },
              deadlines: null,
              availableTotal: 0,
              // 🚨 환수 위험 정보
              recallRisk,
              postManagementStatus: {
                status: '환수위험',
                confidence: '위험',
                icon: '🚨',
                bgColor: 'bg-red-100',
                textColor: 'text-red-800',
                description: `${decreaseCount}명 감소로 인한 환수 위험`,
                isRisky: true,
                decreaseCount: decreaseCount
              }
            });
          }
          // 📊 **변화 없음(0명) - 명시적 표시로 누락 방지**
          else if (changeCount === 0) {
            // API 결과에 해당 연도가 없다면 "변화 없음"으로 추가
            const hasApiResult = apiResults.some((result: any) => result && result.baseYear === currentYear);
            if (!hasApiResult) {
              decreaseAnalysis.push({
                baseYear: currentYear,
                increaseCount: 0,
                adjustedYouthCount: 0,
                othersCount: 0,
                changeType: 'none', // 변화 없음
                employmentCredit: { year1: { amount: 0, available: false }, year2: { amount: 0, available: false }, year3: { amount: 0, available: false } },
                socialCredit: { year1: { amount: 0, available: false }, year2: { amount: 0, available: false } },
                deadlines: null,
                availableTotal: 0,
                postManagementStatus: {
                  status: '변화없음',
                  confidence: '안전',
                  icon: '📊',
                  bgColor: 'bg-gray-100',
                  textColor: 'text-gray-600',
                  description: '인원 변화 없음 - 세액공제 해당 없음',
                  isRisky: false,
                  postManagementEndYear: null
                }
              });
            }
          }
          // 📈 **증가는 이미 API 결과에 포함되어 있으므로 중복 제거**
        }
      }

      // 🔧 **2019년 기준년도를 강제로 추가 (일관성 확보)**
      const baseYear2019Analysis = [];
      const hasYear2019 = apiResults.some((result: any) => result && result.baseYear === '2019') || 
                          decreaseAnalysis.some((result: any) => result.baseYear === '2019');
      
      if (!hasYear2019 && employeeData && employeeData['2019']) {
        console.log('🔧 2019년 기준년도 강제 추가');
        baseYear2019Analysis.push({
          baseYear: '2019',
          increaseCount: 0,
          adjustedYouthCount: 0,
          othersCount: 0,
          changeType: 'base', // 기준년도
          employmentCredit: { year1: { amount: 0, available: false }, year2: { amount: 0, available: false }, year3: { amount: 0, available: false } },
          socialCredit: { year1: { amount: 0, available: false }, year2: { amount: 0, available: false } },
          deadlines: null,
          availableTotal: 0,
          postManagementStatus: {
            status: '기준년도',
            confidence: '안전',
            icon: '📊',
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-600',
            description: '2019년 기준년도 - 비교 기준',
            isRisky: false,
            isBaseYear: true
          }
        });
      }

      // 📋 **기준년도 + 증가분 + 감소분 결합 후 연도순 정렬**
      const combinedResults = [
        ...baseYear2019Analysis,
        ...apiResults.filter((result: any) => result && result.baseYear), 
        ...decreaseAnalysis
      ].sort((a: any, b: any) => 
        parseInt(a.baseYear) - parseInt(b.baseYear)
      );

      // 🚨 **경정청구 기한 만료 여부 체크 및 표시 업데이트**
      combinedResults.forEach(result => {
        const isExpired = isAmendmentExpired(result.baseYear);
        if (isExpired) {
          // 만료된 데이터 표시 업데이트
          result.isAmendmentExpired = true;
          result.expiredNote = `${result.baseYear}년 귀속분 경정청구 기한 만료 (${parseInt(result.baseYear) + 6}년 3월 31일)`;
          
          // 신청 가능 금액을 0으로 설정 (기한 만료)
          result.availableTotal = 0;
          
          // 상태 표시 업데이트 (증가분인 경우에만)
          if (result.changeType === 'increase') {
            result.postManagementStatus = {
              ...result.postManagementStatus,
              status: '기간만료',
              confidence: '만료',
              icon: '⏰',
              bgColor: 'bg-gray-100',
              textColor: 'text-gray-600',
              description: '경정청구 기한 만료 - 신청 불가',
              isExpired: true
            };
          }
        } else {
          result.isAmendmentExpired = false;
        }
      });
      
      // 🚨 **감소분 발생 시 이전 연도들의 환수 위험 업데이트**
      const decreaseYears = combinedResults.filter(result => result.changeType === 'decrease');
      
      decreaseYears.forEach(decreaseResult => {
        const decreaseYear = parseInt(decreaseResult.baseYear);
        console.log(`🚨 ${decreaseResult.baseYear}년 감소 감지: 이전 연도들 환수 위험 업데이트`);
        
        // 🎯 **올바른 사후관리 기간 로직**: 증가년도 + 3년간 사후관리
        // 감소년도가 사후관리 기간에 포함되는 증가분들 찾기
        combinedResults.forEach(targetResult => {
          if (targetResult.changeType === 'increase') {
            const increaseYear = parseInt(targetResult.baseYear);
            const postManagementEndYear = increaseYear + 2; // 증가년도 포함 3년간 (0, 1, 2년 후)
            
            // 감소년도가 사후관리 기간 내에 있는지 확인
            if (decreaseYear >= increaseYear && decreaseYear <= postManagementEndYear) {
              // 🎯 **핵심**: 각 증가분의 기준 인원과 비교하여 개별 판단
              const increaseYearEmployees = analysisData.employeeData[increaseYear.toString()] || 0;
              const decreaseYearEmployees = analysisData.employeeData[decreaseYear.toString()] || 0;
              
              console.log(`🔍 ${targetResult.baseYear}년 증가분 사후관리 체크:`, {
                increaseYear,
                increaseYearEmployees,
                decreaseYear, 
                decreaseYearEmployees,
                isViolation: decreaseYearEmployees < increaseYearEmployees
              });
              
              // **개별 판단**: 감소년도 인원이 증가년도 기준 미만인 경우만 환수 위험
              if (decreaseYearEmployees < increaseYearEmployees) {
                console.log(`🚨 ${targetResult.baseYear}년 증가분 환수 위험: ${decreaseYearEmployees}명 < ${increaseYearEmployees}명`);
              
              // 환수 예상 금액 계산
              const estimatedRecallAmount = targetResult.availableTotal || 0;
              
                // 환수 위험으로 업데이트
              targetResult.postManagementStatus = {
                ...targetResult.postManagementStatus,
                status: '환수위험',
                confidence: '위험',
                icon: '🚨',
                bgColor: 'bg-red-100',
                textColor: 'text-red-800',
                  description: `${decreaseResult.baseYear}년 인원(${decreaseYearEmployees}명)이 ${increaseYear}년 기준(${increaseYearEmployees}명) 미만으로 환수 위험`,
                isRisky: true,
                recallInfo: {
                  triggerYear: decreaseResult.baseYear,
                  triggerDecrease: decreaseResult.decreaseCount,
                  estimatedRecallAmount: estimatedRecallAmount
                }
              };
              
              // 환수 위험 플래그 추가
              targetResult.hasRecallRisk = true;
              targetResult.recallTrigger = {
                year: decreaseResult.baseYear,
                decreaseCount: decreaseResult.decreaseCount,
                estimatedRecallAmount: estimatedRecallAmount
              };
              } else {
                console.log(`✅ ${targetResult.baseYear}년 증가분 조건 충족: ${decreaseYearEmployees}명 >= ${increaseYearEmployees}명`);
                
                // 조건 충족 - 사후관리 통과
                targetResult.postManagementStatus = {
                  ...targetResult.postManagementStatus,
                  status: '사후관리통과',
                  confidence: '안전',
                  icon: '✅',
                  bgColor: 'bg-green-100',
                  textColor: 'text-green-800',
                  description: `${decreaseResult.baseYear}년 인원(${decreaseYearEmployees}명)이 ${increaseYear}년 기준(${increaseYearEmployees}명) 이상으로 조건 충족`,
                  isRisky: false
                };
              }
            }
          }
        });
      });
      
      console.log('🎯 세액공제 분석 결과 (환수 위험 반영):', combinedResults);
      return combinedResults;
    }

    // 📊 **클라이언트 계산 (Fallback) - 모든 변화 포함**
    console.log('🔄 클라이언트에서 전체 변화 분석 시작');
    
    // employeeData가 비어있으면 빈 배열 반환
    const employeeData = analysisData.employeeData;
    if (!employeeData || Object.keys(employeeData).length === 0) {
      console.log('❌ employeeData가 없어서 분석 불가');
      return [];
    }
    
    const currentDate = new Date();
    const years = Object.keys(employeeData).sort();
    console.log('🔍 추출된 years:', years);
    
    const detailedResults: any[] = [];

    // 🔧 **2019년 기준년도를 강제로 추가 (클라이언트 계산)**
    if (years.length > 0 && years[0] === '2019') {
      console.log('🔧 2019년 기준년도 강제 추가 (클라이언트)');
      detailedResults.push({
        baseYear: '2019',
        increaseCount: 0,
        adjustedYouthCount: 0,
        othersCount: 0,
        changeType: 'base', // 기준년도
        employmentCredit: { year1: { amount: 0, available: false }, year2: { amount: 0, available: false }, year3: { amount: 0, available: false } },
        socialCredit: { year1: { amount: 0, available: false }, year2: { amount: 0, available: false } },
        deadlines: null,
        availableTotal: 0,
        postManagementStatus: {
          status: '기준년도',
          confidence: '안전',
          icon: '📊',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-600',
          description: '2019년 기준년도 - 비교 기준',
          isRisky: false,
          isBaseYear: true
        }
      });
    }

    for (let i = 1; i < years.length; i++) {
      const currentYear = years[i];
      const previousYear = years[i-1];
      const currentEmployees = employeeData[currentYear];
      const previousEmployees = employeeData[previousYear];
      const changeCount = currentEmployees - previousEmployees;
      
      console.log(`🔍 ${currentYear}년 분석:`, {
        currentYear,
        previousYear,
        currentEmployees,
        previousEmployees,
        changeCount
      });
      
      // 📈 **증가한 경우 세액공제 계산**
      if (changeCount > 0) {
        // ... 기존 증가 계산 로직 유지 ...
        // 🚨 **경정청구 기한 계산 - 1차년도 기준으로 모든 연도 동일 적용**
        const getAmendmentDeadlines = (baseYear: string) => {
          const baseYearNum = parseInt(baseYear);
          // 📅 **중요**: 경정청구는 1차년도 귀속분 기준으로만 가능하므로 모든 연도 기한이 동일
          const amendmentDeadline = new Date(baseYearNum + 6, 2, 31); // 1차년도 기준 5년 후 3월 31일
          return {
            year1: { year: baseYearNum, deadline: amendmentDeadline },
            year2: { year: baseYearNum + 1, deadline: amendmentDeadline }, // 1차년도와 동일한 기한
            year3: { year: baseYearNum + 2, deadline: amendmentDeadline }  // 1차년도와 동일한 기한
          };
        };

        const deadlines = getAmendmentDeadlines(currentYear);
        
        const region = analysisData.companyInfo.region || '수도권';
        const youthRate = region === '수도권' ? 1100 : 1200;
        const othersRate = region === '수도권' ? 700 : 770;
        
        const params = yearlyParams[currentYear];
        const youthCount = params?.youthCount ?? 0;
        const socialInsurance = params?.socialInsurance ?? 120;
        const adjustedYouthCount = Math.min(youthCount, changeCount);
        const othersCount = changeCount - adjustedYouthCount;
        
        const employmentCreditPerYear = (adjustedYouthCount * youthRate + othersCount * othersRate) * 10000;
        const youthSocialCredit = adjustedYouthCount * socialInsurance * 10000 * 1.0;
        const othersSocialCredit = othersCount * socialInsurance * 10000 * 0.5;
        const socialCreditPerYear = youthSocialCredit + othersSocialCredit;

        const year1Available = currentDate <= deadlines.year1.deadline;
        const year2Available = currentDate <= deadlines.year2.deadline;
        const year3Available = currentDate <= deadlines.year3.deadline;

        const postManagementStatus = analyzePostManagementStatus(employeeData, currentYear);

        detailedResults.push({
          baseYear: currentYear,
          increaseCount: changeCount,
          adjustedYouthCount,
          othersCount,
          changeType: 'increase',
          employmentCredit: {
            year1: { amount: year1Available ? employmentCreditPerYear : 0, available: year1Available },
            year2: { amount: year2Available ? employmentCreditPerYear : 0, available: year2Available },
            year3: { amount: year3Available ? employmentCreditPerYear : 0, available: year3Available }
          },
          socialCredit: {
            year1: { amount: year1Available ? socialCreditPerYear : 0, available: year1Available },
            year2: { amount: year2Available ? socialCreditPerYear : 0, available: year2Available }
          },
          deadlines,
          availableTotal: 
            (year1Available ? employmentCreditPerYear + socialCreditPerYear : 0) +
            (year2Available ? employmentCreditPerYear + socialCreditPerYear : 0) +
            (year3Available ? employmentCreditPerYear : 0),
          postManagementStatus
        });
      }
      // 📉 **감소한 경우: 세액공제 금액 0원으로 포함**
      else if (changeCount < 0) {
        const decreaseCount = Math.abs(changeCount);
        console.log(`📉 ${currentYear}년 감소분: 세액공제 0원으로 포함`);
        
        const recallRisk = calculateRecallRisk(detailedResults, currentYear, decreaseCount);
        
        detailedResults.push({
          baseYear: currentYear,
          increaseCount: 0, // 증가량은 0
          decreaseCount: decreaseCount, // 감소량 기록
          changeCount: changeCount, // 원본 변화량 (음수)
          adjustedYouthCount: 0,
          othersCount: 0,
          changeType: 'decrease',
          // 모든 세액공제 금액을 0원으로 설정
          employmentCredit: { 
            year1: { amount: 0, available: false }, 
            year2: { amount: 0, available: false }, 
            year3: { amount: 0, available: false } 
          },
          socialCredit: { 
            year1: { amount: 0, available: false }, 
            year2: { amount: 0, available: false } 
          },
          deadlines: null,
          availableTotal: 0, // 총 신청가능액도 0원
          recallRisk,
          postManagementStatus: {
            status: '환수위험',
            confidence: '위험',
            icon: '🚨',
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            description: `${decreaseCount}명 감소로 인한 환수 위험`,
            isRisky: true,
            decreaseCount: decreaseCount
          }
        });
      }
      // 📊 **변화 없음(0명): 세액공제 0원으로 포함**
      else if (changeCount === 0) {
        console.log(`📊 ${currentYear}년 변화없음: 세액공제 0원으로 포함`);
        
        detailedResults.push({
          baseYear: currentYear,
          increaseCount: 0,
          adjustedYouthCount: 0,
          othersCount: 0,
          changeType: 'none',
          // 모든 세액공제 금액을 0원으로 설정
          employmentCredit: { 
            year1: { amount: 0, available: false }, 
            year2: { amount: 0, available: false }, 
            year3: { amount: 0, available: false } 
          },
          socialCredit: { 
            year1: { amount: 0, available: false }, 
            year2: { amount: 0, available: false } 
          },
          deadlines: null,
          availableTotal: 0, // 총 신청가능액도 0원
          postManagementStatus: {
            status: '변화없음',
            confidence: '안전',
            icon: '📊',
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-600',
            description: '인원 변화 없음 - 세액공제 해당 없음',
            isRisky: false,
            postManagementEndYear: null
          }
        });
      }
    }

    // 🚨 **감소분 발생 시 이전 연도들의 환수 위험 업데이트**
    const decreaseYears = detailedResults.filter(result => result.changeType === 'decrease');
    
    decreaseYears.forEach(decreaseResult => {
      const decreaseYear = parseInt(decreaseResult.baseYear);
      console.log(`🚨 ${decreaseResult.baseYear}년 감소 감지: 이전 연도들 환수 위험 업데이트`);
      
      // 🎯 **올바른 사후관리 기간 로직**: 증가년도 + 3년간 사후관리
      // 감소년도가 사후관리 기간에 포함되는 증가분들 찾기
      detailedResults.forEach(targetResult => {
        if (targetResult.changeType === 'increase') {
          const increaseYear = parseInt(targetResult.baseYear);
          const postManagementEndYear = increaseYear + 2; // 증가년도 포함 3년간 (0, 1, 2년 후)
          
          // 감소년도가 사후관리 기간 내에 있는지 확인
          if (decreaseYear >= increaseYear && decreaseYear <= postManagementEndYear) {
            // 🎯 **핵심**: 각 증가분의 기준 인원과 비교하여 개별 판단
            const increaseYearEmployees = employeeData[increaseYear.toString()] || 0;
            const decreaseYearEmployees = employeeData[decreaseYear.toString()] || 0;
            
            console.log(`🔍 ${targetResult.baseYear}년 증가분 사후관리 체크:`, {
              increaseYear,
              increaseYearEmployees,
              decreaseYear, 
              decreaseYearEmployees,
              isViolation: decreaseYearEmployees < increaseYearEmployees
            });
            
            // **개별 판단**: 감소년도 인원이 증가년도 기준 미만인 경우만 환수 위험
            if (decreaseYearEmployees < increaseYearEmployees) {
              console.log(`🚨 ${targetResult.baseYear}년 증가분 환수 위험: ${decreaseYearEmployees}명 < ${increaseYearEmployees}명`);
            
            // 환수 예상 금액 계산
            const estimatedRecallAmount = targetResult.availableTotal || 0;
            
              // 환수 위험으로 업데이트
            targetResult.postManagementStatus = {
              ...targetResult.postManagementStatus,
              status: '환수위험',
              confidence: '위험',
              icon: '🚨',
              bgColor: 'bg-red-100',
              textColor: 'text-red-800',
                description: `${decreaseResult.baseYear}년 인원(${decreaseYearEmployees}명)이 ${increaseYear}년 기준(${increaseYearEmployees}명) 미만으로 환수 위험`,
              isRisky: true,
              recallInfo: {
                triggerYear: decreaseResult.baseYear,
                triggerDecrease: decreaseResult.decreaseCount,
                estimatedRecallAmount: estimatedRecallAmount
              }
            };
            
            // 환수 위험 플래그 추가
            targetResult.hasRecallRisk = true;
            targetResult.recallTrigger = {
              year: decreaseResult.baseYear,
              decreaseCount: decreaseResult.decreaseCount,
              estimatedRecallAmount: estimatedRecallAmount
            };
            } else {
              console.log(`✅ ${targetResult.baseYear}년 증가분 조건 충족: ${decreaseYearEmployees}명 >= ${increaseYearEmployees}명`);
              
              // 조건 충족 - 사후관리 통과
              targetResult.postManagementStatus = {
                ...targetResult.postManagementStatus,
                status: '사후관리통과',
                confidence: '안전',
                icon: '✅',
                bgColor: 'bg-green-100',
                textColor: 'text-green-800',
                description: `${decreaseResult.baseYear}년 인원(${decreaseYearEmployees}명)이 ${increaseYear}년 기준(${increaseYearEmployees}명) 이상으로 조건 충족`,
                isRisky: false
              };
            }
          }
        }
      });
    });

    console.log('🎯 최종 detailedResults (환수 위험 반영):', detailedResults);
    return detailedResults;
  }, [analysisData, yearlyParams]);

  // 🚨 **사후관리 위반 위험 분석 (감소분만)**
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const riskAnalysis = useMemo(() => {
    if (!analysisData || !analysisData.employeeData) {
      return [];
    }

    console.log('🚨 사후관리 위반 위험 분석 시작');
    
    const employeeData = analysisData.employeeData;
    const years = Object.keys(employeeData).sort();
    const riskResults: any[] = [];

    for (let i = 1; i < years.length; i++) {
      const currentYear = years[i];
      const previousYear = years[i-1];
      const currentEmployees = employeeData[currentYear];
      const previousEmployees = employeeData[previousYear];
      const changeCount = currentEmployees - previousEmployees;
      
      // 📉 **감소한 경우만 위험 분석**
      if (changeCount < 0) {
        const decreaseCount = Math.abs(changeCount);
        console.log(`🚨 ${currentYear}년 위험 감지: ${decreaseCount}명 감소`);
        
        // 해당 연도부터 3년 전까지의 세액공제 환수 대상 찾기
        const recallRisk = calculateRecallRisk(detailedAnalysis, currentYear, decreaseCount);
        
        riskResults.push({
          baseYear: currentYear,
          decreaseCount: decreaseCount,
          changeCount: changeCount,
          changeType: 'decrease',
          recallRisk,
          postManagementStatus: {
            status: '환수위험',
            confidence: '위험',
            icon: '🚨',
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            description: `${decreaseCount}명 감소로 인한 환수 위험`,
            isRisky: true,
            decreaseCount: decreaseCount
          }
        });
      }
    }

    console.log('🚨 위험 분석 결과:', riskResults);
    return riskResults;
  }, [analysisData, detailedAnalysis]);

  // "좋은느낌" 샘플 데이터
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sampleData = {
    companyInfo: {
      bizno: '1234567890',
      companyName: '좋은느낌',
      region: '수도권',
      industry: '일반업종'
    },
    employeeData: {
      '2019': 11, '2020': 15, '2021': 15, '2022': 15, '2023': 18, '2024': 8, '2025': 18
    },
    analysisResults: [
      {
        year: '2019',
        increaseCount: 3,
        employmentCredit: 21000000,
        socialInsuranceCredit: 1500000,
        totalCredit: 22500000,
        status: '사후관리종료',
        classification: { icon: '💚', title: '즉시신청' },
        amendmentDeadline: '2025-03-31'
      }
    ],
    summary: {
      사후관리종료: 52500000,
      사후관리위반_추징대상: 25500000,
      총계: 52500000
    }
  };

  // 🏢 펜타플로 실제 데이터 (노트북LM 분석 기반)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pentaploSampleData = {
    companyInfo: {
      bizno: '1018197530',
      companyName: '(주)펜타플로',
      region: '수도권',
      industry: '일반업종'
    },
    employeeData: {
      '2019': 17, '2020': 17, '2021': 19, '2022': 23, '2023': 24, '2024': 14, '2025': 21
    },
    analysisResults: [],
    summary: {}
  };

  // 🏢 김종칠세무회계사무소 실제 데이터 (감소분 포함)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const kimJongChilSampleData = {
    companyInfo: {
      bizno: '1010138752',
      companyName: '김종칠세무회계사무소',
      region: '경기도',
      industry: '시흥시'
    },
    employeeData: {
      '2019': 4, '2020': 5, '2021': 5, '2022': 6, '2023': 5, '2024': 2, '2025': 6
    },
    analysisResults: [],
    summary: {}
  };

  // 🏢 테스트 회사 (1010123109) - 감소분 포함 테스트 데이터
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const testCompanySampleData = {
    companyInfo: {
      bizno: '1010123109',
      companyName: '테스트 주식회사',
      region: '서울특별시',
      industry: '서비스업'
    },
    employeeData: {
      '2018': 12, '2019': 15, '2020': 18, '2021': 16, '2022': 20, 
      '2023': 18, '2024': 15, '2025': 22
    },
    analysisResults: [],
    summary: {}
  };

  // 🔄 **통합 API 호출 함수** 사용
  const fetchAnalysisData = useCallback(async (inputBizno: string) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('📞 통합 API 호출 시작:', inputBizno);
      
      // 🌐 모든 사업자등록번호에 대해 API 호출 사용
      // (샘플 데이터 조건 제거하여 항상 실제 데이터 사용)

      // 🎯 **내장 데이터 생성** - API 호출로 실제 데이터 가져오기
      const mockData = await generateMockAnalysisData(inputBizno);
      console.log('🔍 생성된 분석 데이터:', mockData);
      
      // 🏢 중복 업종인 경우 null이 반환됨 (업종 선택 UI 표시)
      if (mockData === null) {
        console.log('🏢 업종 선택 UI 표시 상태 유지');
        setAnalysisData(null); // 명시적으로 null 설정
        return; // 더 이상 처리하지 않음
      }
      
      setAnalysisData(mockData);
      console.log('✅ 대시보드 데이터 설정 완료:', mockData.companyInfo.companyName);
      
    } catch (err: unknown) {
      console.error('❌ 통합 API 호출 오류:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // 🏢 다중 업종인 경우는 에러가 아니라 선택 상태로 처리
      if (errorMessage === 'MULTIPLE_INDUSTRIES') {
        console.log('🏢 업종 선택 UI 표시');
        // showIndustrySelector는 이미 true로 설정됨
        setError('');
      } else {
      setError('API 호출 중 오류가 발생했습니다: ' + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // URL 파라미터에서 bizno 확인 및 자동 분석 시작
  useEffect(() => {
    if (urlBizno) {
      console.log('🔍 URL에서 사업자등록번호 감지:', urlBizno);
      setBizno(urlBizno);
      // 🗑️ 사업자등록번호가 변경되면 기존 캐시 초기화
      setOptionEmployeeData({});
      
      // 🔗 **autoAnalyze 파라미터가 있으면 자동으로 분석 시작**
      if (autoAnalyze) {
        console.log('🔗 autoAnalyze=true 감지 - Visual에서 자동 분석 요청');
        fetchAnalysisData(urlBizno);
      } else {
        fetchAnalysisData(urlBizno);
      }
    } else {
      // 검색 페이지에서는 데이터 초기화
      setAnalysisData(null);
      setBizno('');
      setOptionEmployeeData({});
    }
    
    // URL 파라미터에서 사용자 입력값 복원 (연도별 파라미터로 변경됨)
    // 기존 URL 파라미터는 호환성을 위해 유지하되, 새로운 연도별 시스템에서는 각 연도별로 개별 관리
  }, [searchParams, fetchAnalysisData, urlBizno, autoAnalyze]);

  // 🔗 **Visual에서 전달받은 자동 확장 파라미터 처리**
  useEffect(() => {
    if (expandAll && analysisData && detailedAnalysis.length > 0) {
      console.log('🔗 expandAll=true 감지 - 모든 연도별 상세분석 자동 확장');
      
      // 2019년 이후 모든 연도를 자동으로 확장
      const allYearsToExpand = detailedAnalysis
        .filter(analysis => parseInt(analysis.baseYear) >= 2019)
        .map(analysis => analysis.baseYear);
      
      setExpandedYears(new Set(allYearsToExpand));
      console.log('✅ 자동 확장 완료:', allYearsToExpand);
    }
  }, [expandAll, analysisData, detailedAnalysis]);

  // 📊 **업종 옵션들의 연도별 데이터 가져오기**
  useEffect(() => {
    if (showIndustrySelector && industryOptions.length > 0 && bizno) {
      console.log('📊 업종 옵션들의 데이터 가져오기 시작', bizno);
      
      // 각 업종 옵션의 데이터를 병렬로 가져오기
      industryOptions.forEach(option => {
        if (option.id) {
          console.log('📊 API 호출 시작:', option.id, bizno);
          fetchOptionEmployeeData(option.id, bizno);
        }
      });
    }
  }, [showIndustrySelector, industryOptions, bizno, fetchOptionEmployeeData]);

  // 🏢 **업종 선택 처리 함수**
  const handleIndustrySelection = async (selectedOption: any) => {
    setSelectedIndustry(selectedOption);
    setShowIndustrySelector(false);
    setLoading(true);
    
    try {
      console.log('🏢 선택된 업종으로 분석 시작:', selectedOption);
      
      // 선택된 업종의 ID로 특정 레코드 분석 요청
      const response = await fetch(`https://taxcredit-api-func.azurewebsites.net/api/analyze?bizno=${bizno}&recordId=${selectedOption.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`API 오류: ${response.status} ${response.statusText}`);
      }
      
      const apiData = await response.json();
      console.log('✅ 선택된 업종 분석 완료:', apiData);
      
              // 🎯 연도별 직원 수 데이터만 추출 (업종 선택에서도)
      if (apiData.success && apiData.analysisResult) {
          console.log('📊 업종 선택 - API에서 받은 원본 DB 데이터:', apiData.data);
          
        const employeeData: {[key: string]: number} = {};
        
          // 연도 형태의 키만 추출 (4자리 숫자)
        if (apiData.data) {
            for (const [key, value] of Object.entries(apiData.data)) {
              if (key.match(/^\d{4}$/)) { // 4자리 연도인 경우만
                const year = parseInt(key);
                if (year >= 2019) { // 2019년부터만 (2019년 대비 2020년 증가분 계산 가능)
                  const numValue = parseInt(String(value)) || 0;
                  if (!isNaN(numValue)) {
                    employeeData[key] = numValue;
                  }
                }
              }
            }
          }
          
          console.log('📊 업종 선택 - 연도별 직원 수만 추출:', employeeData);
        
        const transformedData = {
          companyInfo: {
            bizno: apiData.bizno,
            companyName: apiData.data?.사업장명 || selectedOption.companyName,
            region: apiData.analysisResult.companyInfo?.region || '수도권',
            industry: selectedOption.industryName || '일반업종'
          },
          employeeData: employeeData,
          analysisResults: apiData.analysisResult.results || [],
          summary: apiData.analysisResult.summary || {}
        };
        
        setAnalysisData(transformedData);
        console.log('✅ 선택된 업종 데이터 설정 완료');
      }
      
    } catch (err) {
      console.error('❌ 업종 선택 후 분석 오류:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('선택된 업종 분석 중 오류가 발생했습니다: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 🔗 URL 파라미터 업데이트 함수 (연도별 시스템에서는 사용하지 않음)
  // 기존 호환성을 위해 유지하지만, 새로운 연도별 파라미터 시스템에서는 각 연도별로 개별 관리

  // 🎯 **내장 데이터 생성 함수**
  const generateMockAnalysisData = async (bizno: string) => {
    try {
      console.log('🌐 API 호출 시작:', bizno);
      
      const response = await fetch(`https://taxcredit-api-func.azurewebsites.net/api/analyze?bizno=${bizno}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`API 오류: ${response.status} ${response.statusText}`);
      }
      
      const apiData = await response.json();
      console.log('✅ API 응답 성공:', apiData);
      
      // 🔍 디버깅: 중복 업종 감지 조건 확인
      console.log('🔍 API 응답 상세 디버깅:');
      console.log('  - success:', apiData.success);
      console.log('  - multipleRecords:', apiData.multipleRecords);
      console.log('  - count:', apiData.count);
      console.log('  - options 길이:', apiData.options?.length);
      
      // 🏢 **다중 업종 응답 처리**
      if (apiData.success && apiData.multipleRecords) {
        console.log('🏢 다중 업종 감지:', apiData.count, '개');
        console.log('🔍 업종 옵션 데이터 구조:', apiData.options);
        // 각 옵션의 구조 확인
        if (apiData.options && apiData.options.length > 0) {
          console.log('🔍 첫 번째 옵션 상세:', apiData.options[0]);
          console.log('🔍 첫 번째 옵션의 모든 키:', Object.keys(apiData.options[0]));
        }
        setIndustryOptions(apiData.options);
        setShowIndustrySelector(true);
        setLoading(false); // 로딩 상태 해제
        // 특별한 응답으로 null 반환 (업종 선택 UI 표시를 위해)
        return null;
      }
      
      // 🔄 **API 응답 구조를 컴포넌트 기대 구조로 변환**
      if (apiData.success && apiData.analysisResult) {
        // 🎯 연도별 직원 수 데이터만 추출 (연도 형태 키만)
        console.log('📊 API에서 받은 원본 DB 데이터:', apiData.data);
        
        const employeeData: {[key: string]: number} = {};
        
        // 2019년부터만 추출 (경정청구 기한 고려)
        if (apiData.data) {
          for (const [key, value] of Object.entries(apiData.data)) {
            if (key.match(/^\d{4}$/)) { // 4자리 연도인 경우만
              const year = parseInt(key);
              if (year >= 2019) { // 2019년부터만
                const numValue = parseInt(String(value)) || 0;
                if (!isNaN(numValue)) {
                  employeeData[key] = numValue;
                }
              }
            }
          }
        }
        
        console.log('📊 연도별 직원 수만 추출:', employeeData);
        
        return {
          companyInfo: apiData.analysisResult.companyInfo || {
            bizno: apiData.bizno,
            companyName: apiData.data?.사업장명 || `회사 (${apiData.bizno})`,
            region: apiData.analysisResult.companyInfo?.region || '수도권',
            industry: apiData.analysisResult.companyInfo?.industry || '일반업종'
          },
          employeeData: employeeData,
          analysisResults: apiData.analysisResult.results || [],
          summary: apiData.analysisResult.summary || {}
        };
      }
      
      throw new Error('API 응답 형식이 올바르지 않습니다.');
    } catch (error) {
      console.error('❌ API 호출 오류:', error);
      // Mock 데이터 사용하지 않음 - API 오류는 오류로 처리
      throw error;
    }
  };

  // 🎯 **service의 유일한 계산 함수 사용**
  const formatCurrency = (amount: number) => {
    // undefined, null, NaN 처리
    if (!amount || amount === 0 || isNaN(amount)) return '0원';
    
    // 천의 자리마다 콤마 추가하여 가독성 향상
    if (amount >= 10000) {
      return `${(amount / 10000).toLocaleString()}만원`;
    } else {
      return `${amount.toLocaleString()}원`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg text-gray-600">🔍 종합 분석 중...</p>
          <p className="text-sm text-gray-500">고용세액공제 계산, 경정청구 기한, 위험도 평가를 진행하고 있습니다.</p>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧮 세액공제 분석 대시보드
          </h1>
          <p className="text-gray-600">
            사업자등록번호로 고용증대세액공제 분석 결과를 시각적으로 확인하세요
          </p>
        </div>

        {/* 입력 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle>🔍 분석 대상 조회</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사업자등록번호
                </label>
                <Input
                  {...{
                    type: "text",
                    placeholder: "1010109048 (실제 DB 조회) 입력",
                    value: bizno,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setBizno(e.target.value),
                    className: "w-full"
                  } as any}
                />
              </div>
              <Button 
                onClick={() => {
                  if (bizno) {
                    // 새로운 URL 구조로 이동: /dashboard/:bizno (연도별 개별 설정으로 변경)
                    navigate(`/dashboard/${bizno}`);
                  }
                }}
                disabled={!bizno || loading}
                className="w-full sm:w-auto px-8"
              >
                {loading ? '분석중...' : '분석 시작'}
              </Button>
            </div>
            
            {error && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            {/* 🏢 업종 선택 UI */}
            {showIndustrySelector && industryOptions.length > 0 && (
              <div className="mt-6 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-yellow-800 mb-2">
                    🏢 업종 선택 필요
                  </h3>
                  <p className="text-yellow-700 text-sm">
                    같은 사업자등록번호로 <strong>{industryOptions.length}개</strong>가 있습니다. 업종명이 다르네요.<br/>
                    분석할 업종을 선택해주세요.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {industryOptions.map((option, index) => (
                    <div 
                      key={option.id}
                      className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200 active:scale-95"
                      onClick={() => handleIndustrySelection(option)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1">
                            {option.companyName}
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">업종:</span> {option.industryName}
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">업종코드:</span> {option.industryCode}
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">지역:</span> {option.sido} {option.gugun}
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">설립일:</span> {option.establishedDate}
                          </div>
                          
                          {/* 연도별 인원 미니 테이블 */}
                          <div className="mt-3">
                            <div className="text-xs font-medium text-gray-700 mb-2">📊 연도별 인원수</div>
                            <div className="bg-gray-50 rounded-lg p-2">
                              {(() => {
                                // 캐시된 데이터 사용 또는 로딩 중 표시
                                const cacheKey = `${bizno}-${option.id}`;
                                const yearlyData = optionEmployeeData[cacheKey] || {};
                                const years = ['2019', '2020', '2021', '2022', '2023', '2024', '2025'];
                                const hasData = Object.keys(yearlyData).length > 0;
                                
                                // 데이터는 useEffect에서 자동으로 가져옴
                                console.log('🔍 미니테이블 렌더링:', option.id, cacheKey, hasData, yearlyData);
                                
                                return (
                                  <>
                                    <div className="grid grid-cols-7 gap-1 text-[10px] text-center">
                                      {/* 헤더 */}
                                      {years.map(year => (
                                        <div key={`header-${year}`} className="font-semibold text-gray-600 py-1">
                                          {year}
                                        </div>
                                      ))}
                                      
                                      {/* 인원수 데이터 */}
                                      {years.map(year => {
                                        const value = yearlyData[year];
                                        const hasYearData = value !== undefined && value !== null && !isNaN(value);
                                        
                                        return (
                                          <div 
                                            key={`data-${year}`} 
                                            className={`bg-white rounded px-1 py-1 font-bold ${
                                              year === '2024' ? 'text-orange-600' : 'text-blue-700'
                                            }`}
                                          >
                                            {!hasData ? '...' : hasYearData ? value : '-'}
                                          </div>
                                        );
                                      })}
                                    </div>
                                    
                                    {/* 증감 표시 */}
                                    {hasData && (
                                      <div className="grid grid-cols-6 gap-1 text-[9px] text-center mt-1">
                                        {years.slice(1).map((year, index) => {
                                          const currentYear = year;
                                          const previousYear = years[index];
                                          const currentValue = yearlyData[currentYear] || 0;
                                          const previousValue = yearlyData[previousYear] || 0;
                                          const change = currentValue - previousValue;
                                          
                                          let bgColor = 'bg-gray-400';
                                          if (change > 0) bgColor = 'bg-green-500';
                                          else if (change < 0) bgColor = 'bg-red-500';
                                          
                                          return (
                                            <div 
                                              key={`change-${year}`}
                                              className={`py-0.5 rounded text-white font-medium ${bgColor}`}
                                            >
                                              {change > 0 ? '+' : ''}{change || 0}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                    
                                    {/* 간단한 안내 */}
                                    <div className="text-[9px] text-gray-500 mt-1 text-center">
                                      {!hasData ? '🔄 데이터 로딩 중...' : '💡 2024년 데이터는 약 60% 정확도 (주황색 표시)'}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4 text-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold">{index + 1}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">선택</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowIndustrySelector(false);
                      setIndustryOptions([]);
                      setError('');
                    }}
                    className="text-gray-600 hover:text-gray-700"
                  >
                    취소
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 📊 **차트 데이터 생성 - API 결과 우선 활용**
  const generateChartData = () => {
    if (!analysisData) return [];

    console.log('📊 차트 데이터 생성 시작 (DB 데이터만 사용)');
    console.log('📊 employeeData:', analysisData.employeeData);
    console.log('📊 analysisResults:', analysisData.analysisResults);

    // 🎯 employeeData가 있으면 DB 데이터 그대로 사용 (보정 금지)
    if (analysisData.employeeData && Object.keys(analysisData.employeeData).length > 0) {
      console.log('✅ DB employeeData 그대로 사용');
      
      const chartYears: Array<{year: string, employees: number, change: number}> = [];
      const employeeData = analysisData.employeeData;
      const years = Object.keys(employeeData).sort();
      
      // DB에 있는 연도만 사용
      for (let i = 0; i < years.length; i++) {
        const year = years[i];
        const employees = employeeData[year];
        const prevEmployees = i === 0 ? employees : employeeData[years[i-1]];
        const change = i === 0 ? 0 : employees - prevEmployees;
        
        // 연도별 데이터 확인
        
        chartYears.push({
          year: year,
          employees: employees,
          change: change
        });
        
        console.log(`📊 ${year}년: DB 데이터 ${employees}명, 변화 ${change}명`);
      }
      
      return chartYears;
    }

    console.log('❌ employeeData가 없어서 차트 생성 불가');
    return [];
  };

  const chartData = generateChartData();
  console.log('📊 최종 chartData:', chartData);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 🎯 **헤더 - 고용이력부 스타일** */}
      <header className="bg-blue-700 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">세액공제 분석</h1>
          <p className="text-sm opacity-80 mt-1">고용증대 및 사회보험료 세액공제 분석 시스템</p>
          </div>
      </header>

      <main className="container mx-auto py-6 px-4 max-w-7xl space-y-6 md:space-y-8">
        {/* 🏢 **회사 정보 - 공통 컴포넌트 사용** */}
        <CompanyInfo 
          companyInfo={{
            bizno: analysisData.companyInfo.bizno,
            companyName: analysisData.companyInfo.companyName,
            region: analysisData.companyInfo.region,
            industry: analysisData.companyInfo.industry,
            sido: analysisData.companyInfo.sido,
            gugun: analysisData.companyInfo.gugun
          }}
          accessLevel="premium" // analyze에서는 프리미엄 레벨
          showFullDetails={true}
        />

      {/* 🏛️ 국민연금 가입인원 정보 블럭 (작업요청서_20250618_010) - 개발 중 숨김 */}
      <div className="space-y-4">
        {/* 🧪 국민연금 테스트 페이지 버튼 (요청서 Ui분리 국민연금블럭 20250619) - 개발자 전용 */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const testUrl = `/pension-test?bizNo=${encodeURIComponent(analysisData.companyInfo.bizno)}&companyName=${encodeURIComponent(analysisData.companyInfo.companyName)}`;
              window.open(testUrl, '_blank');
            }}
            className="text-xs opacity-60 hover:opacity-100 px-2 py-1 h-auto border-gray-300 text-gray-500 hover:text-gray-700 transition-opacity"
          >
            🧪 테스트
          </Button>
        </div>
        
        {/* 국민연금 블럭 - 기능 완성 전까지 숨김 */}
        {/* <PensionInfoBlock 
          defaultBizNo={analysisData.companyInfo.bizno} 
          companyName={analysisData.companyInfo.companyName}
        /> */}
      </div>

      {/* 📊 인원증감 현황 - 공통 컴포넌트 사용 */}
      <GrowthChart 
        chartData={chartData}
        accessLevel="premium" // analyze에서는 프리미엄 레벨
        showChart={true}
      />



      {/* 📊 상세 분석 결과 - 아코디언 형태 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">📊 연도별 상세 분석</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedYears(new Set(detailedAnalysis.filter(analysis => parseInt(analysis.baseYear) >= 2019).map((a: any) => a.baseYear)))}
            className="text-blue-600 hover:text-blue-700"
          >
            📂 모두 펼치기
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedYears(new Set())}
            className="text-gray-600 hover:text-gray-700"
          >
            📁 모두 접기
          </Button>
        </div>
      </div>

      {/* 🚨 2019년 이전 데이터 필터링 (경정청구 기한 만료) */}
      {detailedAnalysis.filter(analysis => parseInt(analysis.baseYear) >= 2019).map((analysis: any, index: number) => {
        const yearParams = getYearParams(analysis.baseYear, analysis.increaseCount);
        return (
        <Card key={index} className={`border-l-4 ${
          analysis.postManagementStatus?.isRisky || analysis.hasRecallRisk 
            ? 'border-l-orange-500' 
            : 'border-l-blue-500'
        }`}>
          <CardHeader 
            className="cursor-pointer hover:bg-gray-50 transition-colors duration-200"
            onClick={() => toggleYear(analysis.baseYear)}
          >
            <CardTitle className="flex items-center justify-between">
              {/* 왼쪽: 간결한 연도 라벨 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">
                  {analysis.baseYear}년
                </span>
                <div className="text-sm text-gray-400">
                  {isYearExpanded(analysis.baseYear) ? '🔽' : '▶️'}
                </div>
              </div>
              
              {/* 오른쪽: 핵심 비즈니스 정보 (크고 강조) */}
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                {/* 💰 신청가능 금액 - 가장 중요 (환수 위험 시 색상 변경) */}
                {analysis.changeType === 'increase' && !isYearExpanded(analysis.baseYear) && (
                  <div className="text-right">
                    <div className={`text-lg md:text-2xl font-bold ${
                      analysis.postManagementStatus?.isRisky || analysis.hasRecallRisk 
                        ? 'text-orange-700' 
                        : 'text-purple-700'
                    }`}>
                      {formatCurrency(analysis.availableTotal)}
                    </div>
                    <div className={`text-xs ${
                      analysis.postManagementStatus?.isRisky || analysis.hasRecallRisk 
                        ? 'text-orange-600' 
                        : 'text-purple-600'
                    }`}>
                      {analysis.postManagementStatus?.isRisky || analysis.hasRecallRisk ? '환수위험' : '신청가능'}
                    </div>
                  </div>
                )}
                
                {/* 👥 인원 변화 - 두 번째 중요 */}
                {analysis.changeType === 'increase' && (
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-700">
                      +{analysis.increaseCount}명
                    </div>
                    <div className="text-xs text-green-600">증가</div>
                  </div>
                )}
                {analysis.changeType === 'decrease' && (
                  <div className="text-right">
                    <div className="text-xl font-bold text-red-700">
                      -{analysis.decreaseCount}명
                    </div>
                    <div className="text-xs text-red-600">감소</div>
                  </div>
                )}
                {analysis.changeType === 'none' && (
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-600">
                      0명
                    </div>
                    <div className="text-xs text-gray-500">변화없음</div>
                  </div>
                )}
                {analysis.changeType === 'base' && (
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">
                      기준년도
                    </div>
                    <div className="text-xs text-blue-500">비교 기준</div>
                  </div>
                )}
                
                {/* 🚨 상태 - 세 번째 중요 */}
                <div className="text-right">
                  <div className={`text-lg font-semibold ${analysis.postManagementStatus?.textColor}`}>
                    {analysis.postManagementStatus?.confidence}
                  </div>
                  <div className="text-xs text-gray-500">
                    {analysis.postManagementStatus?.icon} 상태
                  </div>
                </div>
              </div>
            </CardTitle>
            {/* 보조 설명 정보 - 작고 덜 눈에 띄게 */}
            <div className="text-xs text-gray-500 space-x-3">
              {analysis.changeType === 'increase' && (
                <>
                  <span>청년등 {yearParams.youthCount}명, 청년외 {analysis.increaseCount - yearParams.youthCount}명</span>
                  {!isYearExpanded(analysis.baseYear) && (
                    <span>• 사회보험료 {yearParams.socialInsurance}만원/년</span>
                  )}
                </>
              )}
              {analysis.changeType === 'decrease' && (
                <span>환수 위험 분석 대상</span>
              )}
              {analysis.changeType === 'none' && (
                <span>세액공제 해당 없음</span>
              )}
              {analysis.changeType === 'base' && (
                <span>기준년도 - 비교 기준</span>
              )}
              <span className="text-blue-500">
                {isYearExpanded(analysis.baseYear) ? '▲ 접기' : '▼ 자세히'}
              </span>
            </div>
          </CardHeader>
          
          {/* 아코디언 콘텐츠 - 조건부 렌더링 */}
          {isYearExpanded(analysis.baseYear) && (
            <CardContent className="border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-6">
            

              
              {/* 📈 증가분인 경우: 세액공제 계산 조정 */}
              {analysis.changeType === 'increase' && (
                <>
                  {/* 🎛️ 연도별 개별 계산 조정 패널 */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                      🎛️ {analysis.baseYear}년 전용 계산 조정
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                        증가인원 {analysis.increaseCount}명 중
                      </Badge>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          청년등 인원 수 (최대 {analysis.increaseCount}명)
                        </label>
                        <Input
                          {...{
                            type: "number",
                            min: "0",
                            max: analysis.increaseCount,
                            value: yearParams.youthCount,
                            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                              const value = Math.min(parseInt(e.target.value) || 0, analysis.increaseCount);
                              updateYearParams(analysis.baseYear, 'youthCount', value);
                            },
                            className: "w-full",
                            placeholder: `0~${analysis.increaseCount}명`
                          } as any}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          만 15~34세, 장애인, 60세 이상, 경력단절 여성 등
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          1인당 연간 사회보험료 (만원)
                        </label>
                        <Input
                          {...{
                            type: "number",
                            min: "0",
                            step: "10",
                            value: yearParams.socialInsurance,
                            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                              const value = parseInt(e.target.value) || 0; // 0원까지 설정 가능
                              updateYearParams(analysis.baseYear, 'socialInsurance', value);
                            },
                            className: "w-full",
                            placeholder: "사회보험료 입력 (0원부터 가능)"
                          } as any}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {analysis.baseYear}년 회사 부담분 기준
                        </p>
                      </div>
                    </div>
                    
                    {/* 계산 상태 표시 */}
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <div className="text-gray-600">
                        👥 현재 설정: 청년등 <span className="font-semibold text-green-600">{yearParams.youthCount}명</span>, 
                        청년외 <span className="font-semibold text-blue-600">{analysis.increaseCount - yearParams.youthCount}명</span>
                      </div>
                      <Badge className={yearParams.youthCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                        {yearParams.youthCount > 0 ? '✅ 최적화됨' : '⚠️ 조정필요'}
                      </Badge>
                    </div>
                  </div>
                </>
              )}

              {/* 📊 변화 없음인 경우: 해당 없음 표시 */}
              {analysis.changeType === 'none' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    📊 {analysis.baseYear}년 인원 변화 없음
                    <Badge className="bg-gray-100 text-gray-600 text-xs">
                      변화 없음 (0명)
                    </Badge>
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-100 border border-gray-300 rounded">
                      <div className="text-sm font-medium text-gray-700 mb-2">📋 세액공제 해당 없음</div>
                      <div className="text-xs text-gray-600">
                        • {analysis.baseYear}년에는 전년 대비 인원 변화가 없습니다.
                      </div>
                      <div className="text-xs text-gray-600">
                        • 고용증대세액공제는 인원이 증가한 경우에만 적용됩니다.
                      </div>
                      <div className="text-xs text-gray-600">
                        • 이 연도는 세액공제 신청 대상이 아닙니다.
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="text-sm font-medium text-blue-800 mb-2">✅ 참고 정보</div>
                      <div className="text-xs text-blue-700">
                        • 인원 변화가 없어서 세액공제 해당 사항이 없음을 명시적으로 표시합니다.
                      </div>
                      <div className="text-xs text-blue-700">
                        • 이는 누락이 아니라 정상적인 분석 결과입니다.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 📉 감소분인 경우: 환수 위험 경고만 표시 */}
              {analysis.changeType === 'decrease' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                    🚨 {analysis.baseYear}년 인원 감소 위험 분석
                    <Badge className="bg-red-100 text-red-800 text-xs">
                      {analysis.decreaseCount || Math.abs(analysis.increaseCount)}명 감소
                    </Badge>
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-red-100 border border-red-300 rounded">
                      <div className="text-sm font-medium text-red-800 mb-2">⚠️ 사후관리 위반 경고</div>
                      <div className="text-xs text-red-700">
                        • {analysis.baseYear}년에 {analysis.decreaseCount || Math.abs(analysis.increaseCount)}명의 인원 감소가 발생했습니다.
                      </div>
                      <div className="text-xs text-red-700">
                        • 고용증대세액공제를 받은 경우 3년 소급하여 환수될 위험이 있습니다.
                      </div>
                      <div className="text-xs text-red-700">
                        • 즉시 세무 전문가와 상담하여 대응 방안을 마련하시기 바랍니다.
                      </div>
                    </div>
                    
                    {/* 환수 위험 상세 정보 */}
                    {analysis.recallRisk && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                        <div className="text-sm font-medium text-orange-800 mb-2">💰 예상 환수 대상</div>
                        <div className="text-xs text-orange-700">
                          {analysis.recallRisk.description}
                        </div>
                        {analysis.recallRisk.recallTargets?.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-orange-700 font-medium">환수 대상 연도:</div>
                            {analysis.recallRisk.recallTargets.map((target: any, idx: number) => (
                              <div key={idx} className="text-xs text-orange-600 ml-2">
                                • {target.year}년: 약 {formatCurrency(target.estimatedRecallAmount)} 환수 예상
                              </div>
                            ))}
                            <div className="text-xs text-orange-800 font-medium mt-1">
                              총 예상 환수액: {formatCurrency(analysis.recallRisk.totalRecallAmount)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 📅 기준년도인 경우: 기준년도 설명 */}
              {analysis.changeType === 'base' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    📅 {analysis.baseYear}년 기준년도
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      비교 기준
                    </Badge>
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-100 border border-blue-300 rounded">
                      <div className="text-sm font-medium text-blue-800 mb-2">📊 기준년도 역할</div>
                      <div className="text-xs text-blue-700">
                        • {analysis.baseYear}년은 인원 변화 계산의 기준이 되는 연도입니다.
                      </div>
                      <div className="text-xs text-blue-700">
                        • 다음 연도부터의 인원 증감이 이 연도와 비교되어 계산됩니다.
                      </div>
                      <div className="text-xs text-blue-700">
                        • 기준년도 자체는 세액공제 대상이 아닙니다.
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                      <div className="text-sm font-medium text-gray-800 mb-2">ℹ️ 참고 사항</div>
                      <div className="text-xs text-gray-700">
                        • 고용증대세액공제는 전년 대비 인원이 증가한 경우에만 적용됩니다.
                      </div>
                      <div className="text-xs text-gray-700">
                        • 경정청구 기한 고려하여 2019년부터 분석을 시작합니다.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 🚨 사후관리 상태 상세 정보 (기준년도 제외) */}
              <div className={`${analysis.postManagementStatus?.bgColor} border border-opacity-50 rounded-lg p-4`}>
                <h4 className={`font-semibold ${analysis.postManagementStatus?.textColor} mb-3 flex items-center gap-2`}>
                  {analysis.postManagementStatus?.icon} 사후관리 상태 분석
                  <Badge className={`${analysis.postManagementStatus?.bgColor} ${analysis.postManagementStatus?.textColor} text-xs`}>
                    {analysis.postManagementStatus?.status}
                  </Badge>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">상태</div>
                    <div className={`text-sm ${analysis.postManagementStatus?.textColor}`}>
                      {analysis.postManagementStatus?.description}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">사후관리 기간</div>
                    <div className="text-sm text-gray-600">
                      {analysis.changeType === 'increase' 
                        ? `${analysis.baseYear}년 ~ ${analysis.postManagementStatus?.postManagementEndYear}년 (3년간)`
                        : `인원 감소로 인한 즉시 위험`}
                    </div>
                  </div>
                </div>

                {/* 위험 상세 정보 (인원 감소가 있는 경우) */}
                {analysis.postManagementStatus?.isRisky && analysis.postManagementStatus?.riskDetails?.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <div className="text-sm font-medium text-red-800 mb-2">⚠️ 인원 감소 감지</div>
                    {analysis.postManagementStatus.riskDetails.map((risk: any, idx: number) => (
                      <div key={idx} className="text-xs text-red-700">
                        • {risk.year}년: {risk.previousEmployees}명 → {risk.currentEmployees}명 ({risk.decrease}명 감소)
                      </div>
                    ))}
                    <div className="text-xs text-red-600 mt-1 font-medium">
                      → 총 {analysis.postManagementStatus.totalDecrease}명 감소로 추징 위험
                    </div>
                  </div>
                )}

                {/* 안전 메시지 */}
                {analysis.postManagementStatus?.status === '사후관리완료' && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="text-sm text-green-800">
                      ✅ 사후관리가 완료되어 <strong>안전하게 세액공제를 받을 수 있습니다</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* 📈 증가분인 경우에만 세액공제 정보 표시 */}
              {analysis.changeType === 'increase' && (
                <>
                  {/* 고용증대세액공제 */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">💰 고용증대세액공제 (최대 3년간)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">1차년도 ({analysis.baseYear}년)</span>
                          <Badge className={analysis.employmentCredit?.year1?.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {analysis.employmentCredit?.year1?.available ? '💚 신청가능' : '❌ 기한만료'}
                          </Badge>
                        </div>
                        <div className="text-lg font-bold text-blue-600">
                          {formatCurrency(analysis.employmentCredit?.year1?.amount || 0)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          경정청구 마감: {analysis.deadlines?.year1?.deadline?.toLocaleDateString?.('ko-KR') || 'N/A'}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">2차년도 ({analysis.deadlines?.year2?.year || 'N/A'}년)</span>
                          <Badge className={analysis.employmentCredit?.year2?.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {analysis.employmentCredit?.year2?.available ? '💚 신청가능' : '❌ 기한만료'}
                          </Badge>
                        </div>
                        <div className="text-lg font-bold text-blue-600">
                          {formatCurrency(analysis.employmentCredit?.year2?.amount || 0)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          경정청구 마감: {analysis.deadlines?.year2?.deadline?.toLocaleDateString?.('ko-KR') || 'N/A'}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">3차년도 ({analysis.deadlines?.year3?.year || 'N/A'}년)</span>
                          <Badge className={analysis.employmentCredit?.year3?.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {analysis.employmentCredit?.year3?.available ? '💚 신청가능' : '❌ 기한만료'}
                          </Badge>
                        </div>
                        <div className="text-lg font-bold text-blue-600">
                          {formatCurrency(analysis.employmentCredit?.year3?.amount || 0)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          경정청구 마감: {analysis.deadlines?.year3?.deadline?.toLocaleDateString?.('ko-KR') || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 사회보험료세액공제 */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">🛡️ 사회보험료세액공제 (최대 2년간)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">1차년도 ({analysis.baseYear}년)</span>
                          <Badge className={analysis.socialCredit?.year1?.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {analysis.socialCredit?.year1?.available ? '💚 신청가능' : '❌ 기한만료'}
                          </Badge>
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(analysis.socialCredit?.year1?.amount || 0)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          청년등 100% + 청년외 50% 공제
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">2차년도 ({analysis.deadlines?.year2?.year || 'N/A'}년)</span>
                          <Badge className={analysis.socialCredit?.year2?.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {analysis.socialCredit?.year2?.available ? '💚 신청가능' : '❌ 기한만료'}
                          </Badge>
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(analysis.socialCredit?.year2?.amount || 0)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          청년등 100% + 청년외 50% 공제
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 총 신청 가능 금액 (증가분만) */}
                  <div className="bg-purple-50 border-2 border-purple-200 p-6 rounded-lg">
                    <h4 className="font-semibold mb-2 text-purple-800">💎 현재 신청 가능한 총 세액공제액</h4>
                    <div className="text-4xl font-bold text-purple-700">
                      {formatCurrency(analysis.availableTotal || 0)}
                    </div>
                    <p className="text-sm text-purple-600 mt-2">
                      경정청구 기한이 남은 연도분만 합계 (기한 만료분 제외)
                    </p>
                  </div>
                </>
              )}
            </div>
            </CardContent>
          )}
        </Card>
        );
      })}

      {/* 📋 종합 분석 표 */}
      <Card>
        <CardHeader>
          <CardTitle>📋 종합 분석 표</CardTitle>
          <p className="text-sm text-gray-600">연도별 세액공제 상세 내역을 표 형태로 정리한 결과입니다</p>
          {/* 🔍 디버깅 정보 추가 */}
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
            🔍 분석된 데이터: {detailedAnalysis.filter(analysis => parseInt(analysis.baseYear) >= 2019).length}건 (2019년 이후) | 
            총 신청가능액: {formatCurrency(detailedAnalysis.filter(analysis => parseInt(analysis.baseYear) >= 2019).reduce((sum: number, a: any) => sum + (a.availableTotal || 0), 0))}
          </div>
        </CardHeader>
        <CardContent>
          {/* 🚨 2019년 이전 데이터 필터링 */}
          {(() => {
            const filteredAnalysis = detailedAnalysis.filter(analysis => parseInt(analysis.baseYear) >= 2019);
            
            return filteredAnalysis.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">📊 분석할 데이터가 없습니다</p>
                <p className="text-sm text-gray-400">
                  2019년 이후 인원 증가가 있는 연도가 없거나 분석 중입니다.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-3 py-2 text-left">증가연도</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">증가인원</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">구분</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">공제연도</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">고용증대세액공제</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">사회보험료세액공제</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">합계</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">경정청구기한</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">신청가능</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnalysis.map((analysis: any, index: number) => {
                  const rows = [];
                  
                  // 🔍 각 분석 항목의 값들을 콘솔에 출력
                  console.log(`📊 표 렌더링 - ${analysis.baseYear}년:`, {
                    changeType: analysis.changeType,
                    increaseCount: analysis.increaseCount,
                    employmentCredit: analysis.employmentCredit,
                    socialCredit: analysis.socialCredit,
                    availableTotal: analysis.availableTotal,
                    recallRisk: analysis.recallRisk
                  });
                  
                  // 📅 **기준년도 표시**
                  if (analysis.changeType === 'base') {
                    rows.push(
                      <tr key={`${analysis.baseYear}-base`} className="bg-blue-50 hover:bg-blue-100">
                        <td className="border border-gray-300 px-3 py-2 font-semibold text-blue-700">
                          {analysis.baseYear}년<br/>
                          <span className="text-sm text-blue-600">기준년도</span>
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-blue-600">비교 기준</td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-blue-600">-</td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-blue-600">-</td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-gray-400">해당없음</td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-gray-400">해당없음</td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-gray-400">-</td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-gray-400">-</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          <Badge className="bg-blue-100 text-blue-800 text-xs">📅 기준년도</Badge>
                        </td>
                      </tr>
                    );
                  }
                  // 📈 **증가분 표시 (환수 위험 구분)**
                  else if (analysis.changeType === 'increase') {
                    // 환수 위험 여부 확인
                    const isRecallRisk = analysis.hasRecallRisk;
                    const rowBgClass = isRecallRisk ? "hover:bg-orange-50 bg-orange-25" : "hover:bg-gray-50";
                    const cellBgClass = isRecallRisk ? "bg-orange-50" : "";
                    
                    // 1차년도 행
                    rows.push(
                      <tr key={`${analysis.baseYear}-1`} className={rowBgClass}>
                        <td className={`border border-gray-300 px-3 py-2 font-semibold ${cellBgClass}`} rowSpan={3}>
                          {analysis.baseYear}년<br/>
                          <span className={`text-sm ${isRecallRisk ? 'text-orange-600' : 'text-green-600'}`}>
                            +{analysis.increaseCount}명
                          </span><br/>
                          <span className="text-xs text-gray-500">
                            청년등 {analysis.adjustedYouthCount || 0}명<br/>
                            청년외 {analysis.othersCount || 0}명
                          </span>
                          {isRecallRisk && (
                            <div className="text-xs text-orange-600 font-medium mt-1">
                              🚨 {analysis.recallTrigger?.year}년 감소로<br/>
                              환수 위험
                            </div>
                          )}
                        </td>
                        <td className={`border border-gray-300 px-3 py-2 text-center ${cellBgClass}`} rowSpan={3}>
                          <div className="font-semibold">{analysis.increaseCount}명</div>
                          <div className="text-xs text-gray-500">
                            청년등: {analysis.adjustedYouthCount || 0}명<br/>
                            청년외: {analysis.othersCount || 0}명
                          </div>
                        </td>
                        <td className={`border border-gray-300 px-3 py-2 text-center font-medium ${cellBgClass}`}>1차년</td>
                        <td className={`border border-gray-300 px-3 py-2 text-center font-semibold ${cellBgClass}`}>
                          {analysis.baseYear}년
                        </td>
                        <td className={`border border-gray-300 px-3 py-2 text-right ${cellBgClass}`}>
                          <span className={
                            isRecallRisk 
                              ? 'text-orange-600 font-semibold line-through' 
                              : analysis.employmentCredit?.year1?.available 
                                ? 'text-blue-600 font-semibold' 
                                : 'text-gray-400 line-through'
                          }>
                            {formatCurrency(analysis.employmentCredit?.year1?.amount || 0)}
                          </span>
                          {isRecallRisk && (
                            <div className="text-xs text-orange-600">환수 대상</div>
                          )}
                        </td>
                        <td className={`border border-gray-300 px-3 py-2 text-right ${cellBgClass}`}>
                          <span className={
                            isRecallRisk 
                              ? 'text-orange-600 font-semibold line-through' 
                              : analysis.socialCredit?.year1?.available 
                                ? 'text-green-600 font-semibold' 
                                : 'text-gray-400 line-through'
                          }>
                            {formatCurrency(analysis.socialCredit?.year1?.amount || 0)}
                          </span>
                          {isRecallRisk && (
                            <div className="text-xs text-orange-600">환수 대상</div>
                          )}
                        </td>
                        <td className={`border border-gray-300 px-3 py-2 text-right font-bold ${cellBgClass}`}>
                          <span className={
                            isRecallRisk 
                              ? 'text-orange-600 line-through' 
                              : analysis.employmentCredit?.year1?.available 
                                ? 'text-purple-600' 
                                : 'text-gray-400 line-through'
                          }>
                            {formatCurrency((analysis.employmentCredit?.year1?.amount || 0) + (analysis.socialCredit?.year1?.amount || 0))}
                          </span>
                        </td>
                        <td className={`border border-gray-300 px-3 py-2 text-xs ${cellBgClass}`}>
                          {isRecallRisk ? '환수 위험' : analysis.deadlines?.year1?.deadline?.toLocaleDateString?.('ko-KR') || 'N/A'}
                        </td>
                        <td className={`border border-gray-300 px-3 py-2 text-center ${cellBgClass}`}>
                          {isRecallRisk ? (
                            <Badge className="bg-orange-100 text-orange-800 text-xs">🚨 환수위험</Badge>
                          ) : analysis.employmentCredit?.year1?.available ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">✓ 가능</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 text-xs">✗ 만료</Badge>
                          )}
                        </td>
                      </tr>
                    );
                    
                    // 2차년도 행
                    rows.push(
                      <tr key={`${analysis.baseYear}-2`} className={rowBgClass}>
                        <td className={`border border-gray-300 px-3 py-2 text-center font-medium ${cellBgClass}`}>2차년</td>
                        <td className={`border border-gray-300 px-3 py-2 text-center font-semibold ${cellBgClass}`}>
                          {analysis.deadlines?.year2?.year || 'N/A'}년
                        </td>
                        <td className={`border border-gray-300 px-3 py-2 text-right ${cellBgClass}`}>
                          <span className={
                            isRecallRisk 
                              ? 'text-orange-600 font-semibold line-through' 
                              : analysis.employmentCredit?.year2?.available 
                                ? 'text-blue-600 font-semibold' 
                                : 'text-gray-400 line-through'
                          }>
                            {formatCurrency(analysis.employmentCredit?.year2?.amount || 0)}
                          </span>
                          {isRecallRisk && (
                            <div className="text-xs text-orange-600">환수 대상</div>
                          )}
                        </td>
                        <td className={`border border-gray-300 px-3 py-2 text-right ${cellBgClass}`}>
                          <span className={
                            isRecallRisk 
                              ? 'text-orange-600 font-semibold line-through' 
                              : analysis.socialCredit?.year2?.available 
                                ? 'text-green-600 font-semibold' 
                                : 'text-gray-400 line-through'
                          }>
                            {formatCurrency(analysis.socialCredit?.year2?.amount || 0)}
                          </span>
                          {isRecallRisk && (
                            <div className="text-xs text-orange-600">환수 대상</div>
                          )}
                        </td>
                        <td className={`border border-gray-300 px-3 py-2 text-right font-bold ${cellBgClass}`}>
                          <span className={
                            isRecallRisk 
                              ? 'text-orange-600 line-through' 
                              : analysis.employmentCredit?.year2?.available 
                                ? 'text-purple-600' 
                                : 'text-gray-400 line-through'
                          }>
                            {formatCurrency((analysis.employmentCredit?.year2?.amount || 0) + (analysis.socialCredit?.year2?.amount || 0))}
                          </span>
                        </td>
                        <td className={`border border-gray-300 px-3 py-2 text-xs ${cellBgClass}`}>
                          {isRecallRisk ? '환수 위험' : analysis.deadlines?.year2?.deadline?.toLocaleDateString?.('ko-KR') || 'N/A'}
                        </td>
                        <td className={`border border-gray-300 px-3 py-2 text-center ${cellBgClass}`}>
                          {isRecallRisk ? (
                            <Badge className="bg-orange-100 text-orange-800 text-xs">🚨 환수위험</Badge>
                          ) : analysis.employmentCredit?.year2?.available ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">✓ 가능</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 text-xs">✗ 만료</Badge>
                          )}
                        </td>
                      </tr>
                    );
                    
                    // 3차년도 행 (고용증대세액공제만)
                    rows.push(
                      <tr key={`${analysis.baseYear}-3`} className={rowBgClass}>
                        <td className={`border border-gray-300 px-3 py-2 text-center font-medium ${cellBgClass}`}>3차년</td>
                        <td className={`border border-gray-300 px-3 py-2 text-center font-semibold ${cellBgClass}`}>
                          {analysis.deadlines?.year3?.year || 'N/A'}년
                        </td>
                        <td className={`border border-gray-300 px-3 py-2 text-right ${cellBgClass}`}>
                          <span className={
                            isRecallRisk 
                              ? 'text-orange-600 font-semibold line-through' 
                              : analysis.employmentCredit?.year3?.available 
                                ? 'text-blue-600 font-semibold' 
                                : 'text-gray-400 line-through'
                          }>
                            {formatCurrency(analysis.employmentCredit?.year3?.amount || 0)}
                          </span>
                          {isRecallRisk && (
                            <div className="text-xs text-orange-600">환수 대상</div>
                          )}
                        </td>
                        <td className={`border border-gray-300 px-3 py-2 text-center text-gray-500 ${cellBgClass}`}>
                          - (2년만 적용)
                        </td>
                        <td className={`border border-gray-300 px-3 py-2 text-right font-bold ${cellBgClass}`}>
                          <span className={
                            isRecallRisk 
                              ? 'text-orange-600 line-through' 
                              : analysis.employmentCredit?.year3?.available 
                                ? 'text-purple-600' 
                                : 'text-gray-400 line-through'
                          }>
                            {formatCurrency(analysis.employmentCredit?.year3?.amount || 0)}
                          </span>
                        </td>
                        <td className={`border border-gray-300 px-3 py-2 text-xs ${cellBgClass}`}>
                          {isRecallRisk ? '환수 위험' : analysis.deadlines?.year3?.deadline?.toLocaleDateString?.('ko-KR') || 'N/A'}
                        </td>
                        <td className={`border border-gray-300 px-3 py-2 text-center ${cellBgClass}`}>
                          {isRecallRisk ? (
                            <Badge className="bg-orange-100 text-orange-800 text-xs">🚨 환수위험</Badge>
                          ) : analysis.employmentCredit?.year3?.available ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">✓ 가능</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 text-xs">✗ 만료</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  }
                  
                  // 📉 **감소분 표시 (환수 위험)**
                  else if (analysis.changeType === 'decrease') {
                    rows.push(
                      <tr key={`${analysis.baseYear}-decrease`} className="hover:bg-red-50 bg-red-25">
                        <td className="border border-gray-300 px-3 py-2 font-semibold bg-red-50">
                          {analysis.baseYear}년<br/>
                          <span className="text-sm text-red-600">{analysis.decreaseCount || Math.abs(analysis.increaseCount)}명 감소</span><br/>
                          <span className="text-xs text-red-500">
                            🚨 사후관리 위반
                          </span>
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center bg-red-50">
                          <div className="font-semibold text-red-600">{analysis.decreaseCount || Math.abs(analysis.increaseCount)}명</div>
                          <div className="text-xs text-red-500">인원 감소</div>
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center font-medium bg-red-50">위반연도</td>
                        <td className="border border-gray-300 px-3 py-2 text-center font-semibold bg-red-50">
                          {analysis.baseYear}년
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-red-500" colSpan={3}>
                          🚨 사후관리 위반으로 인한 이전 연도 환수 위험
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-xs bg-red-50">
                          즉시 검토 필요
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center bg-red-50">
                          <Badge className="bg-red-100 text-red-800 text-xs">🚨 위반</Badge>
                        </td>
                      </tr>
                    );
                  }
                  
                  // 📊 **변화 없음 표시 (해당 없음)**
                  else if (analysis.changeType === 'none') {
                    rows.push(
                      <tr key={`${analysis.baseYear}-none`} className="hover:bg-gray-50 bg-gray-25">
                        <td className="border border-gray-300 px-3 py-2 font-semibold bg-gray-50">
                          {analysis.baseYear}년<br/>
                          <span className="text-sm text-gray-600">변화 없음 (0명)</span><br/>
                          <span className="text-xs text-gray-500">
                            📊 해당 없음
                          </span>
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center bg-gray-50">
                          <div className="font-semibold text-gray-600">0명</div>
                          <div className="text-xs text-gray-500">변화 없음</div>
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center font-medium bg-gray-50">해당없음</td>
                        <td className="border border-gray-300 px-3 py-2 text-center font-semibold bg-gray-50">
                          {analysis.baseYear}년
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-gray-500" colSpan={3}>
                          📊 인원 변화 없음 - 세액공제 해당 없음
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-xs bg-gray-50">
                          해당 없음
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center bg-gray-50">
                          <Badge className="bg-gray-100 text-gray-600 text-xs">📊 정상</Badge>
                        </td>
                      </tr>
                    );
                  }
                  
                  return rows;
                })}
                
                {/* 총합계 행 */}
                <tr className="bg-blue-50 font-bold">
                  <td className="border border-gray-300 px-3 py-2 text-center" colSpan={4}>
                    💎 신청 가능 총액 (기한만료 제외)
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-blue-600">
                    {formatCurrency(filteredAnalysis.reduce((sum: number, a: any) => 
                      sum + (a.employmentCredit?.year1?.amount || 0) + (a.employmentCredit?.year2?.amount || 0) + (a.employmentCredit?.year3?.amount || 0), 0))}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-green-600">
                    {formatCurrency(filteredAnalysis.reduce((sum: number, a: any) => 
                      sum + (a.socialCredit?.year1?.amount || 0) + (a.socialCredit?.year2?.amount || 0), 0))}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-purple-600 text-lg">
                    {formatCurrency(filteredAnalysis.reduce((sum: number, a: any) => sum + (a.availableTotal || 0), 0))}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center" colSpan={2}>
                    <Badge className="bg-purple-100 text-purple-800">총 {filteredAnalysis.length}건 분석 (2019년 이후)</Badge>
                  </td>
                </tr>
                  </tbody>
                </table>
              </div>
            );
          })()}
          
          {/* 표 범례 */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">📋 표 해석 가이드</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-gray-700 mb-1">💰 세액공제 종류</h5>
                <ul className="text-gray-600 space-y-1">
                  <li>• <span className="text-blue-600 font-semibold">고용증대세액공제</span>: 최대 3년간 적용</li>
                  <li>• <span className="text-green-600 font-semibold">사회보험료세액공제</span>: 최대 2년간 적용</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-700 mb-1">🎯 신청 가능 상태</h5>
                <ul className="text-gray-600 space-y-1">
                  <li>• <Badge className="bg-green-100 text-green-800 text-xs">✓ 가능</Badge>: 경정청구 기한 내 신청 가능</li>
                  <li>• <Badge className="bg-red-100 text-red-800 text-xs">✗ 만료</Badge>: 경정청구 기한 경과로 신청 불가</li>
                  <li>• <Badge className="bg-orange-100 text-orange-800 text-xs">🚨 환수위험</Badge>: 사후관리 위반으로 환수 대상</li>
                  <li>• <Badge className="bg-red-100 text-red-800 text-xs">🚨 위반</Badge>: 인원 감소 발생 연도</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 💡 연도별 개별 조정 안내 */}
      <Card>
        <CardHeader>
          <CardTitle>🎛️ 계산 조정 안내</CardTitle>
          <p className="text-sm text-gray-600">
            각 연도별로 증가한 인원 구성이 다를 수 있으므로, <strong>연도별 개별 계산 조정</strong>이 필요합니다. 
            아래 연도별 분석 카드를 펼쳐서 해당 연도의 청년등 인원수와 사회보험료를 정확히 입력해주세요.
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">📋 개별 조정이 필요한 이유</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• 각 연도별로 증가한 직원의 <strong>청년등 비율이 다를 수 있음</strong></li>
              <li>• 연도별로 <strong>사회보험료 수준이 다를 수 있음</strong></li>
              <li>• 정확한 세액공제 계산을 위해 <strong>연도별 개별 설정 필수</strong></li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 🤖 AI 기반 세액공제 분석 (접근 레벨별 테스트) */}
      <div className="space-y-6">
        {/* Public 레벨 (잠금 표시) */}
        <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">🔒 Public 레벨 (일반 사용자)</h3>
          <TaxCreditAnalysis 
            taxCreditData={{
              expectedAmount: detailedAnalysis.reduce((sum: number, a: any) => sum + (a.availableTotal || 0), 0),
              riskLevel: detailedAnalysis.some((a: any) => a.hasRecallRisk) ? 'high' : 
                        detailedAnalysis.some((a: any) => !a.employmentCredit?.year1?.available) ? 'medium' : 'low',
              aiRecommendation: `분석 결과, 총 ${detailedAnalysis.length}개 연도에서 세액공제 대상이 확인되었습니다.`,
              detailedAnalysis: []
            }}
            accessLevel="public"
            showAnalysis={true}
          />
        </div>

        {/* Partner 레벨 (잠금 표시) */}
        <div className="border-2 border-dashed border-yellow-300 p-4 rounded-lg bg-yellow-50">
          <h3 className="text-lg font-semibold text-yellow-700 mb-2">🔑 Partner 레벨 (파트너 회원)</h3>
          <TaxCreditAnalysis 
            taxCreditData={{
              expectedAmount: detailedAnalysis.reduce((sum: number, a: any) => sum + (a.availableTotal || 0), 0),
              riskLevel: detailedAnalysis.some((a: any) => a.hasRecallRisk) ? 'high' : 
                        detailedAnalysis.some((a: any) => !a.employmentCredit?.year1?.available) ? 'medium' : 'low',
              aiRecommendation: `분석 결과, 총 ${detailedAnalysis.length}개 연도에서 세액공제 대상이 확인되었습니다.`,
              detailedAnalysis: []
            }}
            accessLevel="partner"
            showAnalysis={true}
          />
        </div>

        {/* Premium 레벨 (전체 표시) */}
        <div className="border-2 border-dashed border-purple-300 p-4 rounded-lg bg-purple-50">
          <h3 className="text-lg font-semibold text-purple-700 mb-2">💎 Premium 레벨 (프리미엄 회원)</h3>
          <TaxCreditAnalysis 
            taxCreditData={{
              expectedAmount: detailedAnalysis.reduce((sum: number, a: any) => sum + (a.availableTotal || 0), 0),
              riskLevel: detailedAnalysis.some((a: any) => a.hasRecallRisk) ? 'high' : 
                        detailedAnalysis.some((a: any) => !a.employmentCredit?.year1?.available) ? 'medium' : 'low',
              aiRecommendation: `분석 결과, 총 ${detailedAnalysis.length}개 연도에서 세액공제 대상이 확인되었습니다. ${
                detailedAnalysis.some((a: any) => a.hasRecallRisk) 
                  ? '환수 위험이 있는 연도가 확인되어 즉시 전문가 상담을 권장합니다.' 
                  : detailedAnalysis.some((a: any) => !a.employmentCredit?.year1?.available)
                    ? '일부 연도의 경정청구 기한이 임박했습니다. 조속한 신청을 권장합니다.'
                    : '대부분의 세액공제가 안전한 상태입니다. 계획적인 신청 진행을 권장합니다.'
              }`,
              detailedAnalysis: detailedAnalysis.slice(0, 3).map((analysis: any) => ({
                baseYear: analysis.baseYear,
                employeeCount: analysis.increaseCount || 0,
                qualifiedEmployees: analysis.adjustedYouthCount || 0,
                creditAmount: analysis.availableTotal || 0,
                riskFactors: analysis.hasRecallRisk 
                  ? [`${analysis.recallTrigger?.year}년 인원 감소로 인한 환수 위험`]
                  : analysis.employmentCredit?.year1?.available 
                    ? [] 
                    : ['경정청구 기한 만료 임박']
              }))
            }}
            accessLevel="premium"
            showAnalysis={true}
          />
        </div>
      </div>

      {/* 💡 분석 개요 */}
      <Card>
        <CardHeader>
          <CardTitle>💡 분석 개요</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="text-gray-700 mb-4">
              고용증대세액공제는 <strong>상시근로자 수가 직전 과세연도보다 증가한 중소기업</strong>에게 주어지는 세제 혜택입니다. 
              최초 증가한 과세연도부터 <strong>최대 3년간 세액공제</strong>를 받을 수 있으며, 
              사회보험료세액공제는 <strong>2년간 적용</strong>됩니다.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">📋 경정청구 기한 안내</h4>
              <p className="text-blue-800 text-sm">
                세액공제를 놓친 경우 <strong>각 과세연도의 법정 신고기한으로부터 5년 이내</strong>에 경정청구를 통해 환급받을 수 있습니다. 
                예를 들어, 2019년 귀속분은 2025년 5월 31일까지, 2020년 귀속분은 2026년 5월 31일까지 신청 가능합니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </main>

      {/* 🔗 **푸터** - 시각적 강화 버전 */}
      <footer className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 text-white py-8 mt-12 border-t-4 border-blue-500 shadow-2xl">
        <div className="container mx-auto px-4">
          {/* 메인 푸터 내용 */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">TC</span>
              </div>
              <h3 className="text-xl font-bold text-white">세액공제 분석 시스템</h3>
            </div>
            <p className="text-sm text-gray-300">© 2025 고용증대 및 사회보험료 세액공제 전문 분석 플랫폼</p>
            
            {/* 중요 공지사항 - 강조된 박스 */}
            <div className="bg-orange-600 bg-opacity-90 border-2 border-orange-400 rounded-lg p-6 mx-auto max-w-4xl shadow-xl">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <div className="text-3xl animate-pulse">⚠️</div>
                <h4 className="text-lg font-bold text-white">중요 공지사항</h4>
                <div className="text-3xl animate-pulse">⚠️</div>
              </div>
              <p className="text-white font-medium leading-relaxed">
                이 화면은 고용증대 세액공제 분석 정보의 <strong className="text-yellow-300">일부만 공개</strong>된 것입니다.<br/>
                <strong className="text-yellow-300">상세 분석은 정식 파트너 인증 후</strong> 확인 가능합니다.
              </p>
              <div className="mt-4 pt-3 border-t border-orange-400">
                <p className="text-sm text-orange-100">
                  📅 <strong>2025-06-29 기준</strong> | 💎 <strong>프리미엄 서비스</strong> 제공중
                </p>
              </div>
            </div>
            
            {/* 부가 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-xs text-gray-400">
              <div className="bg-gray-800 bg-opacity-50 p-3 rounded">
                <strong className="text-blue-400">🔧 기술 정보</strong><br/>
                React + TypeScript + Azure
              </div>
              <div className="bg-gray-800 bg-opacity-50 p-3 rounded">
                <strong className="text-green-400">📊 분석 엔진</strong><br/>
                AI 기반 세액공제 계산
              </div>
              <div className="bg-gray-800 bg-opacity-50 p-3 rounded">
                <strong className="text-purple-400">🚀 배포 상태</strong><br/>
                20250629 라이브 서비스
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* 🔔 **우측 하단 고정 알림 박스** - 항상 보이는 중요 공지 */}
      <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-bounce">
        <div className="bg-gradient-to-br from-red-500 to-orange-600 text-white p-4 rounded-xl shadow-2xl border-2 border-yellow-400">
          <div className="flex items-center space-x-2 mb-2">
            <div className="text-2xl animate-pulse">🚨</div>
            <span className="font-bold text-sm">중요 안내</span>
            <div className="text-2xl animate-pulse">🚨</div>
          </div>
          <p className="text-xs leading-relaxed">
            <strong className="text-yellow-200">일부 공개 버전</strong><br/>
            상세 분석은 파트너 인증 후<br/>
            확인 가능합니다
          </p>
          <div className="mt-2 pt-2 border-t border-orange-400">
            <p className="text-xs text-orange-100 font-medium">
              📅 2025-06-29 기준
            </p>
          </div>
        </div>
      </div>

      {/* 🔔 **좌측 하단 고정 상태 표시** - 배포 정보 */}
      <div className="fixed bottom-4 left-4 z-40">
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg border border-blue-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium">Live · 20250629</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxCreditDashboard; 