# 📄 작업요청서_20250604_002_tsx_InsuCleanRecord_타입정의및적용

## ✅ 요청 목적
- 프론트엔드 React 컴포넌트(`CompanyDetail.tsx`)에서 사용 중인 `companyData`에 대해,
- 실제 Azure SQL 테이블인 `insu_clean`의 **실제 컬럼 스키마와 일치하는 타입 정의**를 적용하기 위함.

---

## 📌 작업 내역

### 1️⃣ 타입 정의

`src/types/InsuCleanRecord.ts` 또는 유사 위치에 다음과 같이 타입 정의 추가:

```ts
export interface InsuCleanRecord {
  사업자등록번호: string;
  사업장명: string;
  우편번호: string;
  사업장주소: string;
  업종코드: string;
  업종명: string;
  성립일자: string;
  "2016": number;
  "2017": number;
  "2018": number;
  "2019": number;
  "2020": number;
  "2021": number;
  "2022": number;
  "2023": number;
  "2024": number;
  "2025": number;
  중복횟수: number;
  분류: string;
  시도: string;
  구군: string;
  제외여부: string;
}
```

---

### 2️⃣ `companyData` 타입 적용

`src/pages/CompanyDetail.tsx` 내 useState 선언 수정:

```ts
import { InsuCleanRecord } from '../types/InsuCleanRecord';

const [companyData, setCompanyData] = useState<InsuCleanRecord | null>(null);
```

---

## 🎯 기대 효과

- `companyData?.사업장명`, `companyData?.시도` 등 실제 컬럼 접근 시 타입스크립트 오류 제거
- 추론 기반이 아닌 명시적 타입으로 GPT 및 Cursor 대응력 향상
- 유비님 기준에 따라 축약/추론 없이 **실제 DB 컬럼을 그대로 매칭**

---

## 🧱 요청 위치
- 파일: `src/pages/CompanyDetail.tsx`
- 타입 정의 위치: `src/types/InsuCleanRecord.ts` 또는 최적 경로
- 저장 위치: `cursor_requests/작업요청서_20250604_002_tsx_InsuCleanRecord_타입정의및적용.md`
