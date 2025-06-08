import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine, Cell, LabelList } from 'recharts';
// Service 함수들을 동적으로 import

const TaxCreditDashboard = () => {
  const [searchParams] = useSearchParams();
  const { bizno: urlBizno } = useParams(); // URL 패스에서 bizno 추출
  const navigate = useNavigate();
  const [bizno, setBizno] = useState('');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 🏢 **업종 선택 상태 관리**
  const [industryOptions, setIndustryOptions] = useState<any[]>([]);
  const [showIndustrySelector, setShowIndustrySelector] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedIndustry, setSelectedIndustry] = useState<any>(null);
  
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
    
    // 감소 연도부터 3년 전까지의 증가분 찾기
    for (let i = decreaseYearNum - 1; i >= decreaseYearNum - 3; i--) {
      const targetResult = previousResults.find(r => parseInt(r.baseYear) === i && r.changeType === 'increase');
      if (targetResult) {
        recallTargets.push({
          year: i.toString(),
          increaseCount: targetResult.increaseCount,
          employmentCredit: targetResult.employmentCredit,
          socialCredit: targetResult.socialCredit,
          estimatedRecallAmount: targetResult.availableTotal // 간단 추정
        });
      }
    }
    
    return {
      decreaseYear,
      decreaseCount,
      recallTargets,
      totalRecallAmount: recallTargets.reduce((sum, target) => sum + target.estimatedRecallAmount, 0),
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
        
        // 경정청구 기한 계산
        const getAmendmentDeadlines = (year: string) => {
          const baseYearNum = parseInt(year);
          return {
            year1: { year: baseYearNum, deadline: new Date(baseYearNum + 6, 4, 31) },
            year2: { year: baseYearNum + 1, deadline: new Date(baseYearNum + 7, 4, 31) },
            year3: { year: baseYearNum + 2, deadline: new Date(baseYearNum + 8, 4, 31) }
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
            const hasApiResult = apiResults.some((result: any) => result.baseYear === currentYear);
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

      // 📋 **증가분과 감소분 결합 후 연도순 정렬**
      const combinedResults = [...apiResults.filter((result: any) => result !== null), ...decreaseAnalysis].sort((a: any, b: any) => 
        parseInt(a.baseYear) - parseInt(b.baseYear)
      );
      
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
              console.log(`🚨 ${targetResult.baseYear}년 증가분이 ${decreaseResult.baseYear}년 감소로 환수 위험 (사후관리: ${increaseYear}~${postManagementEndYear})`);
              
              // 환수 예상 금액 계산
              const estimatedRecallAmount = targetResult.availableTotal || 0;
              
              // 기존 상태를 환수 위험으로 업데이트
              targetResult.postManagementStatus = {
                ...targetResult.postManagementStatus,
                status: '환수위험',
                confidence: '위험',
                icon: '🚨',
                bgColor: 'bg-red-100',
                textColor: 'text-red-800',
                description: `${decreaseResult.baseYear}년 ${decreaseResult.decreaseCount}명 감소로 인한 환수 위험`,
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
        const getAmendmentDeadlines = (baseYear: string) => {
          const baseYearNum = parseInt(baseYear);
          return {
            year1: { year: baseYearNum, deadline: new Date(baseYearNum + 6, 4, 31) },
            year2: { year: baseYearNum + 1, deadline: new Date(baseYearNum + 7, 4, 31) },
            year3: { year: baseYearNum + 2, deadline: new Date(baseYearNum + 8, 4, 31) }
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
            console.log(`🚨 ${targetResult.baseYear}년 증가분이 ${decreaseResult.baseYear}년 감소로 환수 위험 (사후관리: ${increaseYear}~${postManagementEndYear})`);
            
            // 환수 예상 금액 계산
            const estimatedRecallAmount = targetResult.availableTotal || 0;
            
            // 기존 상태를 환수 위험으로 업데이트
            targetResult.postManagementStatus = {
              ...targetResult.postManagementStatus,
              status: '환수위험',
              confidence: '위험',
              icon: '🚨',
              bgColor: 'bg-red-100',
              textColor: 'text-red-800',
              description: `${decreaseResult.baseYear}년 ${decreaseResult.decreaseCount}명 감소로 인한 환수 위험`,
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
      '2016': 8, '2017': 8, '2018': 8, '2019': 11, '2020': 15,
      '2021': 15, '2022': 15, '2023': 18, '2024': 8, '2025': 18
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
      '2016': 14, '2017': 14, '2018': 14, '2019': 17, '2020': 17,
      '2021': 19, '2022': 23, '2023': 24, '2024': 14, '2025': 21
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
      '2016': 3, '2017': 4, '2018': 5, '2019': 4, '2020': 5, 
      '2021': 5, '2022': 6, '2023': 5, '2024': 2, '2025': 6
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
      fetchAnalysisData(urlBizno);
    } else {
      // 검색 페이지에서는 데이터 초기화
      setAnalysisData(null);
      setBizno('');
    }
    
    // URL 파라미터에서 사용자 입력값 복원 (연도별 파라미터로 변경됨)
    // 기존 URL 파라미터는 호환성을 위해 유지하되, 새로운 연도별 시스템에서는 각 연도별로 개별 관리
  }, [searchParams, fetchAnalysisData, urlBizno]);

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
      
      // 데이터 변환
      if (apiData.success && apiData.analysisResult) {
        const employeeData: {[key: string]: number} = {};
        
        if (apiData.data) {
          for (let year = 2016; year <= 2025; year++) {
            const yearStr = year.toString();
            const value = apiData.data[yearStr] || apiData.data[`[${yearStr}]`] || 0;
            employeeData[yearStr] = parseInt(value) || 0;
          }
        }
        
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
        setIndustryOptions(apiData.options);
        setShowIndustrySelector(true);
        setLoading(false); // 로딩 상태 해제
        // 특별한 응답으로 null 반환 (업종 선택 UI 표시를 위해)
        return null;
      }
      
      // 🔄 **API 응답 구조를 컴포넌트 기대 구조로 변환**
      if (apiData.success && apiData.analysisResult) {
        // 차트를 위한 employeeData 생성
        const employeeData: {[key: string]: number} = {};
        
        // 원본 DB 데이터에서 연도별 인원 추출
        if (apiData.data) {
          for (let year = 2016; year <= 2025; year++) {
            const yearStr = year.toString();
            const value = apiData.data[yearStr] || apiData.data[`[${yearStr}]`] || 0;
            employeeData[yearStr] = parseInt(value) || 0;
          }
        }
        
        console.log('📊 생성된 employeeData:', employeeData);
        
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
                          
                          {/* 연도별 인원 미리보기 */}
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">인원 변화:</span> {option.preview}
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

    console.log('📊 차트 데이터 생성 시작');
    console.log('📊 employeeData:', analysisData.employeeData);
    console.log('📊 analysisResults:', analysisData.analysisResults);

    // 1️⃣ employeeData가 있으면 기존 방식 사용
    if (analysisData.employeeData && Object.keys(analysisData.employeeData).length > 0) {
      console.log('✅ employeeData 방식 사용');
      return Object.keys(analysisData.employeeData).map((year, index, years) => ({
        year,
        employees: analysisData.employeeData[year] || 0,
        change: index > 0 ? (analysisData.employeeData[year] || 0) - (analysisData.employeeData[years[index-1]] || 0) : 0
      }));
    }

    // 2️⃣ analysisResults에서 차트 데이터 생성
    if (analysisData.analysisResults && analysisData.analysisResults.length > 0) {
      console.log('✅ analysisResults 방식 사용');
      const results = analysisData.analysisResults;
      
      // 연도별 데이터 재구성
      const employeesByYear: {[key: string]: number} = {};
      let baseEmployees = 10; // 시작 인원 추정값
      
      // 분석 결과에서 역산해서 연도별 인원 생성
      results.forEach((result: any, index: number) => {
        const year = result.year;
        const increaseCount = result.increaseCount || 0;
        
        if (index === 0) {
          // 첫 번째 연도는 기준
          employeesByYear[year] = baseEmployees + increaseCount;
          employeesByYear[(parseInt(year) - 1).toString()] = baseEmployees;
        } else {
          // 이후 연도는 누적
          baseEmployees += increaseCount;
          employeesByYear[year] = baseEmployees;
        }
      });

      console.log('📊 재구성된 employeesByYear:', employeesByYear);

      // 차트 데이터 생성
      const years = Object.keys(employeesByYear).sort();
      return years.map((year, index) => ({
        year,
        employees: employeesByYear[year] || 0,
        change: index > 0 ? (employeesByYear[year] || 0) - (employeesByYear[years[index-1]] || 0) : 0
      }));
    }

    console.log('❌ 차트 데이터 생성 실패');
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
        {/* 🏢 **회사 정보** */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="bg-blue-700 text-white p-4 rounded-t-lg">
            <h2 className="text-xl font-bold">회사 정보</h2>
            <p className="text-sm opacity-80">{analysisData.companyInfo.companyName}</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700">사업자등록번호</h4>
                <p className="text-lg font-bold text-blue-700">{analysisData.companyInfo.bizno}</p>
          </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700">지역</h4>
                <p className="text-lg font-bold text-green-700">{analysisData.companyInfo.region}</p>
          </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700">업종</h4>
                <p className="text-lg font-bold text-purple-700">{analysisData.companyInfo.industry}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700">분석일</h4>
                <p className="text-lg font-bold text-gray-700">{new Date().toLocaleDateString('ko-KR')}</p>
              </div>
            </div>
        </div>
      </div>

      {/* 📊 인원증감 현황 그래프 */}
      <Card>
        <CardHeader>
          <CardTitle>📈 인원 증감 현황</CardTitle>
          <p className="text-sm text-gray-600">연도별 상시근로자 수 변화와 증감량을 보여줍니다</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 인원 수 그래프 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">연도별 상시근로자 수</h4>
              <div className="w-full h-80 md:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#374151' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#374151' }}
                      domain={['dataMin - 2', 'dataMax + 2']}
                      tickFormatter={(value) => `${value}명`}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}명`, '인원수']}
                      labelFormatter={(label) => `${label}년`}
                      contentStyle={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="employees" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, fill: '#1d4ed8' }}
                    >
                      {/* 📊 데이터 레이블 추가 - 각 점에 정확한 수치 표시 */}
                      <LabelList 
                        dataKey="employees" 
                        position="top" 
                        style={{ 
                          fontSize: '12px', 
                          fontWeight: 'bold', 
                          fill: '#1f2937',
                          textAnchor: 'middle'
                        }}
                        formatter={(value: any) => `${value}명`}
                        offset={10}
                      />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* 증감량 그래프 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">연도별 증감량</h4>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.slice(1)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis 
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(value) => `${value > 0 ? '+' : ''}${value}명`}
                    />
                    {/* 기준선 (0선) 추가 */}
                    <ReferenceLine y={0} stroke="#000" strokeWidth={1} strokeDasharray="2 2" />
                    <Tooltip 
                      formatter={(value: any) => {
                        const numValue = Number(value);
                        const sign = numValue > 0 ? '+' : '';
                        const color = numValue > 0 ? '#10b981' : '#ef4444'; // 증가: 초록, 감소: 빨강
                        return [
                          <span style={{ color }}>{`${sign}${value}명`}</span>, 
                          numValue > 0 ? '증가' : '감소'
                        ];
                      }}
                      labelFormatter={(label) => `${label}년`}
                    />
                    <Bar 
                      dataKey="change" 
                      name="증감량"
                    >
                      {chartData.slice(1).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.change > 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* 차트 범례 추가 */}
              <div className="mt-2 flex justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>증가</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>감소</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-8 h-0 border-t border-gray-400 border-dashed"></div>
                  <span>기준선 (0명)</span>
                </div>
              </div>
            </div>
            
            {/* 📊 정확한 수치 테이블 추가 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">📋 연도별 정확한 수치</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">연도</th>
                      <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">상시근로자 수</th>
                      <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">전년 대비 증감</th>
                      <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">증감 유형</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((data, index) => (
                      <tr key={data.year} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-3 py-2 text-center font-medium">
                          {data.year}년
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-center">
                          <span className="font-bold text-blue-600">{data.employees}명</span>
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-center">
                          {index === 0 ? (
                            <span className="text-gray-500">기준연도</span>
                          ) : (
                            <span className={`font-semibold ${
                              data.change > 0 ? 'text-green-600' : 
                              data.change < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {data.change > 0 ? '+' : ''}{data.change}명
                            </span>
                          )}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-center">
                          {index === 0 ? (
                            <span className="text-gray-500">-</span>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              {data.change > 0 ? (
                                <>
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-green-700 text-xs">증가</span>
                                </>
                              ) : data.change < 0 ? (
                                <>
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <span className="text-red-700 text-xs">감소</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                  <span className="text-gray-600 text-xs">변화없음</span>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* 요약 정보 */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="font-semibold text-blue-800">최대 인원</div>
                  <div className="text-lg font-bold text-blue-600">
                    {Math.max(...chartData.map(d => d.employees))}명
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <div className="font-semibold text-red-800">최소 인원</div>
                  <div className="text-lg font-bold text-red-600">
                    {Math.min(...chartData.map(d => d.employees))}명
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="font-semibold text-green-800">총 증가</div>
                  <div className="text-lg font-bold text-green-600">
                    +{chartData.slice(1).filter(d => d.change > 0).reduce((sum, d) => sum + d.change, 0)}명
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="font-semibold text-gray-800">현재 인원</div>
                  <div className="text-lg font-bold text-gray-600">
                    {chartData[chartData.length - 1]?.employees || 0}명
                  </div>
                </div>
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

      {/* 📊 상세 분석 결과 - 아코디언 형태 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">📊 연도별 상세 분석</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedYears(new Set(detailedAnalysis.map((a: any) => a.baseYear)))}
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

      {detailedAnalysis.map((analysis: any, index: number) => {
        const yearParams = getYearParams(analysis.baseYear, analysis.increaseCount);
        return (
        <Card key={index} className="border-l-4 border-l-blue-500">
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
                {/* 💰 신청가능 금액 - 가장 중요 */}
                {analysis.changeType === 'increase' && !isYearExpanded(analysis.baseYear) && (
                  <div className="text-right">
                    <div className="text-lg md:text-2xl font-bold text-purple-700">
                      {formatCurrency(analysis.availableTotal)}
                    </div>
                    <div className="text-xs text-purple-600">신청가능</div>
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

              {/* 🚨 사후관리 상태 상세 정보 (공통) */}
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
            🔍 분석된 데이터: {detailedAnalysis.length}건 | 
            총 신청가능액: {formatCurrency(detailedAnalysis.reduce((sum: number, a: any) => sum + (a.availableTotal || 0), 0))}
          </div>
        </CardHeader>
        <CardContent>
          {detailedAnalysis.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">📊 분석할 데이터가 없습니다</p>
              <p className="text-sm text-gray-400">
                인원 증가가 있는 연도가 없거나 분석 중입니다.
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
                {detailedAnalysis.map((analysis: any, index: number) => {
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
                  
                  // 📈 **증가분 표시 (환수 위험 구분)**
                  if (analysis.changeType === 'increase') {
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
                    {formatCurrency(detailedAnalysis.reduce((sum: number, a: any) => 
                      sum + (a.employmentCredit?.year1?.amount || 0) + (a.employmentCredit?.year2?.amount || 0) + (a.employmentCredit?.year3?.amount || 0), 0))}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-green-600">
                    {formatCurrency(detailedAnalysis.reduce((sum: number, a: any) => 
                      sum + (a.socialCredit?.year1?.amount || 0) + (a.socialCredit?.year2?.amount || 0), 0))}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-purple-600 text-lg">
                    {formatCurrency(detailedAnalysis.reduce((sum: number, a: any) => sum + (a.availableTotal || 0), 0))}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center" colSpan={2}>
                    <Badge className="bg-purple-100 text-purple-800">총 {detailedAnalysis.length}건 분석</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          )}
          
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
      </main>

      {/* 🔗 **푸터** */}
      <footer className="bg-gray-800 text-white py-4 mt-8">
        <div className="container mx-auto text-center">
          <p className="text-sm">© 2025 세액공제 분석 시스템 | 고용증대 및 사회보험료 세액공제</p>
        </div>
      </footer>
    </div>
  );
};

export default TaxCreditDashboard; 