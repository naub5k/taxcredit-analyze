# 작업요청서_20250604_012_CompanyDetail_TS_null단언_최종수정.md

## 📌 요청 목적
TypeScript `strictNullChecks` 활성화 상태에서 `actualData` 변수의 `null` 가능성으로 발생하는 오류(TS18047)를 **단언 연산자(`!`)로 최종 해결** 요청

---

## 🧾 오류 배경 요약

- `actualData`의 타입은 `Record<string, any> | null`
- `if (actualData)` 조건문이 있음에도, `filter` 내부 `col in actualData` 구문에서 TypeScript가 `null` 가능성 제거 실패
- 결과적으로 **모든 해당 구문에 대해 단언(`!`) 필요**

---

## ✅ 수정 지시

### 🔧 대상 파일

```
src/pages/CompanyDetail.tsx
```

### 🔧 기존 코드

```ts
if (actualData) {
  const missingColumns = expectedColumns.filter(col => !(col in actualData));
  const existingColumns = expectedColumns.filter(col => col in actualData);
}
```

### ✅ 수정 후 코드 (권장안)

```ts
if (actualData) {
  const data = actualData!;  // TypeScript 단언 처리
  const missingColumns = expectedColumns.filter(col => !(col in data));
  const existingColumns = expectedColumns.filter(col => col in data);
}
```

또는 단순하게:

```ts
if (actualData) {
  const missingColumns = expectedColumns.filter(col => !(col in actualData!));
  const existingColumns = expectedColumns.filter(col => col in actualData!);
}
```

---

## ✅ 완료 기준

- TypeScript 오류(TS18047) 완전히 제거
- `npm run build` 또는 `npm start` 시 정상 컴파일
- 컬럼 누락 검증 및 콘솔 출력 로직 정상 작동

---

## 📎 관련 요청서

- `작업요청서_20250604_010_CompanyDetail_TS타입오류수정.md`
- `작업요청서_20250604_011_CompanyDetail_TS_null체크추가수정.md` (본 요청서로 대체)

---
