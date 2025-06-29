// 공개 구조 분할 기반 공통 컴포넌트 Export
// 2025-06-29 구조 분할 요청서 기준

export { default as CompanyInfo } from './CompanyInfo';
export { default as GrowthChart } from './GrowthChart';  
export { default as TaxCreditAnalysis } from './TaxCreditAnalysis';

// 타입 정의도 함께 export
export type {
  CompanyInfoProps,
  GrowthChartProps,
  TaxCreditAnalysisProps,
  AccessLevel
} from './types';

// 공개 레벨 타입 정의
export type AccessLevel = 'public' | 'partner' | 'premium';

// 컴포넌트별 Props 타입
export interface CompanyInfoProps {
  companyInfo: {
    bizno: string;
    companyName: string;
    region: string;
    industry: string;
    sido?: string;
    gugun?: string;
  };
  accessLevel?: AccessLevel;
  showFullDetails?: boolean;
}

export interface GrowthChartProps {
  chartData: {
    year: string;
    employees: number;
    change: number;
  }[];
  accessLevel?: AccessLevel;
  showChart?: boolean;
}

export interface TaxCreditAnalysisProps {
  taxCreditData: {
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
  };
  accessLevel?: AccessLevel;
  showAnalysis?: boolean;
} 