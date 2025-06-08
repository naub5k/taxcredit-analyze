/**
 * 🏢 페이지 설정 통합 파일 v2.1
 * IDE작업기준서 + 함수작성기준 완전 반영
 * 단순화 원칙: 중소기업 통일, 청년외 기본값, 1인당 10만원 표준 사회보험료
 */

// 📍 페이지 라우팅 설정
export const PAGE_ROUTES = {
  HOME: '/',
  REGION_ANALYSIS: '/region',
  COMPANY_DETAIL: '/company/:bizno',
  DATA_SHOWCASE: '/data',
  TARGET_PROSPECTS: '/prospects', 
  PARTNER_CENTER: '/partner',
  SUPPORT_REQUEST: '/support'
};

// 🎯 비즈니스 퍼널 5단계 전략 (IDE작업기준서 반영)
export const BUSINESS_FUNNEL = {
  AWARENESS: {
    key: 'awareness',
    title: '인지 단계',
    description: '400만 사업장 세액공제 잠재고객 발굴',
    action: '지역별 검색 제공'
  },
  INTEREST: {
    key: 'interest',
    title: '관심 단계', 
    description: '3단계 분류로 즉시 위험도 파악',
    action: '💚즉시신청/⚠️신중검토/❌신청불가'
  },
  CONSIDERATION: {
    key: 'consideration',
    title: '검토 단계',
    description: '실시간 조정으로 정확한 금액 계산',
    action: '청년 비율/사회보험료 슬라이더'
  },
  INTENT: {
    key: 'intent',
    title: '의도 단계',
    description: '한헬스케어 3.2억원 성과 사례 제시',
    action: '전문 상담 요청 유도'
  },
  PURCHASE: {
    key: 'purchase',
    title: '구매 단계',
    description: '세무사 파트너 연결 및 컨설팅 계약',
    action: '파트너센터 연결'
  }
};

// 💰 세액공제 계산 설정 (최신 기준 완전 반영)
export const TAX_CREDIT_CONFIG = {
  // 🗺️ 지역 분류 (최신 기준)
  METROPOLITAN_AREAS: ["서울특별시", "경기도", "인천광역시"],
  
  // 🏭 신성장서비스업 업종코드 (최신 기준)
  NEW_GROWTH_INDUSTRY_CODES: ["62", "63", "72"], // IT, 연구개발, 전문서비스
  
  // 💼 회사 규모 통일 (단순화 원칙)
  COMPANY_TYPE: "중소기업", // 모든 기업을 중소기업으로 통일 처리
  
  // 📊 연도별 1인당 고용증대세액공제 기준표 (중소기업 전용)
  EMPLOYMENT_CREDIT_RATES: {
    "2017": { "수도권": 600, "수도권외": 660 },
    "2018": { "수도권": 600, "수도권외": 660 },
    "2019": { "수도권": 600, "수도권외": 660 },
    "2020": { "수도권": 700, "수도권외": 770 },
    "2021": { "수도권": 700, "수도권외": 770 },
    "2022": { "수도권": 700, "수도권외": 770 },
    "2023": { "수도권": 700, "수도권외": 770 },
    "2024": { "수도권": 700, "수도권외": 770 }
  },
  
  // 👥 청년등 배수 (최신 기준)
  YOUTH_MULTIPLIER: {
    "수도권": 1.57,    // 1100/700 = 1.57배
    "수도권외": 1.56   // 1200/770 = 1.56배
  },
  
  // 🛡️ 사회보험료세액공제 기준 (최신 기준)
  SOCIAL_INSURANCE_RATES: {
    "청년외_일반": 0.5,     // 50%
    "청년외_신성장": 0.75,  // 75% (신성장서비스업)
    "청년등_배수": 2.0      // 청년등은 100%이므로 50%의 2배
  },
  
  // 💸 표준 사회보험료 (단순화 원칙)
  STANDARD_INSURANCE_PER_EMPLOYEE: 10, // 1인당 연간 10만원 (만원 단위)
  
  // 📅 경정청구 및 사후관리 기간
  AMENDMENT_PERIOD_YEARS: 5, // 경정청구 기간 5년
  POST_MANAGEMENT_PERIODS: {
    "고용증대세액공제": 2, // 2년
    "사회보험료세액공제": 1  // 1년 (2022년부터)
  },
  
  // 🔄 중복 적용 기준년도
  DUPLICATE_ELIGIBILITY_UNTIL: 2024 // 2024년까지 중복 적용 가능
};

// 🎯 3단계 위험도 분류 시스템 (IDE작업기준서 완전 반영)
export const RISK_CLASSIFICATION = {
  IMMEDIATE_APPLICATION: {
    key: 'immediate',
    status: '사후관리종료',
    icon: '💚',
    title: '즉시 신청',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    gradient: 'from-green-500 to-green-600',
    description: '사후관리 완료로 안전한 신청 가능',
    recommendation: '즉시 경정청구 신청 권장',
    risk_level: 'LOW'
  },
  CAREFUL_REVIEW: {
    key: 'careful',
    status: '사후관리진행중',
    icon: '⚠️',
    title: '신중 검토',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    gradient: 'from-orange-500 to-orange-600',
    description: '추징 위험 검토 필요',
    recommendation: '전문가 상담 후 신중한 판단 필요',
    risk_level: 'MEDIUM'
  },
  NOT_ELIGIBLE: {
    key: 'not_eligible',
    status: '기간경과미신청',
    icon: '❌',
    title: '신청 불가',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    gradient: 'from-red-500 to-red-600',
    description: '경정청구 기간 만료',
    recommendation: '신청 불가 (기간 만료)',
    risk_level: 'HIGH'
  }
};

// 🌐 API 엔드포인트 설정
export const API_CONFIG = {
  BASE_URL: 'https://taxcredit-api-func.azurewebsites.net/api',  // ✅ 실제 배포된 V1 API
  ENDPOINTS: {
    ANALYZE_COMPANY_DATA: '/analyzeCompanyData',
    ANALYZE: '/analyze',  // 추가
    HEALTH_CHECK: '/healthcheck',
    PING: '/ping'
  },
  
  // API 응답 시간 기준 (IDE작업기준서 품질 기준)
  PERFORMANCE_TARGETS: {
    API_RESPONSE_TIME: 500,     // 500ms 이내
    REALTIME_CALCULATION: 100, // 실시간 재계산 100ms 이내
    DB_QUERY_TIME: 50          // DB 쿼리 50ms 이내
  }
};

// 📊 한헬스케어 검증 기준 (IDE작업기준서 예시)
export const VALIDATION_CRITERIA = {
  HANHEALTH_EXAMPLE: {
    companyName: "주식회사 한헬스케어",
    bizno: "123-45-67890",
    expectedResults: {
      기간경과미신청: 42000000,    // 4,200만원
      사후관리종료: 182000000,     // 1억 8,200만원  
      사후관리진행중: 98000000,    // 9,800만원
      총계: 322000000             // 3억 2,200만원
    },
    employeeData: {
      "2017": 2, "2018": 6, "2019": 8, "2020": 10, 
      "2021": 12, "2022": 14, "2023": 18, "2024": 18
    }
  }
};

// 🎨 UI 스타일 테마
export const UI_THEME = {
  // 3단계 분류별 색상 시스템
  COLORS: {
    즉시신청: {
      primary: '#22c55e',
      bg: '#dcfce7',
      text: '#166534'
    },
    신중검토: {
      primary: '#f59e0b', 
      bg: '#fef3c7',
      text: '#92400e'
    },
    신청불가: {
      primary: '#ef4444',
      bg: '#fee2e2', 
      text: '#991b1b'
    }
  },
  
  // 상태별 아이콘
  ICONS: {
    총가능금액: '💰',
    즉시신청: '💚', 
    신중검토: '⚠️',
    신청불가: '❌',
    실행권고: '📋',
    세부조정: '🔧',
    시계열분석: '📅'
  }
};

// 📱 모바일 대응 설정
export const RESPONSIVE_CONFIG = {
  BREAKPOINTS: {
    mobile: '640px',
    tablet: '768px', 
    desktop: '1024px',
    wide: '1280px'
  },
  
  // 카드 그리드 설정
  CARD_GRID: {
    mobile: 'grid-cols-2',      // 모바일: 2열
    tablet: 'md:grid-cols-2',   // 태블릿: 2열
    desktop: 'lg:grid-cols-4'   // 데스크톱: 4열
  }
};

// 📈 성능 모니터링 설정
export const MONITORING_CONFIG = {
  // 사용량 추적
  USAGE_TRACKING: {
    enabled: true,
    events: ['page_view', 'company_analysis', 'adjustment_change', 'report_generation']
  },
  
  // 에러 추적
  ERROR_TRACKING: {
    enabled: true,
    categories: ['api_error', 'calculation_error', 'ui_error']
  },
  
  // 성능 메트릭
  PERFORMANCE_METRICS: {
    enabled: true,
    targets: API_CONFIG.PERFORMANCE_TARGETS
  }
};

// 📞 지원 및 문의 설정
export const SUPPORT_CONFIG = {
  CONTACT_INFO: {
    email: 'support@taxcredit.co.kr',
    phone: '02-1234-5678',
    business_hours: '평일 09:00-18:00'
  },
  
  HELP_CATEGORIES: [
    { id: 'calculation', title: '세액공제 계산 문의' },
    { id: 'amendment', title: '경정청구 절차 문의' }, 
    { id: 'risk', title: '위험도 평가 문의' },
    { id: 'technical', title: '시스템 사용법 문의' }
  ]
}; 