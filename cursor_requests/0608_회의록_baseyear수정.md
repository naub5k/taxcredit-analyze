특정 객체가 null인데도 baseYear 속성을 접근하려다 발생한 런타임 오류입니다.

🔍 핵심 원인
ts
복사
편집
something.baseYear
→ something이 null인 상태에서 .baseYear에 접근

✅ 조치 방법
해당 라인에서 조건부 접근 연산자(?.) 또는 null 체크를 추가해야 합니다.

예:

tsx
복사
편집
something?.baseYear ?? '기본값'
또는

tsx
복사
편집
if (something) {
  use(something.baseYear)
}
🎯 테스트 전략
의도치 않은 빈 데이터 또는 잘못된 API 응답을 방지

컴포넌트 내부의 null 값 진입 조건 파악 필요

오류 원인은 다음 라인입니다:

ts
복사
편집
const baseYear = employmentData.find((d) => d.year === selectedBaseYear)?.baseYear;
여기서 .find(...) 결과가 null인데, 그 뒤에 .baseYear를 접근해서 에러가 발생한 것입니다.

✅ 해결 방법 (예외 방지):

ts
복사
편집
const baseYear = employmentData.find((d) => d.year === selectedBaseYear)?.baseYear || 0;
혹은 조건문으로 감싸 처리해야 합니다:

ts
복사
편집
const found = employmentData.find((d) => d.year === selectedBaseYear);
const baseYear = found ? found.baseYear : 0;