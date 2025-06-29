import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import PensionInfoBlock from '../components/PensionInfoBlock';

/**
 * 🧪 국민연금 블럭 테스트 페이지
 * 
 * 목적: PensionInfoBlock 컴포넌트의 독립적인 테스트 및 디버깅
 * 경로: /pension-test?bizNo=1234567890&companyName=테스트회사
 * 
 * 기능:
 * - URL 파라미터로 사업자번호, 회사명 전달
 * - PensionInfoBlock 단독 렌더링
 * - 디버깅 정보 표시
 * - 대시보드로 돌아가기 버튼
 */

export default function PensionTestPage() {
  const navigate = useNavigate();
  const { bizNo: paramBizNo } = useParams();
  const [searchParams] = useSearchParams();
  
  // URL에서 파라미터 추출
  const bizNo = paramBizNo || searchParams.get('bizNo') || '';
  const companyName = searchParams.get('companyName') || '';
  
  console.log('🧪 PensionTestPage 렌더링');
  console.log('🔍 URL 파라미터:', { bizNo, companyName });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 🎯 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                🧪 국민연금 API 테스트
                                 <Badge variant="default" className="text-sm">
                   독립 테스트 페이지
                 </Badge>
              </h1>
              <p className="mt-2 text-gray-600">
                PensionInfoBlock 컴포넌트의 독립적인 테스트 및 디버깅을 위한 전용 페이지입니다.
              </p>
            </div>
                         <div className="flex gap-2">
               <Button
                 variant="outline"
                 onClick={() => {
                   // 히스토리가 있으면 뒤로가기, 없으면 홈으로
                   if (window.history.length > 1) {
                     navigate(-1);
                   } else {
                     navigate('/');
                   }
                 }}
                 className="flex items-center gap-2"
               >
                 ← 이전 페이지
               </Button>
               <Button
                 variant="default"
                 onClick={() => navigate('/')}
                 className="flex items-center gap-2"
               >
                 🏠 홈으로
               </Button>
             </div>
          </div>
        </div>

        {/* 📋 테스트 정보 카드 */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              📋 테스트 파라미터 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">사업자등록번호</h4>
                <div className="flex items-center gap-2">
                                     <Badge variant={bizNo ? "default" : "error"}>
                     {bizNo || '미제공'}
                   </Badge>
                  {bizNo && (
                    <span className="text-sm text-gray-600">
                      (길이: {bizNo.length}자)
                    </span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">회사명</h4>
                <div className="flex items-center gap-2">
                                     <Badge variant={companyName ? "default" : "warning"}>
                     {companyName || '미제공'}
                   </Badge>
                  {companyName && (
                    <span className="text-sm text-gray-600">
                      (길이: {companyName.length}자)
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* 🚨 경고 메시지 */}
            {!bizNo && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <span>⚠️</span>
                  <span className="font-semibold">사업자번호가 제공되지 않았습니다.</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  올바른 사업자번호를 URL 파라미터로 전달해주세요.
                  <br />
                  예: <code className="bg-red-100 px-1 rounded">/pension-test?bizNo=1234567890&companyName=회사명</code>
                </p>
              </div>
            )}
            
            {/* 💡 사용법 안내 */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <span>💡</span>
                <span className="font-semibold">사용법 안내</span>
              </div>
              <div className="text-sm text-blue-700 mt-1 space-y-1">
                <p>• URL 파라미터로 테스트: <code className="bg-blue-100 px-1 rounded">?bizNo=1068100044&companyName=궤도공영</code></p>
                <p>• 경로 파라미터로 테스트: <code className="bg-blue-100 px-1 rounded">/pension-test/1068100044</code></p>
                <p>• 브라우저 개발자 도구(F12)에서 API 호출 로그 확인 가능</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🏛️ 국민연금 블럭 테스트 영역 */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">🏛️ 국민연금 블럭 테스트</h2>
                         <Badge variant="default" className="text-xs">
               PensionInfoBlock 단독 렌더링
             </Badge>
          </div>
          
          {/* 실제 PensionInfoBlock 컴포넌트 렌더링 */}
          <PensionInfoBlock 
            defaultBizNo={bizNo}
            companyName={companyName}
          />
        </div>

        {/* 🔧 디버깅 도구 */}
        <Card className="mt-8 border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center gap-2">
              🔧 디버깅 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">현재 URL 정보</h4>
                <div className="bg-gray-100 p-3 rounded-lg text-sm font-mono">
                  <div>현재 경로: {window.location.pathname}</div>
                  <div>쿼리 파라미터: {window.location.search}</div>
                  <div>전체 URL: {window.location.href}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">전달된 Props</h4>
                <div className="bg-gray-100 p-3 rounded-lg text-sm">
                  <pre>{JSON.stringify({ bizNo, companyName }, null, 2)}</pre>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">테스트 샘플 링크</h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/pension-test?bizNo=1068100044&companyName=궤도공영(주)')}
                  >
                    궤도공영(주) 테스트
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/pension-test?bizNo=1068100516&companyName=이연제약(주)')}
                  >
                    이연제약(주) 테스트
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/pension-test?bizNo=1068104152&companyName=희성전자(주)')}
                  >
                    희성전자(주) 테스트
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/pension-test?bizNo=1088202313&companyName=노들새마을금고')}
                  >
                    노들새마을금고 테스트
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 📝 페이지 정보 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            🧪 PensionTestPage.tsx | 
            작성일: 2025-06-19 | 
            목적: 국민연금 블럭 독립 테스트
          </p>
        </div>
      </div>
    </div>
  );
} 