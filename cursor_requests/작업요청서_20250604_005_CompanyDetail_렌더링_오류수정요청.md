# 📄 작업요청서_20250604_005_CompanyDetail_렌더링_오류수정요청

## ✅ 요청 목적
`CompanyDetail.tsx`에서 API 호출 결과로 `result.success === true`가 확인되었음에도  
렌더링 시점에서 `companyData.사업장명`, `companyData.업종명` 등 주요 필드들이 `undefined`로 처리되어  
브라우저에 데이터가 표시되지 않고 있음.

---

## 📌 문제 상세

### 🔍 현재 확인된 로그

```txt
✅ JSON 파싱 완료, result.success: true
❌ API 응답 실패: undefined
```

- `result.success`는 `true`로 확인됨
- 그러나 렌더링에서는 `companyData?.사업장명` 등에서 TS2339 오류 및 undefined 표시 발생

---

## 🧪 원인 분석

- `result.data`가 `InsuCleanRecord` 타입과 **정확히 일치하지 않음**
  - → `setCompanyData(result.data)` 이후에도 타입 불일치로 `companyData`가 `undefined`로 간주
- 또는 `data` 키 자체가 누락되었거나 API 응답 구조에서 잘못 설정됨
- 타입스크립트 상 `companyData`를 렌더링 시점에서 완전히 확정짓지 못함

---

## 🛠 수정 제안

### 1. 타입 보완

```ts
type InsuCleanRecord = Record<string, any>;  // 또는 필요한 필드만 명시하되 확장 허용
```

또는

```ts
const [companyData, setCompanyData] = useState<any>(null);
```

→ 일단 렌더링 시점에서 `?.사업장명` 등의 오류를 제거하고 **실제 응답 구조를 기반으로 후속 정제**

---

### 2. 디버깅 로그 추가

```ts
console.log("✅ API 응답 구조 확인", result);
console.log("✅ companyData 설정 전", result.data);
```

---

## 🎯 완료 판단 기준

- 브라우저에서 회사 상세 페이지(`CompanyDetail`)에 접속 시
- `사업장명`, `업종명`, `시도`, `구군`, `제외여부` 등의 값이 정상 렌더링됨
- 더 이상 `TS2339` 타입 오류 발생하지 않음
- `companyData?.사업장명` 등 표현에서 `"undefined"` 대신 실제 값이 출력됨

---

## 🧱 요청 위치
- 파일: `src/pages/CompanyDetail.tsx`
- 저장 경로: `cursor_requests/작업요청서_20250604_005_CompanyDetail_렌더링_오류수정요청.md`
