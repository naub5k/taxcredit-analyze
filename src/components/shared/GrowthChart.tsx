import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface ChartDataItem {
  year: string;
  employees: number;
  change: number;
}

interface GrowthChartProps {
  chartData: ChartDataItem[];
  accessLevel?: 'public' | 'partner' | 'premium';
  showChart?: boolean;
}

const GrowthChart: React.FC<GrowthChartProps> = ({ 
  chartData, 
  accessLevel = 'public',
  showChart = true 
}) => {
  // 파트너 이상 레벨에서만 차트 표시
  const canShowChart = accessLevel === 'partner' || accessLevel === 'premium';
  
  // 차트가 잠겨있을 때 표시할 내용
  if (!canShowChart || !showChart) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📈 인원 증감 현황</CardTitle>
          <p className="text-sm text-gray-600">연도별 상시근로자 수 변화와 증감량을 보여줍니다</p>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* 흐린 배경 차트 (미리보기) */}
            <div className="opacity-20 pointer-events-none">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6">
                <div className="bg-white p-6 rounded-lg">
                  <div className="flex justify-between items-end h-40 px-4">
                    {[1, 2, 3, 4, 5, 6].map((_, index) => (
                      <div key={index} className="flex flex-col items-center w-full max-w-[120px] text-center">
                        <div className="text-sm font-bold text-gray-700 mb-2 h-6 flex items-center justify-center">
                          **명
                        </div>
                        <div
                          style={{ height: `${Math.random() * 100 + 20}px` }}
                          className="w-4/5 rounded-lg bg-gray-300"
                        />
                        <span className="text-xs text-gray-500 mt-2 font-medium">20**</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 잠금 오버레이 */}
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
              <div className="text-center p-6">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">파트너 전용 기능</h3>
                <p className="text-gray-600 mb-4">
                  연도별 상세 인원 증감 분석은 파트너 회원 전용 기능입니다.
                </p>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  파트너 회원 가입하기
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📈 인원 증감 현황</CardTitle>
        <p className="text-sm text-gray-600">연도별 상시근로자 수 변화와 증감량을 보여줍니다</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 인원 수 그래프 - 그라데이션 차트 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              연도별 상시근로자 수
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">그라데이션 차트</span>
            </h4>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6">
              <div className="bg-white p-6 rounded-lg">
                <div className="flex justify-between items-end h-40 px-4">
                  {chartData.map((item, index) => {
                    const values = chartData.map(d => d.employees);
                    const maxValue = Math.max(...values);
                    const minValue = Math.min(...values);
                    const value = item.employees;
                    const ratio = maxValue > minValue ? (value - minValue) / (maxValue - minValue) : 0.5;
                    const barHeight = Math.max(ratio * 120, 8);
                    
                    // 그라데이션 색상 계산
                    const range = maxValue - minValue;
                    const colorRatio = range > 0 ? (value - minValue) / range : 1;
                    const alpha = Math.min(Math.max(0.3 + (colorRatio * 0.7), 0.3), 1.0);
                    const red = Math.floor(59 + (11 * colorRatio));
                    const green = Math.floor(130 + (90 * colorRatio));
                    const blue = Math.floor(246 - (56 * colorRatio));
                    const backgroundColor = `rgba(${red}, ${green}, ${blue}, ${alpha})`;

                    return (
                      <div key={index} className="flex flex-col items-center w-full max-w-[120px] text-center">
                        <div className="text-sm font-bold text-gray-700 mb-2 h-6 flex items-center justify-center">
                          {value}명
                        </div>
                        <div
                          style={{ 
                            height: `${barHeight}px`,
                            backgroundColor: backgroundColor,
                          }} 
                          className="w-4/5 rounded-lg transition-all duration-500 ease-in-out hover:scale-105 border border-white/20"
                          title={`${item.year}년: ${value}명`}
                        />
                        <span className="text-xs text-gray-500 mt-2 font-medium">{item.year}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* 증감량 그래프 - 그라데이션 차트 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              연도별 증감량
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">보색 그라데이션</span>
            </h4>
            <div className="bg-gradient-to-br from-gray-50 to-green-50 rounded-lg p-6">
              <div className="bg-white p-6 rounded-lg">
                <div className="flex justify-between items-center h-32 px-4">
                  {chartData.slice(1).map((item, index) => {
                    const values = chartData.slice(1).map(d => Math.abs(d.change));
                    const maxValue = Math.max(...values);
                    const value = item.change;
                    const absValue = Math.abs(value);
                    const ratio = maxValue > 0 ? absValue / maxValue : 0;
                    const barHeight = Math.max(ratio * 100, 6);
                    const isIncrease = value > 0;
                    
                    // 보색 그라데이션 색상 계산
                    const colorRatio = maxValue > 0 ? Math.abs(value) / maxValue : 1;
                    const alpha = Math.min(Math.max(0.4 + (colorRatio * 0.6), 0.4), 1.0);
                    
                    let backgroundColor;
                    if (value === 0) {
                      backgroundColor = 'rgba(156, 163, 175, 0.2)';
                    } else if (isIncrease) {
                      backgroundColor = `rgba(16, ${Math.floor(185 + (35 * colorRatio))}, ${Math.floor(129 + (26 * colorRatio))}, ${alpha})`;
                    } else {
                      backgroundColor = `rgba(${Math.floor(239 + (16 * colorRatio))}, ${Math.floor(68 - (15 * colorRatio))}, ${Math.floor(68 - (15 * colorRatio))}, ${alpha})`;
                    }

                    return (
                      <div key={index} className="flex flex-col items-center w-full max-w-[120px] text-center">
                        <div className="text-sm font-bold mb-2 h-6 flex items-center justify-center">
                          <span className={`${isIncrease ? 'text-green-700' : value < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {value > 0 ? '+' : ''}{value}명
                          </span>
                        </div>
                        <div
                          style={{ 
                            height: `${barHeight}px`,
                            backgroundColor: backgroundColor,
                          }} 
                          className="w-3/4 rounded-lg transition-all duration-500 ease-in-out hover:scale-110 border border-white/30"
                          title={`${item.year}년: ${value > 0 ? '+' : ''}${value}명 변화`}
                        />
                        <span className="text-xs text-gray-500 mt-2 font-medium">{item.year}</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">
                          {isIncrease ? '↗️ 증가' : value < 0 ? '↘️ 감소' : '→ 동일'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* 차트 범례 */}
            <div className="mt-2 flex justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gradient-to-r from-teal-400 to-green-500 rounded"></div>
                <span>증가 (청록→초록)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded"></div>
                <span>감소 (주황→빨강)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-300 rounded"></div>
                <span>변화없음</span>
              </div>
            </div>
          </div>
          
          {/* 정확한 수치 테이블 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">📋 연도별 정확한 수치</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">연도</th>
                    <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">상시근로자 수</th>
                    <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">전년 대비 증감</th>
                    <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">증감 유형</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((data, index) => (
                    <tr key={data.year} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-3 py-2 text-center font-medium">
                        {data.year}년
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-center">
                        <span className="font-bold text-blue-600">{data.employees}명</span>
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-center">
                        {index === 0 ? (
                          <span className="text-gray-500">기준연도</span>
                        ) : (
                          <span className={`font-semibold ${
                            data.change > 0 ? 'text-green-600' : 
                            data.change < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {data.change > 0 ? '+' : ''}{data.change}명
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-center">
                        {index === 0 ? (
                          <span className="text-gray-500">-</span>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            {data.change > 0 ? (
                              <>
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-green-700 text-xs">증가</span>
                              </>
                            ) : data.change < 0 ? (
                              <>
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span className="text-red-700 text-xs">감소</span>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span className="text-gray-600 text-xs">변화없음</span>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GrowthChart; 