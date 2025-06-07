/**
 * 🎯 InsuCleanRecord 타입 정의 v2.1
 * Azure SQL insu_clean 테이블의 실제 컬럼 스키마와 1:1 매칭
 * 작업요청서_20250604_002 기준으로 작성
 * 
 * ✅ 실제 DB 반환 구조 반영:
 * - 연도 컬럼: [2016], [2017] 등 대괄호 형태
 * - 제외여부 컬럼 포함
 * - 실제 컬럼명 그대로 유지
 */

export interface InsuCleanRecord {
  // 🏢 기본 회사 정보
  사업자등록번호: string;
  사업장명: string;
  우편번호: string;
  사업장주소: string;
  업종코드: string;
  업종명: string;
  성립일자: string; // ISO 날짜 문자열 또는 SQL datetime 문자열

  // 📅 연도별 상시근로자 수 (실제 DB 컬럼명: [2016] ~ [2025])
  // ✅ 대괄호 포함된 실제 컬럼명과 일반 문자열 둘 다 대응
  "2016": number;
  "2017": number;
  "2018": number;
  "2019": number;
  "2020": number;
  "2021": number;
  "2022": number;
  "2023": number;
  "2024": number;
  "2025": number;

  // 🔍 대괄호 포함된 실제 DB 컬럼명 (선택적)
  "[2016]"?: number;
  "[2017]"?: number;
  "[2018]"?: number;
  "[2019]"?: number;
  "[2020]"?: number;
  "[2021]"?: number;
  "[2022]"?: number;
  "[2023]"?: number;
  "[2024]"?: number;
  "[2025]"?: number;

  // 📊 분류 및 관리 정보
  중복횟수: number;
  분류: string;
  시도: string;
  구군: string;
  제외여부: string; // "Y" | "N" | "" 등 가능
  "[제외여부]"?: string; // 대괄호 형태도 대응

  // 🔍 기타 가능한 컬럼들 (실제 DB에 따라)
  [key: string]: any; // 예상하지 못한 컬럼들을 위한 인덱스 시그니처
}

// 🎯 연도 접근 헬퍼 함수들
export const getYearValue = (record: InsuCleanRecord, year: string): number => {
  // 일반 문자열 형태 먼저 확인
  if (record[year] !== undefined) return record[year];
  // 대괄호 형태 확인
  if (record[`[${year}]`] !== undefined) return record[`[${year}]`];
  return 0;
};

export const getExclusionStatus = (record: InsuCleanRecord): string => {
  return record.제외여부 || record["[제외여부]"] || "";
};

// 🎯 선택적 타입들 (필요시 사용)
export type InsuCleanYearColumns = {
  [K in "2016" | "2017" | "2018" | "2019" | "2020" | "2021" | "2022" | "2023" | "2024" | "2025"]: number;
};

export type InsuCleanBasicInfo = Pick<InsuCleanRecord, 
  "사업자등록번호" | "사업장명" | "시도" | "구군" | "업종명" | "제외여부"
>;

// 🎯 API 응답 타입 (analyze 함수 응답 구조)
export interface InsuCleanApiResponse {
  success: true;
  bizno: string;
  mode: 'data-only' | 'full-with-ai' | 'ai-only';
  queryInfo: {
    table: 'insu_clean';
    totalColumns: number;
    yearColumns: string[];
    executionTime: string;
    timestamp: string;
  };
  data: InsuCleanRecord;
  aiAnalysis?: any; // AI 분석 결과 (선택적)
}

// 🎯 에러 응답 타입
export interface InsuCleanApiError {
  success: false;
  bizno: string;
  error: string;
  queryInfo?: {
    table: 'insu_clean';
    executionTime: string;
    timestamp: string;
  };
}

// 🎯 API 응답 통합 타입
export type InsuCleanApiResult = InsuCleanApiResponse | InsuCleanApiError; 