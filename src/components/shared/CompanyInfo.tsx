import React from 'react';

interface CompanyInfoProps {
  companyInfo: {
    bizno: string;
    companyName: string;
    region: string;
    industry: string;
    sido?: string;
    gugun?: string;
  };
  accessLevel?: 'public' | 'partner' | 'premium';
  showFullDetails?: boolean;
}

const CompanyInfo: React.FC<CompanyInfoProps> = ({ 
  companyInfo, 
  accessLevel = 'public',
  showFullDetails = true 
}) => {
  // 사업자등록번호 하이픈 삽입 (123-45-67890 형식)
  const formatBusinessNumber = (bizno: string) => {
    if (!bizno || bizno.length !== 10) return bizno;
    return `${bizno.slice(0, 3)}-${bizno.slice(3, 5)}-${bizno.slice(5)}`;
  };

  // 접근 레벨에 따른 정보 표시 제어
  const canShowBizno = accessLevel !== 'public' || showFullDetails;
  const canShowDetailedInfo = accessLevel === 'partner' || accessLevel === 'premium';

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="bg-blue-700 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-bold">회사 정보</h2>
        <p className="text-sm opacity-80">{companyInfo.companyName}</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 사업자등록번호 - 조건부 표시 */}
          {canShowBizno && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700">사업자등록번호</h4>
              <p className="text-lg font-bold text-blue-700 font-mono">
                {formatBusinessNumber(companyInfo.bizno)}
              </p>
            </div>
          )}
          
          {/* 지역 정보 */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700">지역</h4>
            <p className="text-lg font-bold text-green-700">{companyInfo.region}</p>
            {canShowDetailedInfo && companyInfo.sido && (
              <p className="text-sm text-green-600">{companyInfo.sido} {companyInfo.gugun}</p>
            )}
          </div>
          
          {/* 업종 정보 */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700">업종</h4>
            <p className="text-lg font-bold text-purple-700">
              {canShowDetailedInfo ? companyInfo.industry : '일반업종'}
            </p>
          </div>
          
          {/* 분석일 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700">분석일</h4>
            <p className="text-lg font-bold text-gray-700">
              {new Date().toLocaleDateString('ko-KR')}
            </p>
          </div>

          {/* 접근 제한 안내 (public 레벨에서 일부 정보 숨김) */}
          {!canShowBizno && (
            <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
              <h4 className="font-medium text-yellow-800">🔒 제한된 정보</h4>
              <p className="text-sm text-yellow-700">
                파트너 회원 전용 정보입니다
              </p>
            </div>
          )}
        </div>

        {/* 공개 레벨 안내 */}
        {accessLevel === 'public' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 더 자세한 기업 정보는 파트너 회원으로 가입하시면 확인하실 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyInfo; 