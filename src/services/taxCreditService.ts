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

// 기본 내보내기
export default {
  fetchTaxCreditAnalysis,
  fetchCompanyInfo
}; 