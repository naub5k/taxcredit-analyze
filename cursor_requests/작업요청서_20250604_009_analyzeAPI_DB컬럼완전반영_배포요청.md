# 작업요청서_20250604_009_analyzeAPI_DB컬럼완전반영_배포요청.md

## 📌 요청 목적
`analyze` 함수의 응답 결과에 `insu_clean` 테이블의 **전체 22개 컬럼**이 누락 없이 포함되도록 수정 및 배포 요청

---

## 🧾 배경

- 현재 `taxcredit-api-func`에 배포된 `analyze` 함수는 `analysisData` 또는 추상화된 구조만 반환
- 유비님은 **실제 DB 컬럼이 그대로 JSON에 포함된 원형 응답 구조**를 요구
- `CompanyDetailPage`에서 모든 컬럼을 렌더링하고 UI 검증 테스트에 활용되기 위해선,  
  응답에 다음 컬럼이 포함되어야 함:

```
사업장명, 사업자등록번호, 시도, 구군, 업종코드, 업종명, 성립일자,
[2016]~[2025], 제외여부 등 총 22개 컬럼
```

---

## ✅ 작업 지시

### 1. API 함수 로직 수정

- 기존 분석 로직 유지 여부와 무관하게 `SELECT * FROM insu_clean WHERE 사업자등록번호 = @bizno`로 조회
- 결과를 다음과 같이 반환:

```json
{
  "success": true,
  "data": {
    "사업자등록번호": "...",
    "사업장명": "...",
    "시도": "...",
    ...
  }
}
```

- `data` 키에 실제 컬럼 전체 포함 (추상화 구조 사용 금지)

### 2. 배포 명령어 (CLI 기준)

```bash
npx func azure functionapp publish taxcredit-api-func
```

- 대상 함수앱: **taxcredit-api-func**
- 함수 디렉토리 기준: `analyze`가 포함된 프로젝트 루트

---

## 🎯 완료 기준

- `curl` 또는 `브라우저 console`에서 호출 시 `insu_clean` 22개 컬럼이 전부 포함되어 반환
- `result.data.사업장명`, `result.data.[2024]`, `result.data.제외여부` 등 직접 접근 가능해야 함
- 컬럼 충족률 100%일 때만 UI 확장 구조 적용 허용

---

## 📎 참고

- 기준문서: `GPT_작업기준_마스터_통합본.md`, `IDE작업기준서_20250602.md`
- 확인 대상 API:  
  https://taxcredit-api-func.azurewebsites.net/api/analyze?bizno=1010120403

---
