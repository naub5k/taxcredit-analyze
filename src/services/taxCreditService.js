import { RISK_CLASSIFICATION, API_CONFIG } from '../config/pageConfig.js';
import { getYearValue, getExclusionStatus } from '../types/InsuCleanRecord';

/**
 * 🧮 세액공제 계산 전담 서비스 v2.1
 * IDE작업기준서 + 함수작성기준 완전 반영
 * 단순화 원칙: 중소기업 통일, 청년외 기본값, 1인당 10만원 표준 사회보험료
 * ✅ InsuCleanRecord 타입 헬퍼 함수 활용
 */

// 📊 회사 데이터 가져오기 (DB 스키마 [2016]~[2025] 기준)
export const fetchCompanyData = async (bizno) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GET_SAMPLE_LIST}?bizno=${bizno}`);
    const data = await response.json();
    
    let companyData = null;
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      companyData = data.data[0];
    } else if (Array.isArray(data) && data.length > 0) {
      companyData = data[0];
    }
    
    return { success: true, data: companyData };
  } catch (error) {
    console.error('API 호출 오류:', error);
    return { success: false, error: '회사 정보를 불러오는 중 오류가 발생했습니다.' };
  }
};

// 🗺️ 지역 분류 (수도권 여부) - 최신 기준
export const classifyRegion = (sido) => {
  const 수도권지역 = ["서울특별시", "경기도", "인천광역시"];
  return 수도권지역.some(area => sido?.includes(area)) ? "수도권" : "수도권외";
};

// 🏭 업종 분류 (신성장서비스업 여부) - 최신 기준
export const classifyIndustry = (industryCode) => {
  const 신성장업종코드 = ["62", "63", "72"]; // IT, 연구개발, 전문서비스
  return 신성장업종코드.includes(industryCode?.substring(0,2) || "") ? "신성장서비스업" : "일반업종";
};

// 📅 경정청구 기간 확인 (5년 기준)
export const checkAmendmentEligibility = (targetYear, currentDate = new Date()) => {
  // 법인세 신고기한: 사업연도 종료 후 3개월 (일반적으로 3월 말)
  const filingDeadline = new Date(parseInt(targetYear) + 1, 2, 31); // 3월 31일
  const amendmentDeadline = new Date(parseInt(targetYear) + 6, 2, 31); // 5년 후 3월 31일
  const isEligible = currentDate <= amendmentDeadline;
  
  return {
    isEligible,
    filingDeadline,
    amendmentDeadline,
    remainingDays: Math.max(0, Math.floor((amendmentDeadline - currentDate) / (1000 * 60 * 60 * 24))),
    status: isEligible ? "경정청구가능" : "기간만료"
  };
};

// 🛡️ 사후관리 기간 확인 (고용증대 2년, 사회보험료 1년)
export const checkPostManagementPeriod = (targetYear, creditType = "고용증대세액공제", currentDate = new Date()) => {
  const endDate = new Date(parseInt(targetYear), 11, 31); // 해당 연도 말
  const managementPeriods = {
    "고용증대세액공제": 2, // 2년
    "사회보험료세액공제": 1  // 1년 (2022년부터)
  };
  
  const managementEndDate = new Date(
    endDate.getFullYear() + managementPeriods[creditType], 
    11, 31
  );
  
  const isInManagementPeriod = currentDate <= managementEndDate;
  
  return {
    isInManagementPeriod,
    managementEndDate,
    remainingDays: Math.max(0, Math.floor((managementEndDate - currentDate) / (1000 * 60 * 60 * 24))),
    status: isInManagementPeriod ? "사후관리중" : "사후관리완료"
  };
};

// 🎯 3단계 위험도 상태 결정 (최신 기준)
export const determineRiskStatus = (targetYear, currentDate = new Date()) => {
  const amendment = checkAmendmentEligibility(targetYear, currentDate);
  const postMgmtEmployment = checkPostManagementPeriod(targetYear, "고용증대세액공제", currentDate);
  const postMgmtSocial = checkPostManagementPeriod(targetYear, "사회보험료세액공제", currentDate);
  
  // 3단계 분류 로직
  if (!amendment.isEligible) {
    // 경정청구 기간 만료
    return {
      status: '기간경과미신청',
      classification: RISK_CLASSIFICATION.NOT_ELIGIBLE,
      amendment,
      postManagement: { employment: postMgmtEmployment, socialInsurance: postMgmtSocial }
    };
  } else if (!postMgmtEmployment.isInManagementPeriod && !postMgmtSocial.isInManagementPeriod) {
    // 사후관리 완료 (안전)
    return {
      status: '사후관리종료',
      classification: RISK_CLASSIFICATION.IMMEDIATE_APPLICATION,
      amendment,
      postManagement: { employment: postMgmtEmployment, socialInsurance: postMgmtSocial }
    };
  } else {
    // 사후관리 진행중 (추징 위험)
    return {
      status: '사후관리진행중',
      classification: RISK_CLASSIFICATION.CAREFUL_REVIEW,
      amendment,
      postManagement: { employment: postMgmtEmployment, socialInsurance: postMgmtSocial }
    };
  }
};

// 🔄 중복 적용 가능 여부 판단 (2024년까지 가능)
export const checkDuplicateEligibility = (targetYear) => {
  const year = parseInt(targetYear);
  
  if (year <= 2024) {
    return {
      isDuplicateAllowed: true,
      reason: "고용증대세액공제와 사회보험료세액공제 중복 적용 가능",
      applicableRule: "기존 제도 기준"
    };
  } else {
    return {
      isDuplicateAllowed: false,
      reason: "통합고용세액공제 도입으로 중복 적용 불가",
      applicableRule: "통합고용세액공제 기준"
    };
  }
};

// 💰 고용증대세액공제 계산 (단순화 기준)
export const calculateEmploymentCredit = (increaseCount, targetYear, region, youthRatio = 0) => {
  // 연도별 1인당 공제액 기준표 (중소기업 전용)
  const EMPLOYMENT_CREDIT_RATES = {
    "2017": { "수도권": 600, "수도권외": 660 },
    "2018": { "수도권": 600, "수도권외": 660 },
    "2019": { "수도권": 600, "수도권외": 660 },
    "2020": { "수도권": 700, "수도권외": 770 },
    "2021": { "수도권": 700, "수도권외": 770 },
    "2022": { "수도권": 700, "수도권외": 770 },
    "2023": { "수도권": 700, "수도권외": 770 },
    "2024": { "수도권": 700, "수도권외": 770 }
  };
  
  // 청년등 배수 기준
  const YOUTH_MULTIPLIER = {
    "수도권": 1.57,    // 1100/700 = 1.57배
    "수도권외": 1.56   // 1200/770 = 1.56배
  };
  
  const rates = EMPLOYMENT_CREDIT_RATES[targetYear];
  if (!rates || !rates[region]) return 0;
  
  const baseRate = rates[region]; // 청년외 기본 요율
  const youthMultiplier = YOUTH_MULTIPLIER[region];
  
  // 청년등/청년외 구분 계산 (단순화: 기본값 모두 청년외)
  const youthCount = Math.round(increaseCount * youthRatio);
  const othersCount = increaseCount - youthCount;
  
  // 1차년도 공제액 계산
  const employmentCredit = (othersCount * baseRate * 10000) + 
                          (youthCount * baseRate * youthMultiplier * 10000);
  
  return Math.round(employmentCredit);
};

// 🛡️ 사회보험료세액공제 계산 (단순화 기준)
export const calculateSocialInsuranceCredit = (increaseCount, industry, youthRatio = 0, socialInsuranceRate = 1.0) => {
  // 공제율 기준표
  const SOCIAL_INSURANCE_RATES = {
    "청년외_일반": 0.5,     // 50%
    "청년외_신성장": 0.75,  // 75% (신성장서비스업)
    "청년등_배수": 2.0      // 청년등은 100%이므로 50%의 2배
  };
  
  // 표준 사회보험료: 1인당 연간 10만원
  const STANDARD_INSURANCE_PER_EMPLOYEE = 10; // 만원 단위
  
  const isNewGrowthIndustry = industry === "신성장서비스업";
  const baseRate = isNewGrowthIndustry ? 
    SOCIAL_INSURANCE_RATES.청년외_신성장 : SOCIAL_INSURANCE_RATES.청년외_일반;
  
  // 청년등/청년외 구분 계산
  const youthCount = Math.round(increaseCount * youthRatio);
  const othersCount = increaseCount - youthCount;
  
  // 공제액 계산
  const youthInsuranceCredit = youthCount * STANDARD_INSURANCE_PER_EMPLOYEE * SOCIAL_INSURANCE_RATES.청년등_배수;
  const othersInsuranceCredit = othersCount * STANDARD_INSURANCE_PER_EMPLOYEE * baseRate;
  
  const totalCredit = (youthInsuranceCredit + othersInsuranceCredit) * socialInsuranceRate * 10000;
  
  return Math.round(totalCredit);
};

// 📊 DB 데이터를 계산용 형태로 변환 (최신 기준 + InsuCleanRecord 헬퍼 활용)
export const convertDbDataToCalculationFormat = (dbData) => {
  // 지역 및 업종 분류
  const region = classifyRegion(dbData.시도);
  const industry = classifyIndustry(dbData.업종코드);
  
  // ✅ InsuCleanRecord 헬퍼 함수를 사용한 안전한 연도별 데이터 접근
  const employeeData = {};
  for (let year = 2016; year <= 2025; year++) {
    const yearStr = year.toString();
    const value = getYearValue(dbData, yearStr); // 헬퍼 함수 사용
    
    if (value !== null && value !== undefined) {
      employeeData[yearStr] = {
        total: value,
        // 기본값: 모든 직원을 청년외로 처리
        youth: 0,
        others: value,
        // 표준 사회보험료: 1인당 연간 10만원
        socialInsurancePaid: value * 10
      };
    }
  }
  
  return {
    companyInfo: {
      bizno: dbData.사업자등록번호,
      companyName: dbData.사업장명,
      companyType: "중소기업", // 모든 기업 중소기업으로 통일
      region: region,
      industry: industry,
      industryCode: dbData.업종코드,
      sido: dbData.시도,
      gugun: dbData.구군,
      establishedDate: dbData.성립일자,
      // ✅ InsuCleanRecord 헬퍼 함수 사용
      exclusionStatus: getExclusionStatus(dbData)
    },
    employeeData: employeeData
  };
};

// 📈 연도별 증감 계산
export const calculateYearlyChanges = (employeeData) => {
  const years = Object.keys(employeeData).sort();
  const changes = {};
  
  for (let i = 1; i < years.length; i++) {
    const currentYear = years[i];
    const previousYear = years[i-1];
    
    const totalChange = employeeData[currentYear].total - employeeData[previousYear].total;
    
    changes[currentYear] = {
      totalChange: totalChange,
      // 기본값: 모든 증감을 청년외로 처리
      youthChange: 0,
      othersChange: totalChange,
      isIncrease: totalChange > 0
    };
  }
  
  return changes;
};

// 📊 연도별 전체 분석 실행 (최신 기준 완전 반영)
export const analyzeCompanyTaxCredit = (companyInfo, youthRatio = 0, socialInsuranceRate = 1.0) => {
  if (!companyInfo) return { results: [], summary: { 기간경과미신청: 0, 사후관리종료: 0, 사후관리진행중: 0, 총계: 0 } };
  
  // DB 데이터 변환
  const { companyInfo: convertedCompanyInfo, employeeData } = convertDbDataToCalculationFormat(companyInfo);
  const employeeChanges = calculateYearlyChanges(employeeData);
  const currentDate = new Date();
  const results = [];
  
  // 2017년부터 2024년까지 분석 (첫 해는 증감 계산 불가)
  for (let year = 2017; year <= 2024; year++) {
    const yearStr = year.toString();
    const change = employeeChanges[yearStr];
    
    if (!change || !change.isIncrease || change.totalChange <= 0) continue;
    
    // 3단계 위험도 상태 결정
    const riskAnalysis = determineRiskStatus(yearStr, currentDate);
    const duplicateRule = checkDuplicateEligibility(yearStr);
    
    let employmentCredit = 0;
    let socialInsuranceCredit = 0;
    
    // 경정청구 가능한 경우만 계산
    if (riskAnalysis.amendment.isEligible) {
      // 고용증대세액공제 계산
      employmentCredit = calculateEmploymentCredit(
        change.totalChange, 
        yearStr, 
        convertedCompanyInfo.region, 
        youthRatio
      );
      
      // 사회보험료세액공제 계산 (중복 적용 가능한 경우)
      if (duplicateRule.isDuplicateAllowed) {
        socialInsuranceCredit = calculateSocialInsuranceCredit(
          change.totalChange, 
          convertedCompanyInfo.industry, 
          youthRatio, 
          socialInsuranceRate
        );
      }
    }
    
    results.push({
      year: yearStr,
      increaseCount: change.totalChange,
      employmentCredit,
      socialInsuranceCredit,
      totalCredit: employmentCredit + socialInsuranceCredit,
      status: riskAnalysis.status,
      classification: riskAnalysis.classification,
      amendmentDeadline: riskAnalysis.amendment.amendmentDeadline.toLocaleDateString(),
      managementEndDate: riskAnalysis.postManagement.employment.managementEndDate.toLocaleDateString(),
      riskAnalysis,
      duplicateRule
    });
  }
  
  // 요약 데이터 계산 (3단계 분류)
  const summary = results.reduce((acc, result) => {
    acc[result.status] += result.totalCredit;
    acc.총계 += result.totalCredit;
    return acc;
  }, {
    기간경과미신청: 0,
    사후관리종료: 0,
    사후관리진행중: 0,
    총계: 0
  });
  
  return { results, summary, companyInfo: convertedCompanyInfo };
};

// 💱 금액 포맷팅 (한헬스케어 예시 기준)
export const formatCurrency = (amount) => {
  if (amount === 0) return '0원';
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억원`;
  } else if (amount >= 10000) {
    return `${Math.round(amount / 10000)}만원`;
  }
  return `${amount.toLocaleString()}원`;
};

// 📋 사업자등록번호 포맷팅
export const formatBizno = (bizno) => {
  if (!bizno || bizno.length !== 10) return bizno;
  return `${bizno.slice(0, 3)}-${bizno.slice(3, 5)}-${bizno.slice(5)}`;
};

// 🎯 실무진 친화적 리포트 생성 (IDE작업기준서 반영)
export const generateExecutiveReport = (summary, companyInfo) => {
  return {
    회사정보: {
      회사명: companyInfo?.companyName || "정보없음",
      사업자번호: formatBizno(companyInfo?.bizno || ""),
      분석일자: new Date().toISOString().split('T')[0]
    },
    
    핵심요약: {
      총세액공제가능액: formatCurrency(summary.총계),
      즉시신청추천액: formatCurrency(summary.사후관리종료),
      신중검토필요액: formatCurrency(summary.사후관리진행중),
      신청불가액: formatCurrency(summary.기간경과미신청)
    },
    
    실행권고사항: [
      summary.사후관리종료 > 0 ? `💚 ${formatCurrency(summary.사후관리종료)} 즉시 경정청구 신청 권장` : null,
      summary.사후관리진행중 > 0 ? `⚠️ ${formatCurrency(summary.사후관리진행중)} 추징 위험 검토 후 신중 판단` : null,
      summary.기간경과미신청 > 0 ? `❌ ${formatCurrency(summary.기간경과미신청)} 경정청구 기간 만료로 신청 불가` : null
    ].filter(Boolean)
  };
}; 