// 🏢 세액공제 분석 서비스 (TypeScript)
// TaxCreditDashboard에서 사용하는 핵심 비즈니스 로직

interface CompanyData {
  bizno: string;
  companyName: string;
  employeeData: { [year: string]: number };
  analysis: {
    totalCredit: number;
    recallRisk: boolean;
    yearlyAnalysis: any[];
  };
}

interface AnalysisResult {
  success: boolean;
  data?: CompanyData;
  error?: string;
}

/**
 * 세액공제 분석 결과를 가져오는 함수
 */
export const fetchTaxCreditAnalysis = async (
  bizno: string, 
  discountRate: number = 0.0, 
  multiplier: number = 1.0
): Promise<AnalysisResult> => {
  try {
    // 🎯 샘플 데이터 반환 (실제 API 호출 대신)
    const sampleData: AnalysisResult = {
      success: true,
      data: {
        bizno: bizno,
        companyName: getCompanyName(bizno),
        employeeData: getEmployeeData(bizno),
        analysis: {
          totalCredit: 0,
          recallRisk: false,
          yearlyAnalysis: []
        }
      }
    };

    return sampleData;
  } catch (error: any) {
    console.error('세액공제 분석 중 오류:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 사업자번호에 따른 회사명 반환
 */
function getCompanyName(bizno: string): string {
  const companies: { [key: string]: string } = {
    '1018197530': '(주)펜타플로',
    '1234567890': '좋은느낌',
    '1010138752': '김종칠세무회계사무소'
  };
  
  return companies[bizno] || `회사 (${bizno})`;
}

/**
 * 사업자번호에 따른 직원 데이터 반환
 */
function getEmployeeData(bizno: string): { [year: string]: number } {
  const employeeData: { [key: string]: { [year: string]: number } } = {
    '1018197530': {
      '2016': 8, '2017': 10, '2018': 12, '2019': 11, '2020': 13, 
      '2021': 15, '2022': 17, '2023': 19, '2024': 21, '2025': 23
    },
    '1234567890': {
      '2016': 5, '2017': 7, '2018': 9, '2019': 11, '2020': 13, 
      '2021': 15, '2022': 17, '2023': 19, '2024': 21, '2025': 23
    },
    '1010138752': {
      '2016': 3, '2017': 4, '2018': 5, '2019': 4, '2020': 5, 
      '2021': 5, '2022': 6, '2023': 5, '2024': 2, '2025': 6
    }
  };

  return employeeData[bizno] || {
    '2016': 5, '2017': 6, '2018': 7, '2019': 8, '2020': 9,
    '2021': 10, '2022': 11, '2023': 12, '2024': 13, '2025': 14
  };
}

/**
 * 회사 정보를 가져오는 함수
 */
export const fetchCompanyInfo = async (bizno: string): Promise<AnalysisResult> => {
  try {
    const companyData: AnalysisResult = {
      success: true,
      data: {
        bizno: bizno,
        companyName: getCompanyName(bizno),
        employeeData: getEmployeeData(bizno),
        analysis: {
          totalCredit: 0,
          recallRisk: false,
          yearlyAnalysis: []
        }
      }
    };

    return companyData;
  } catch (error: any) {
    console.error('회사 정보 조회 중 오류:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Mock 분석 결과 생성 함수
 */
function generateMockAnalysisResults(employeeData: { [year: string]: number }): any[] {
  const results = [];
  const years = Object.keys(employeeData).map(Number).sort();
  
  for (let i = 1; i < years.length; i++) {
    const prevYear = years[i - 1];
    const currentYear = years[i];
    const prevCount = employeeData[prevYear.toString()];
    const currentCount = employeeData[currentYear.toString()];
    const increaseCount = currentCount - prevCount;
    
    if (increaseCount > 0) {
      results.push({
        year: currentYear,
        increaseCount: increaseCount,
        employmentCredit: increaseCount * 2200,
        socialInsuranceCredit: increaseCount * 1000,
        totalCredit: increaseCount * 3200,
        status: '사후관리진행중',
        classification: { icon: '📈', title: '고용증대' },
        amendmentDeadline: `${currentYear + 1}-03-31`,
        managementEndDate: `${currentYear + 3}-12-31`
      });
    }
  }
  
  return results;
}

/**
 * 회사 세액공제 분석 함수
 */
export const analyzeCompanyTaxCredit = (
  companyData: any, 
  youthRatio: number = 0, 
  socialInsuranceRate: number = 1.0
): any => {
  try {
    const employeeData = getEmployeeData(companyData.사업자등록번호 || '');
    const results = generateMockAnalysisResults(employeeData);
    
    return {
      results: results,
      summary: { 
        총계: 15350, 
        사후관리종료: 8800, 
        사후관리진행중: 6550, 
        기간경과미신청: 0 
      },
      companyInfo: {
        bizno: companyData.사업자등록번호 || '',
        companyName: companyData.사업장명 || '',
        companyType: '주식회사',
        region: companyData.시도 || '',
        industry: companyData.업종명 || '',
        industryCode: companyData.업종코드 || '',
        sido: companyData.시도 || '',
        gugun: companyData.구군 || '',
        establishedDate: companyData.성립일자 || ''
      }
    };
  } catch (error: any) {
    console.error('세액공제 분석 중 오류:', error);
    return {
      results: [],
      summary: { 총계: 0, 사후관리종료: 0, 사후관리진행중: 0, 기간경과미신청: 0 },
      companyInfo: null
    };
  }
};

/**
 * 통화 포맷 함수
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount);
};

/**
 * 사업자번호 포맷 함수
 */
export const formatBizno = (bizno: string): string => {
  if (!bizno) return '';
  // 123-45-67890 형식으로 포맷
  const cleaned = bizno.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
  }
  return bizno;
};

/**
 * 경영진 보고서 인터페이스
 */
interface ExecutiveReport {
  title: string;
  summary: any;
  companyInfo: any;
  recommendations: string[];
  실행권고사항: string[];
  totalPotentialCredit: number;
  riskAssessment: string;
  nextSteps: string[];
  핵심요약: {
    총세액공제가능액: string;
    즉시신청추천액: string;
    신중검토필요액: string;
    신청불가액: string;
  };
}

/**
 * 경영진 보고서 생성 함수
 */
export const generateExecutiveReport = (
  summary: any, 
  companyInfo: any = null
): ExecutiveReport => {
  const recommendations = [
    '💚 즉시 신청 가능한 세액공제 항목 우선 처리',
    '📋 사후관리 기간 내 필요 서류 준비',
    '📈 향후 고용증대 계획 수립 검토'
  ];

  return {
    title: '세액공제 분석 경영진 보고서',
    summary: summary,
    companyInfo: companyInfo,
    recommendations: recommendations,
    실행권고사항: recommendations, // 한국어 속성명도 같이 제공
    totalPotentialCredit: summary?.총계 || 0,
    riskAssessment: '낮음',
    nextSteps: [
      '세무 전문가 상담',
      '필요 서류 준비',
      '신청 일정 계획 수립'
    ],
    핵심요약: {
      총세액공제가능액: formatCurrency(summary?.총계 || 0),
      즉시신청추천액: formatCurrency(summary?.사후관리종료 || 0),
      신중검토필요액: formatCurrency(summary?.사후관리진행중 || 0),
      신청불가액: formatCurrency(summary?.기간경과미신청 || 0)
    }
  };
};

// 기본 내보내기
export default {
  fetchTaxCreditAnalysis,
  fetchCompanyInfo,
  analyzeCompanyTaxCredit,
  formatCurrency,
  formatBizno,
  generateExecutiveReport
}; 