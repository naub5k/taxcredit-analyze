# 작업요청서_20250604_011_CompanyDetail_TS_null체크추가수정.md

## 📌 요청 목적
TypeScript 컴파일 오류 `TS18047: actualData is possibly 'null'` 해결을 위한 `null` 체크 로직 추가 요청

---

## 🧾 오류 배경

- `actualData`의 타입이 `Record<string, any> | null`로 명시되어 있음
- TypeScript의 `strictNullChecks` 옵션에 따라 `null` 가능성을 미리 확인해야 함
- `in` 연산자를 사용할 때 `actualData`가 null일 경우 컴파일 에러 발생

---

## ❌ 오류 발생 코드

```tsx
const missingColumns = expectedColumns.filter(col => !(col in actualData));
const existingColumns = expectedColumns.filter(col => col in actualData);
```

---

## ✅ 수정 지시

### 🔧 수정 대상 파일

```
src/pages/CompanyDetail.tsx
```

### ✅ 수정 후 코드 예시

```tsx
if (actualData) {
  const missingColumns = expectedColumns.filter(col => !(col in actualData));
  const existingColumns = expectedColumns.filter(col => col in actualData);

  console.log('✅ 존재하는 컬럼들:', existingColumns);
  console.log('❌ 누락된 컬럼들:', missingColumns);
}
```

또는 삼항 연산자를 사용한 축약 버전:

```tsx
const missingColumns = actualData ? expectedColumns.filter(col => !(col in actualData)) : [];
const existingColumns = actualData ? expectedColumns.filter(col => col in actualData) : [];
```

---

## ✅ 완료 기준

- TypeScript 오류(TS18047) 완전 제거
- `npm run build` 또는 `npm start` 시 컴파일 성공
- 컬럼 누락 검증 기능 정상 작동 (`console.log` 확인)

---

## 📎 관련 요청서

- `작업요청서_20250604_010_CompanyDetail_TS타입오류수정.md`
- `작업요청서_20250604_008_API_컬럼전체_정합성검증요청.md`

---
