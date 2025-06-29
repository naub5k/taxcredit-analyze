# 📄 작업요청서_20250604_006_CompanyDetail_타입단언_오류해결요청

## ✅ 요청 목적
현재 `CompanyDetail.tsx`에서 API 응답 로그 확인을 위해 `result.data`에 접근하고 있으나,  
타입스크립트 오류 `TS2339: Property 'data' does not exist on type 'InsuCleanApiError'`가 발생하고 있음.

이는 `result`가 `InsuCleanApiResponse | InsuCleanApiError` 유니언 타입으로 선언되어 있고,  
`InsuCleanApiError`에는 `data` 필드가 없기 때문에 발생하는 문제임.

---

## 📌 문제 상세

### 🔍 오류 메시지

```ts
TS2339: Property 'data' does not exist on type 'InsuCleanApiError'.
```

---

## 🛠 수정 제안

### ✅ 명시적 타입 단언 방식 사용

```ts
if (result.success) {
  const data = (result as InsuCleanApiResponse).data;
  console.log("✅ 사업장명:", data.사업장명);
  console.log("✅ 시도:", data.시도);
}
```

또는 필요시 `result.data`가 필요한 모든 부분에서 `as InsuCleanApiResponse`를 단언하여 처리

---

## 🎯 완료 판단 기준

- `result.success === true` 조건일 때 `result.data` 접근 오류가 발생하지 않음
- `Object.keys(result.data)`, `data.사업장명`, `data.시도` 등 정상 출력
- 브라우저 콘솔에서 타입스크립트 에러 없이 전체 응답 구조 디버깅 가능

---

## 🧱 요청 위치
- 파일: `src/pages/CompanyDetail.tsx`
- 저장 경로: `cursor_requests/작업요청서_20250604_006_CompanyDetail_타입단언_오류해결요청.md`
