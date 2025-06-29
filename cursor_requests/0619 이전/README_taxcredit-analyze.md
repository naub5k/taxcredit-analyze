# taxcredit-analyze

고용증대세액공제 대상 기업을 위한 분석 전용 웹앱입니다.  
사업자등록번호 기준으로 DB에서 실시간 데이터를 조회하고,  
세액공제 가능성을 시각적으로 안내하는 분석용 UI를 제공합니다.

---

## 📦 기술 스택

- React + TypeScript
- Vite 또는 CRA (기존 코드 기준)
- Azure Static Web App 기반 배포
- REST API (analyze 함수 연동)

---

## 🚀 실행 방법

```bash
npm install
npm start
```

---

## 🧩 주요 기능

- 사업자번호 기반 `analyze` 함수 호출
- `insu_clean` 전체 컬럼 반환 → 컬럼별 분석
- 컬럼 충족률 시각화 (100% 기반 UI 분기)
- AI 분석 결과 렌더링 (예정)

---

## 🔗 API 연결 정보

- 함수: `https://taxcredit-api-func.azurewebsites.net/api/analyze?bizno=...`
- 응답 구조: `success`, `data: { ...22개 컬럼... }`

---

## 📁 디렉토리 구조 (예시)

```
taxcredit-analyze/
├── src/
│   ├── pages/
│   ├── components/
│   ├── services/
│   └── App.tsx
├── public/
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

---

## ⚙️ 배포

- GitHub Actions 기반 자동 배포
- Azure Static Web App 연동 예정

---
