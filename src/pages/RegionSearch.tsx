import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_CONFIG } from '../config/pageConfig';

interface Company {
  사업자등록번호: string;
  사업장명: string;
  업종명: string;
  시도: string;
  구군: string;
  사업장주소: string;
  '2024': number;
  '2023': number;
  '2022': number;
}

const RegionSearch: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSido, setSelectedSido] = useState(searchParams.get('sido') || '');
  const [selectedGugun, setSelectedGugun] = useState(searchParams.get('gugun') || '');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // 주요 시도 목록
  const sidoList = [
    '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시', 
    '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원도', 
    '충청북도', '충청남도', '전라북도', '전라남도', '경상북도', '경상남도', '제주특별자치도'
  ];

  // API 호출 함수
  const fetchCompanies = async () => {
    if (!selectedSido) return;

    setLoading(true);
    try {
      let url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GET_SAMPLE_LIST}?sido=${encodeURIComponent(selectedSido)}`;
      
      if (selectedGugun) {
        url += `&gugun=${encodeURIComponent(selectedGugun)}`;
      }
      
      url += '&page=1&pageSize=20';

      console.log('🔍 API 호출 URL (RegionSearch):', url); // 디버깅용
      
      const response = await fetch(url);
      const data = await response.json();
      
      // API 응답 구조 처리
      let resultData = [];
      if (data.data && Array.isArray(data.data)) {
        resultData = data.data;
        setTotalCount(data.aggregates?.totalCount || data.data.length);
      } else if (Array.isArray(data)) {
        resultData = data;
        setTotalCount(data.length);
      }
      
      setCompanies(resultData);
    } catch (error) {
      console.error('API 호출 오류:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  // 검색 실행
  const handleSearch = () => {
    if (selectedSido) {
      const params = new URLSearchParams();
      params.set('sido', selectedSido);
      if (selectedGugun) {
        params.set('gugun', selectedGugun);
      }
      setSearchParams(params);
      fetchCompanies();
    }
  };

  // URL 파라미터가 있으면 자동 검색
  useEffect(() => {
    if (selectedSido) {
      fetchCompanies();
    }
  }, []);

  // 사업자등록번호 포맷팅
  const formatBizno = (bizno: string) => {
    if (!bizno || bizno.length !== 10) return bizno;
    return `${bizno.slice(0, 3)}-${bizno.slice(3, 5)}-${bizno.slice(5)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-blue-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Link to="/" className="mr-4 text-blue-200 hover:text-white">
              ← 홈으로
            </Link>
            <div>
              <h1 className="text-2xl font-bold">지역별 사업장 검색</h1>
              <p className="text-blue-200">시도/구군별 사업장 데이터 조회</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 검색 섹션 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">지역 선택</h2>
          
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시도 선택 *
              </label>
              <select
                value={selectedSido}
                onChange={(e) => setSelectedSido(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">시도를 선택하세요</option>
                {sidoList.map((sido) => (
                  <option key={sido} value={sido}>
                    {sido}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                구군 (선택사항)
              </label>
              <input
                type="text"
                value={selectedGugun}
                onChange={(e) => setSelectedGugun(e.target.value)}
                placeholder="예: 강남구, 해운대구"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={!selectedSido || loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {loading ? '검색 중...' : '검색'}
              </button>
            </div>
          </div>
        </div>

        {/* 결과 섹션 */}
        {companies.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                검색 결과: {totalCount.toLocaleString()}개 사업장
              </h3>
              <p className="text-gray-600">
                {selectedSido} {selectedGugun && selectedGugun}
              </p>
            </div>

            <div className="space-y-4">
              {companies.map((company, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">
                        {company.사업장명}
                      </h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">사업자등록번호:</span>{' '}
                          {formatBizno(company.사업자등록번호)}
                        </p>
                        <p>
                          <span className="font-medium">업종:</span> {company.업종명}
                        </p>
                        <p>
                          <span className="font-medium">주소:</span> {company.사업장주소}
                        </p>
                        <p>
                          <span className="font-medium">최근 고용인원:</span>{' '}
                          <span className="text-blue-600 font-semibold">
                            {company['2024'] || 0}명
                          </span>
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/company/${company.사업자등록번호}`}
                      className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      상세보기
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {companies.length >= 20 && (
              <div className="mt-8 text-center">
                <p className="text-gray-600 mb-4">더 많은 결과가 있습니다</p>
                <Link
                  to="/partner"
                  className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  파트너 전용 페이지에서 전체 결과 보기
                </Link>
              </div>
            )}
          </div>
        )}

        {/* 검색 전 안내 */}
        {!selectedSido && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">지역을 선택하세요</h3>
            <p className="text-gray-500">
              원하는 시도를 선택하고 검색 버튼을 클릭하면<br />
              해당 지역의 사업장 데이터를 확인할 수 있습니다
            </p>
          </div>
        )}

        {/* 검색 결과 없음 */}
        {selectedSido && !loading && companies.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
            <p className="text-gray-500">
              {selectedSido} {selectedGugun} 지역에서<br />
              조건에 맞는 사업장을 찾을 수 없습니다
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default RegionSearch; 