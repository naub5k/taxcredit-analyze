# taxcredit-analyze
<<<<<<< HEAD

고용증대세액공제 경정청구 대상 기업 분석을 위한 전용 웹앱입니다.  
사업자등록번호를 기준으로 DB에서 실시간 데이터를 조회하고,  
세액공제 가능성을 시각적으로 분석하는 프론트엔드 UI를 제공합니다.

---

## 📦 기술 스택

- **React** 19.1.0 + **TypeScript** 4.9.5
- **Create React App** (CRA) 기반
- **React Router** 6.30.1 (SPA 라우팅)
- **Tailwind CSS** 3.3.5 (스타일링)
- **Azure Static Web App** 배포 준비

---

## 🚀 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm start
```

개발 서버 실행 후 [http://localhost:3000](http://localhost:3000)에서 확인하세요.

---

## 🧩 주요 기능

- 사업자등록번호 기반 `analyze` API 호출
- `insu_clean` 테이블 전체 컬럼 (22개) 실시간 조회
- 컬럼 충족률 시각화 및 분석 결과 렌더링
- 3단계 분류 시스템: 💚즉시신청 / ⚠️신중검토 / ❌신청불가
- 실시간 조정 패널 (청년 비율, 사회보험료 배수)

---

## 🔗 API 연결 정보

- **함수 URL**: `https://taxcredit-api-func.azurewebsites.net/api/analyze`
- **파라미터**: `?bizno={사업자등록번호}`
- **응답 구조**: 
  ```json
  {
    "success": true,
    "data": {
      "사업자등록번호": "1234567890",
      "사업장명": "회사명",
      "시도": "지역",
      "2016": 0, "2017": 0, "2018": 0, "2019": 0, "2020": 0,
      "2021": 0, "2022": 0, "2023": 0, "2024": 0, "2025": 0,
      ...
    }
  }
  ```

---

## 📁 디렉토리 구조

```
taxcredit-analyze/
├── src/
│   ├── pages/          # 라우팅 페이지
│   ├── components/     # 재사용 컴포넌트
│   ├── services/       # API 호출 로직
│   ├── types/          # TypeScript 타입 정의
│   ├── config/         # 설정 파일
│   └── App.tsx         # 메인 앱
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── README.md
└── .gitignore
```

---

## 🧪 테스트

```bash
# 테스트 실행
npm test

# 빌드 테스트
npm run build
```

---

## ⚙️ 배포

- **GitHub**: [https://github.com/naub5k/taxcredit-analyze](https://github.com/naub5k/taxcredit-analyze)
- **Azure Static Web App** 연동 예정
- **자동 배포**: GitHub Actions 기반

---

## 📚 참고

- [Create React App 문서](https://create-react-app.dev/)
- [React 문서](https://react.dev/)
- [TypeScript 문서](https://www.typescriptlang.org/)
- [Tailwind CSS 문서](https://tailwindcss.com/)
=======
세액공제 분석용 웹앱 (고용증대세액공제 대상 여부 분석 기능 포함)
>>>>>>> 83b8dff7eca022c145ba4b855b91e16a6d1d9ead
