import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const PartnerPage: React.FC = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    region: '',
    experience: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 실제로는 API 호출하여 파트너 신청 정보를 전송
    console.log('파트너 신청 정보:', formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="text-green-500 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">신청이 완료되었습니다!</h2>
          <p className="text-gray-600 mb-6">
            파트너십 신청서가 성공적으로 제출되었습니다.<br />
            영업일 기준 2-3일 내에 연락드리겠습니다.
          </p>
          <Link 
            to="/" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-purple-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center">
            <Link to="/" className="mr-4 text-purple-200 hover:text-white">
              ← 홈으로
            </Link>
            <div>
              <h1 className="text-3xl font-bold">파트너 전용 페이지</h1>
              <p className="text-lg opacity-90 mt-2">세무사님을 위한 프리미엄 서비스</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 파트너 혜택 소개 */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              👥 파트너가 되면 이런 혜택이!
            </h2>
            <p className="text-xl text-gray-600">
              400만 사업장 데이터를 활용한 전문 세액공제 컨설팅 툴을 제공합니다
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">무제한 데이터 접근</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• 전국 400만+ 사업장 정보</li>
                <li>• 연도별 고용 데이터</li>
                <li>• 업종별 상세 분석</li>
                <li>• 실시간 데이터 업데이트</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">AI 분석 도구</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• 세액공제 자격 자동 판정</li>
                <li>• 맞춤형 타겟 기업 추천</li>
                <li>• 예상 세액공제 금액 계산</li>
                <li>• 우선순위 기업 랭킹</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">💼</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">비즈니스 지원</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• 전담 계정 매니저</li>
                <li>• 월간 리포트 제공</li>
                <li>• 세무 업데이트 알림</li>
                <li>• 기술 지원 서비스</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 요금제 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">💰 요금제</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-md p-8 border-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4">스탠다드</h3>
              <div className="text-3xl font-bold text-blue-600 mb-4">월 99만원</div>
              <ul className="space-y-3 text-gray-600 mb-6">
                <li>✅ 기본 데이터 검색</li>
                <li>✅ 월 1,000건 조회</li>
                <li>✅ 기본 AI 분석</li>
                <li>✅ 이메일 지원</li>
              </ul>
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors">
                문의하기
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8 border-2 border-purple-500 relative">
              <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1 rounded-tr-xl rounded-bl-xl text-sm font-semibold">
                추천
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">프리미엄</h3>
              <div className="text-3xl font-bold text-purple-600 mb-4">월 199만원</div>
              <ul className="space-y-3 text-gray-600 mb-6">
                <li>✅ 무제한 데이터 접근</li>
                <li>✅ 고급 AI 분석 도구</li>
                <li>✅ 실시간 알림 서비스</li>
                <li>✅ 전담 매니저 배정</li>
                <li>✅ 월간 맞춤 리포트</li>
                <li>✅ 24/7 전화 지원</li>
              </ul>
              <button className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors">
                지금 시작하기
              </button>
            </div>
          </div>
        </section>

        {/* 파트너 신청 폼 */}
        <section className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            🤝 파트너십 신청하기
          </h2>
          
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사무소명 *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="예: 김세무 세무회계사무소"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  담당자명 *
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="세무사 성함"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  연락처 *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="010-0000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  주요 활동 지역 *
                </label>
                <input
                  type="text"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="예: 서울 강남구, 경기 성남시"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  세무 경력 *
                </label>
                <select
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">선택하세요</option>
                  <option value="1-3년">1-3년</option>
                  <option value="3-5년">3-5년</option>
                  <option value="5-10년">5-10년</option>
                  <option value="10년 이상">10년 이상</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                추가 문의사항
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="궁금한 점이나 요청사항을 자유롭게 작성해주세요"
              />
            </div>

            <div className="text-center">
              <button
                type="submit"
                className="bg-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                파트너십 신청하기
              </button>
            </div>
          </form>
        </section>

        {/* 연락처 정보 */}
        <section className="mt-12 bg-gray-800 text-white rounded-lg p-8 text-center">
          <h3 className="text-xl font-bold mb-4">📞 직접 문의</h3>
          <p className="text-gray-300 mb-4">
            더 자세한 상담이나 맞춤형 제안이 필요하시면 언제든 연락주세요
          </p>
          <div className="flex justify-center space-x-8">
            <div>
              <div className="font-semibold">전화</div>
              <div className="text-gray-300">02-0000-0000</div>
            </div>
            <div>
              <div className="font-semibold">이메일</div>
              <div className="text-gray-300">partner@taxcredit.co.kr</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PartnerPage; 