# 작업요청서_20250604_010_CompanyDetail_TS타입오류수정.md

## 🧾 요청 개요

`CompanyDetail.tsx` 내 TypeScript 타입 오류(TS7034, TS7005) 발생에 따른 UI 코드 수정 요청

---

## 🧩 오류 배경

- API는 성공적으로 배포되어 JSON 응답을 정확히 반환함
- 그러나 UI 컴포넌트(`CompanyDetail.tsx`)에서 `actualData` 변수에 타입이 지정되지 않아 TypeScript가 오류 발생시킴

---

## ❌ 발생 오류 상세

| 라인 | 오류 코드 | 메시지 |
|------|-----------|--------|
| 191  | TS7034    | 'actualData' 암시적 any 타입 |
| 253  | TS7005    | 'actualData'에 암시적 any 타입 |
| 254  | TS7005    | 'actualData'에 암시적 any 타입 |

---

## ✅ 수정 지시

### 🔧 수정 대상 파일

```
src/pages/CompanyDetail.tsx
```

### 🔧 수정 전 코드

```ts
let actualData = null;
```

### ✅ 수정 후 코드

```ts
let actualData: Record<string, any> | null = null;
```

또는

```ts
let actualData: { [key: string]: any } | null = null;
```

---

## 🧪 완료 기준

- `npm start` 또는 `npm run build` 시 TypeScript 오류 없이 컴파일 완료
- 브라우저 실행 시 컬럼 검증 기능 정상 동작 (`컬럼 충족률`, `누락 컬럼` 출력 확인 가능)

---

## 📎 관련 요청서

- `작업요청서_20250604_009_analyzeAPI_DB컬럼완전반영_배포요청.md`
- `작업요청서_20250604_008_API_컬럼전체_정합성검증요청.md`

---
