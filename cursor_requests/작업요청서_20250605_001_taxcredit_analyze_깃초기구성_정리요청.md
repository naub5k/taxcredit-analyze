# 작업요청서_20250605_001_taxcredit_analyze_깃초기구성_정리요청.md

## 📌 요청 목적

`taxcredit-analyze` 프로젝트 폴더를 GitHub 리포지토리 배포 기준에 맞게 정리하고,  
초기 `.git` 설정, `.gitignore`, 기본 README 구성까지 포함한 깃 준비 상태로 만들어주세요.

---

## 🧾 작업 배경

- 기존 `taxcredit-webapp`에서 작업된 코드 기반
- 유비님이 GitHub에 새 리포지토리 `https://github.com/naub5k/taxcredit-analyze` 생성 완료
- 로컬 폴더 이름도 `taxcredit-analyze`로 변경됨

---

## ✅ 작업 지시

### 1. 폴더 구조 정리

- `src/`, `public/`, `package.json`, `tsconfig.json` 등 **React 프로젝트 기준 핵심 파일만 유지**
- 필요 없는 파일/디렉토리는 제거
- `/build`, `/dist`, `/node_modules`, `.next`, `.DS_Store` 등 제외 처리

### 2. `.gitignore` 작성

```gitignore
node_modules/
dist/
build/
.env
.DS_Store
.vscode/
coverage/
```

### 3. README.md 파일 작성

- 프로젝트명: **taxcredit-analyze**
- 설명: 세액공제 경정청구 대상 여부 분석을 위한 프론트엔드 UI
- 주요 기술스택: React, TypeScript, Vite (또는 CRA 기반 여부 확인 필요)
- 실행 방법: `npm install && npm start`

### 4. Git 초기화

```bash
git init
git remote add origin https://github.com/naub5k/taxcredit-analyze
git add .
git commit -m "init: 프로젝트 초기 정리 및 git 구성"
git branch -M main
git push -u origin main
```

> ※ 커서가 직접 실행할 수 있도록 `git remote`까지 포함해 주세요

---

## 🎯 완료 기준

- GitHub에서 `taxcredit-analyze` 리포에 전체 정리된 코드 push 완료
- README와 `.gitignore` 정상 포함
- 로컬 폴더와 GitHub 리포의 코드 구조 일치
- 이후 Azure Static Web App 배포 가능 상태로 전환 준비 완료

---
