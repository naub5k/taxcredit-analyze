import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LabelList } from 'recharts';

interface CompanyInfo {
  bizno: string;
  companyName: string;
  industryName?: string;
  region: string;
  sido: string;
  gugun: string;
  recordId?: number;
  duplicateCount?: number;
}

interface AnalysisResult {
  baseYear: string;
  increaseCount: number;
  changeType: 'increase' | 'decrease' | 'none';
  availableTotal: number;
  employmentCredit: any;
  socialCredit: any;
  postManagementStatus?: any;
}

const EmploymentHistoryDashboard = () => {
  const [searchParams] = useSearchParams();
  const { bizno: urlBizno } = useParams();
  const navigate = useNavigate();
  
  // 📊 **상태 관리**
  const [bizno, setBizno] = useState(urlBizno || '');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 🏢 **업종 선택 상태 관리**
  const [industryOptions, setIndustryOptions] = useState<any[]>([]);
  const [showIndustrySelector, setShowIndustrySelector] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<any>(null);

  // 🎛️ **연도별 조정 파라미터**
  const [yearlyParams, setYearlyParams] = useState<{[year: string]: {youthCount: number, socialInsurance: number}}>({});

  // 📱 **반응형 상태**
  const [isMobile, setIsMobile] = useState(false);

  // 🔍 **반응형 감지**
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 📊 **API 호출 함수**
  const analyzeCompany = async (searchBizno: string, recordId?: string) => {
    if (!searchBizno.trim()) {
      setError('사업자등록번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysisData(null);
    setShowIndustrySelector(false);

    try {
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:7071/api/analyze'
        : 'https://taxcredit-api-func.azurewebsites.net/api/analyze';

      const url = recordId 
        ? `${apiUrl}?bizno=${searchBizno}&recordId=${recordId}`
        : `${apiUrl}?bizno=${searchBizno}`;

      console.log('🔍 API 호출:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      console.log('📊 API 응답:', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (data.mode === 'industry-selection') {
        // 🏢 **업종 선택 모드**
        setIndustryOptions(data.industryOptions || []);
        setShowIndustrySelector(true);
        setAnalysisData(null);
      } else if (data.mode === 'full-analysis') {
        // 📊 **분석 결과 모드**
        setAnalysisData(data);
        setShowIndustrySelector(false);
        setSelectedIndustry(null);
      }

    } catch (err: any) {
      console.error('❌ API 오류:', err);
      setError(err.message || '분석 중 오류가 발생했습니다.');
      setAnalysisData(null);
      setShowIndustrySelector(false);
    } finally {
      setLoading(false);
    }
  };

  // 🏢 **업종 선택 핸들러**
  const handleIndustrySelection = async (selectedOption: any) => {
    console.log('🏢 업종 선택:', selectedOption);
    setSelectedIndustry(selectedOption);
    await analyzeCompany(bizno, selectedOption.recordId.toString());
  };

  // 🔍 **분석 실행**
  const handleAnalyze = async () => {
    await analyzeCompany(bizno);
  };

  // 💰 **금액 포맷팅**
  const formatCurrency = (amount: number) => {
    if (amount === 0) return '0원';
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억원`;
    } else if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}만원`;
    } else {
      return `${amount.toLocaleString()}원`;
    }
  };

  // 📈 **차트 데이터 생성**
  const generateChartData = () => {
    if (!analysisData?.employeeData) return [];

    const employeeData = analysisData.employeeData;
    const years = Object.keys(employeeData).sort();
    
    return years.map(year => ({
      year,
      인원수: employeeData[year],
      연도: year
    }));
  };

  // 📊 **요약 통계 계산**
  const calculateSummary = () => {
    if (!analysisData?.analysisResults) return null;

    const results = analysisData.analysisResults;
    const totalCredit = results.reduce((sum: number, result: AnalysisResult) => sum + (result.availableTotal || 0), 0);
    const increaseYears = results.filter((r: AnalysisResult) => r.changeType === 'increase').length;
    const decreaseYears = results.filter((r: AnalysisResult) => r.changeType === 'decrease').length;

    return {
      totalCredit,
      increaseYears,
      decreaseYears,
      totalYears: results.length
    };
  };

  const summary = calculateSummary();
  const chartData = generateChartData();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 🎯 **헤더 - 고용이력부 스타일** */}
      <header className="bg-blue-700 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">세액공제 분석</h1>
          <p className="text-sm opacity-80 mt-1">고용증대 및 사회보험료 세액공제 분석 시스템</p>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4">
        {/* 🔍 **검색 섹션** */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">사업자등록번호 조회</h2>
          <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex flex-row space-x-3'}`}>
            <input
              type="text"
              value={bizno}
              onChange={(e) => setBizno(e.target.value)}
              placeholder="사업자등록번호 입력 (예: 1010818435)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleAnalyze()}
            />
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '분석중...' : '분석하기'}
            </button>
          </div>
        </div>

        {/* ⚠️ **오류 메시지** */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">❌</span>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* 🏢 **업종 선택 섹션** */}
        {showIndustrySelector && industryOptions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
              <span className="mr-2">🏢</span>
              업종 선택
            </h3>
            <p className="text-gray-600 mb-4">
              {industryOptions.length}개의 업종이 발견되었습니다. 분석할 업종을 선택해주세요.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {industryOptions.map((option, index) => (
                <div
                  key={index}
                  onClick={() => handleIndustrySelection(option)}
                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 cursor-pointer hover:bg-yellow-100 hover:border-yellow-300 transition-all active:scale-95"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{option.companyName}</h4>
                      <p className="text-sm text-gray-600 mt-1">{option.industryName}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {option.sido} {option.gugun} | 설립: {option.establishedDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-600">
                        2024년 {option.employeeCount2024}명
                      </p>
                      <p className="text-xs text-gray-500">업종코드: {option.industryCode}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📊 **분석 결과 섹션** */}
        {analysisData && (
          <>
            {/* 🏢 **회사 정보** */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="bg-blue-700 text-white p-4 rounded-t-lg -m-6 mb-4">
                <h3 className="text-xl font-bold">회사 정보</h3>
                <p className="text-sm opacity-80">{analysisData.companyInfo?.companyName}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700">사업자등록번호</h4>
                  <p className="text-lg font-bold text-blue-700">{analysisData.companyInfo?.bizno}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700">지역</h4>
                  <p className="text-lg font-bold text-green-700">
                    {analysisData.companyInfo?.region} ({analysisData.companyInfo?.sido})
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700">업종</h4>
                  <p className="text-lg font-bold text-purple-700">{analysisData.data?.업종명}</p>
                </div>
                {analysisData.companyInfo?.duplicateCount > 1 && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700">중복횟수</h4>
                    <p className="text-lg font-bold text-yellow-700">
                      {analysisData.companyInfo.duplicateCount}개 업종
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 📈 **요약 통계** */}
            {summary && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                  <span className="mr-2">📊</span>
                  분석 요약
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">총 세액공제</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalCredit)}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">증가 연도</p>
                    <p className="text-2xl font-bold text-green-600">{summary.increaseYears}년</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">감소 연도</p>
                    <p className="text-2xl font-bold text-red-600">{summary.decreaseYears}년</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">분석 기간</p>
                    <p className="text-2xl font-bold text-gray-600">{summary.totalYears}년</p>
                  </div>
                </div>
              </div>
            )}

            {/* 📈 **인원 변화 차트** */}
            {chartData.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                  <span className="mr-2">📈</span>
                  연도별 인원 변화
                </h3>
                <div className="h-80 md:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any) => [`${value}명`, '인원수']}
                        labelFormatter={(label: any) => `${label}년`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="인원수" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8 }}
                      >
                        <LabelList dataKey="인원수" position="top" />
                      </Line>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 📋 **연도별 상세 분석** */}
            {analysisData.analysisResults && analysisData.analysisResults.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                  <span className="mr-2">📋</span>
                  연도별 세액공제 분석
                </h3>
                <div className="space-y-4">
                  {analysisData.analysisResults.map((result: AnalysisResult, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-lg font-semibold text-gray-800">
                          {result.baseYear}년
                          {result.changeType === 'increase' && (
                            <span className="ml-2 text-green-600">↗ {result.increaseCount}명 증가</span>
                          )}
                          {result.changeType === 'decrease' && (
                            <span className="ml-2 text-red-600">↘ {Math.abs(result.increaseCount)}명 감소</span>
                          )}
                          {result.changeType === 'none' && (
                            <span className="ml-2 text-gray-500">→ 변화없음</span>
                          )}
                        </h4>
                        {result.changeType === 'increase' && (
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">
                              {formatCurrency(result.availableTotal)}
                            </p>
                            <p className="text-sm text-gray-500">세액공제 가능</p>
                          </div>
                        )}
                      </div>

                      {/* 🚨 **사후관리 상태** */}
                      {result.postManagementStatus && (
                        <div className={`p-3 rounded-lg ${result.postManagementStatus.bgColor} mb-3`}>
                          <div className="flex items-center">
                            <span className="mr-2">{result.postManagementStatus.icon}</span>
                            <div className="flex-1">
                              <span className={`font-medium ${result.postManagementStatus.textColor}`}>
                                {result.postManagementStatus.status}
                              </span>
                              <p className="text-sm text-gray-600 mt-1">
                                {result.postManagementStatus.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 💰 **세액공제 상세** */}
                      {result.changeType === 'increase' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-indigo-50 p-3 rounded-lg">
                            <h5 className="font-medium text-indigo-800 mb-2">고용증대세액공제</h5>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>1년차:</span>
                                <span className="font-medium">
                                  {result.employmentCredit?.year1?.available 
                                    ? formatCurrency(result.employmentCredit.year1.amount)
                                    : '기간만료'
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>2년차:</span>
                                <span className="font-medium">
                                  {result.employmentCredit?.year2?.available 
                                    ? formatCurrency(result.employmentCredit.year2.amount)
                                    : '기간만료'
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>3년차:</span>
                                <span className="font-medium">
                                  {result.employmentCredit?.year3?.available 
                                    ? formatCurrency(result.employmentCredit.year3.amount)
                                    : '기간만료'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-teal-50 p-3 rounded-lg">
                            <h5 className="font-medium text-teal-800 mb-2">사회보험료세액공제</h5>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>1년차:</span>
                                <span className="font-medium">
                                  {result.socialCredit?.year1?.available 
                                    ? formatCurrency(result.socialCredit.year1.amount)
                                    : '기간만료'
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>2년차:</span>
                                <span className="font-medium">
                                  {result.socialCredit?.year2?.available 
                                    ? formatCurrency(result.socialCredit.year2.amount)
                                    : '기간만료'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
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

export default EmploymentHistoryDashboard; 