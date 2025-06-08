import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [bizno, setBizno] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 🔍 사업자등록번호 검색 핸들러
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bizno.trim()) {
      alert('사업자등록번호를 입력해주세요.');
      return;
    }

    // 사업자등록번호 형식 간단 체크
    const cleanBizno = bizno.replace(/[^0-9]/g, '');
    if (cleanBizno.length !== 10) {
      alert('사업자등록번호는 10자리 숫자입니다.');
      return;
    }

    setIsSearching(true);
    
    // 회사 상세 페이지로 이동
    navigate(`/company/${cleanBizno}`);
  };

  // 사업자등록번호 자동 포맷팅
  const handleBiznoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 10) {
      // 자동으로 하이픈 추가 (123-45-67890)
      if (value.length > 5) {
        value = value.replace(/(\d{3})(\d{2})(\d{0,5})/, '$1-$2-$3');
      } else if (value.length > 3) {
        value = value.replace(/(\d{3})(\d{0,2})/, '$1-$2');
      }
      setBizno(value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="bg-blue-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold">세액공제 경정청구 분석 플랫폼</h1>
          <p className="text-xl opacity-90 mt-3">2016-2025년 400만 사업장 데이터 기반 AI 분석</p>
          <p className="text-lg opacity-80 mt-2">💰 "당신의 기업은 OO억원 환급 가능합니다" - 즉시 확인</p>
        </div>
      </header>

      {/* 🔍 메인 검색 섹션 */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            🎯 사업자등록번호로 즉시 분석
          </h2>
          <p className="text-xl mb-8 opacity-90">
            10자리 사업자등록번호만 입력하면<br />
            <span className="font-bold text-yellow-300">3분 안에</span> 세액공제 가능금액을 확인할 수 있습니다
          </p>
          
          {/* 검색 폼 */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 bg-white rounded-2xl p-6 shadow-xl">
              <div className="flex-1">
                <label htmlFor="bizno" className="block text-left text-gray-700 text-sm font-bold mb-2">
                  사업자등록번호 (10자리)
                </label>
                <input
                  type="text"
                  id="bizno"
                  value={bizno}
                  onChange={handleBiznoChange}
                  placeholder="123-45-67890"
                  className="w-full px-4 py-3 text-gray-800 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSearching}
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !bizno}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg text-lg font-bold transition-colors disabled:cursor-not-allowed sm:mt-7"
              >
                {isSearching ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    분석중...
                  </span>
                ) : (
                  '🚀 무료 분석'
                )}
              </button>
            </div>
          </form>

          {/* 예시 버튼들 */}
          <div className="mt-8">
            <p className="text-sm opacity-75 mb-4">테스트용 예시 사업자등록번호:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['123-45-67890', '987-65-43210', '555-66-77788'].map((example) => (
                <button
                  key={example}
                  onClick={() => setBizno(example)}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-4 py-12">
        {/* 핵심 가치 제안 */}
        <section className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-800 mb-8">
            🎯 실시간 경정청구 대상금액 계산
          </h2>
          <p className="text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
            <span className="font-bold text-blue-600">고용증대세액공제</span>와 <span className="font-bold text-green-600">사회보험료세액공제</span><br />
            경정청구 가능금액을 사업자번호 입력 한 번으로 즉시 분석
          </p>
          
          {/* 핵심 메시지 박스 */}
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-8 mb-8 border-2 border-purple-200">
            <h3 className="text-2xl font-bold text-purple-800 mb-4">
              🚀 5년 이내 누락된 세액공제, 아직 늦지 않았습니다!
            </h3>
            <p className="text-lg text-purple-700">
              2019년~2024년 고용 증가분에 대한 경정청구로<br />
              <span className="font-bold text-2xl">수천만원~수억원</span>의 세금 환급이 가능할 수 있습니다
            </p>
          </div>
        </section>

        {/* 3단계 분류 시스템 소개 */}
        <section className="mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
            📊 AI가 분석하는 3단계 위험도 분류
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* 즉시 신청 */}
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow border-2 border-green-200">
              <div className="text-6xl mb-6">💚</div>
              <h4 className="text-2xl font-bold text-green-600 mb-4">즉시 신청</h4>
              <div className="text-sm text-gray-600 mb-4 font-semibold">사후관리종료</div>
              <p className="text-gray-700 leading-relaxed mb-6">
                • 추징 위험 <span className="font-bold text-green-600">없음</span><br />
                • 안전한 경정청구 가능<br />
                • 즉시 신청 권장<br />
                • 일반적으로 가장 큰 금액
              </p>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-800 font-semibold">
                  평균 회수 가능액<br />
                  <span className="text-2xl">1억~3억원</span>
                </p>
              </div>
            </div>

            {/* 신중 검토 */}
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow border-2 border-yellow-200">
              <div className="text-6xl mb-6">⚠️</div>
              <h4 className="text-2xl font-bold text-yellow-600 mb-4">신중 검토</h4>
              <div className="text-sm text-gray-600 mb-4 font-semibold">사후관리진행중</div>
              <p className="text-gray-700 leading-relaxed mb-6">
                • 추징 위험 <span className="font-bold text-yellow-600">있음</span><br />
                • 전문가 상담 필수<br />
                • 신중한 판단 필요<br />
                • 위험 대비 수익성 검토
              </p>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-yellow-800 font-semibold">
                  평균 회수 가능액<br />
                  <span className="text-2xl">5천만~1억원</span>
                </p>
              </div>
            </div>

            {/* 신청 불가 */}
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow border-2 border-red-200">
              <div className="text-6xl mb-6">❌</div>
              <h4 className="text-2xl font-bold text-red-600 mb-4">신청 불가</h4>
              <div className="text-sm text-gray-600 mb-4 font-semibold">기간경과미신청</div>
              <p className="text-gray-700 leading-relaxed mb-6">
                • 경정청구 기간 <span className="font-bold text-red-600">만료</span><br />
                • 5년 기한 초과<br />
                • 신청 불가능<br />
                • 향후 참고용으로만 활용
              </p>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-red-800 font-semibold">
                  놓친 기회비용<br />
                  <span className="text-2xl">3천만~8천만원</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 실제 성과 사례 */}
        <section className="mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
            📈 실제 분석 사례 (한헬스케어)
          </h3>
          
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">3.2억원</div>
                <div className="text-sm text-gray-600 mt-1">총 가능금액</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">1.8억원</div>
                <div className="text-sm text-gray-600 mt-1">💚 즉시신청</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">0.98억원</div>
                <div className="text-sm text-gray-600 mt-1">⚠️ 신중검토</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">0.42억원</div>
                <div className="text-sm text-gray-600 mt-1">❌ 신청불가</div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-bold text-gray-800 mb-3">✅ 분석 결과</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• <span className="font-semibold">2017~2023년</span> 고용 증가에 따른 세액공제 누락분 발견</li>
                <li>• <span className="font-semibold">1.8억원</span> 안전한 즉시 신청 권장</li>
                <li>• <span className="font-semibold">0.98억원</span> 추가 상담 후 신중 검토</li>
                <li>• 전체적으로 <span className="font-semibold text-blue-600">2.78억원 회수 가능성</span></li>
              </ul>
            </div>
          </div>
        </section>

        {/* 핵심 기능 소개 */}
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* 1. 즉시 분석 */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">즉시 분석</h3>
            <p className="text-gray-600 mb-4">
              • 사업자번호 입력 → 즉시 결과<br />
              • 2016-2025년 전체 기간 분석<br />
              • 연도별 상세 계산<br />
              • 실시간 위험도 평가
            </p>
            <Link 
              to="/region" 
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              지금 분석하기 →
            </Link>
          </div>

          {/* 2. 실시간 조정 */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🎛️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">실시간 조정</h3>
            <p className="text-gray-600 mb-4">
              • 청년 비율 슬라이더<br />
              • 실제 사회보험료 반영<br />
              • 즉시 재계산<br />
              • 최적화된 시나리오 분석
            </p>
            <div className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
              고급 기능
            </div>
          </div>

          {/* 3. 전문가 연계 */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">전문가 연계</h3>
            <p className="text-gray-600 mb-4">
              • 세무사 파트너 네트워크<br />
              • 즉시 상담 연결<br />
              • 안전한 신청 지원<br />
              • 성공수수료 기반
            </p>
            <Link 
              to="/partner" 
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              전문가 상담 →
            </Link>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-xl p-12 text-center">
          <h3 className="text-3xl font-bold mb-6">
            🚀 지금 바로 확인해보세요!
          </h3>
          <p className="text-xl mb-8 opacity-90">
            사업자등록번호만 있으면 3분 안에<br />
            경정청구 가능금액을 정확히 알 수 있습니다
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            <Link 
              to="/region" 
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors flex-1"
            >
              📊 무료 분석 시작
            </Link>
            <Link 
              to="/partner" 
              className="bg-purple-700 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-purple-800 transition-colors flex-1"
            >
              👨‍💼 전문가 상담
            </Link>
          </div>
          
          <p className="text-sm mt-6 opacity-75">
            💡 완전 무료 분석 | ⚡ 즉시 결과 확인 | 🔒 안전한 데이터 처리
          </p>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="bg-gray-800 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-bold mb-4">세액공제 경정청구 분석</h4>
              <p className="text-gray-400 leading-relaxed">
                400만 사업장 데이터를 기반으로<br />
                정확하고 안전한 세액공제 분석을<br />
                제공하는 AI 플랫폼입니다.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">주요 기능</h4>
              <ul className="text-gray-400 space-y-2">
                <li>• 2016-2025년 시계열 분석</li>
                <li>• 3단계 위험도 분류</li>
                <li>• 실시간 파라미터 조정</li>
                <li>• 전문가 상담 연계</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">지원 범위</h4>
              <ul className="text-gray-400 space-y-2">
                <li>• 고용증대세액공제</li>
                <li>• 사회보험료세액공제</li>
                <li>• 경정청구 기간 자동 체크</li>
                <li>• 사후관리 기간 추적</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 세액공제 경정청구 분석 플랫폼 | 대한민국 400만 사업장 데이터 기반 AI 서비스
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage; 