# 🎯 요청서: 국민연금 API UNKNOWN\_ERROR 대응 수정 요청서

## 📌 요청 배경

현재 `taxcredit-api-func`에서 국민연금 API(`getBassInfoSearchV2`) 호출 시, 일부 사업자번호에 대해 아래와 같은 오류가 발생함:

* ❌ 오류 메시지: `UNKNOWN_ERROR (resultCode: 99)`
* ✅ 단, **공공데이터포털 미리보기 UI에서는 동일 파라미터로 정상 응답(resultCode: 00)**

> 확인 URL 예시: [https://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getBassInfoSearchV2?serviceKey=...\&wkplNm=삼성전자로지텍주식회사\&bzowrRgstNo=124815](https://apis.data.go.kr/B552015/NpsBplcInfoInqireServiceV2/getBassInfoSearchV2?serviceKey=...&wkplNm=삼성전자로지텍주식회사&bzowrRgstNo=124815)...

이는 \*\*API 호출 환경 차이(User-Agent 또는 헤더 누락)\*\*로 인한 가능성이 높음.

---

## 🛠️ 요청 내용

### ✅ 1. API 요청 헤더 강제 설정

`axios` 또는 `fetch` 호출 시 다음 헤더를 포함하여 호출하도록 수정:

```http
User-Agent: Mozilla/5.0
Accept: application/json
```

→ 실제 브라우저와 동일한 요청 환경을 구성하여 공공데이터포털 미리보기와 동일한 결과 확보

---

### ✅ 2. 수정 대상 함수

* 경로: `taxcredit-api-func/utils/fetchPensionData.js` (또는 해당 호출 파일)
* 대상: 국민연금 사업장 기본정보 호출 함수
* 내용: 위 헤더를 명시적으로 포함하여 요청

---

## 🧪 테스트 방법

* 사업자번호 `124815` 또는 `1010778120` 등으로 테스트
* 기존에는 `UNKNOWN_ERROR`, 수정 후에는 `NORMAL_CODE` 수신되는지 확인

---

## ✅ 완료 기준

* resultCode가 99 → 00 정상 반환되도록 API 수정 완료
* 프론트엔드(`PensionInfoBlock.tsx`)에서 오류 메시지 없이 정보 정상 표시

이상입니다. 반영 후 재배포 바랍니다.
