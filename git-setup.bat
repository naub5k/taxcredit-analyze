@echo off
echo 🚀 taxcredit-analyze Git 초기화 시작...
echo.

echo 📁 현재 디렉토리 확인...
cd /d "D:\Projects\taxcredit_mobileapp\taxcredit-analyze"
echo 현재 위치: %CD%
echo.

echo 🔧 Git 초기화...
git init
echo.

echo 📡 원격 리포지토리 연결...
git remote add origin https://github.com/naub5k/taxcredit-analyze
echo.

echo 📋 파일 추가 (build, node_modules 제외)...
git add .
echo.

echo 📝 첫 번째 커밋...
git commit -m "init: 프로젝트 초기 정리 및 git 구성

- React 19.1.0 + TypeScript 4.9.5 기반
- Tailwind CSS 3.3.5 스타일링
- taxcredit-analyze 전용 README.md 작성
- Azure Static Web App 배포 준비 완료
- 22개 컬럼 DB 연동 API 준비 완료"
echo.

echo 🌿 main 브랜치로 설정...
git branch -M main
echo.

echo 🚀 GitHub에 푸시...
git push -u origin main
echo.

echo ✅ Git 설정 완료!
echo 📍 GitHub: https://github.com/naub5k/taxcredit-analyze
echo.
pause 