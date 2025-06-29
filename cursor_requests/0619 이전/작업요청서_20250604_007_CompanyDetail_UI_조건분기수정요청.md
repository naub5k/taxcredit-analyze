# 📄 작업요청서_20250604_007_CompanyDetail_UI_조건분기수정요청

## ✅ 요청 목적
현재 `CompanyDetail.tsx`에서 API 응답은 정상적으로 JSON 전체 데이터를 반환하고 있음에도,  
UI 상단에 `"알 수 없는 응답 구조입니다."`라는 메시지가 출력되고 있음.

이는 조건 분기 로직이 `companyData`의 존재 여부만을 기준으로 판단하거나,  
`Object.keys(companyData).length === 0` 등의 불안정한 조건으로 작성되어 있기 때문으로 판단됨.

---

## 📌 수정 요청 상세

### 🔍 기존 추정 코드 예시

```tsx
if (!companyData || Object.keys(companyData).length === 0) {
  return <div>알 수 없는 응답 구조입니다.</div>;
}
```

이 방식은 `companyData`가 truthy하더라도 내부 키 중 일부가 없거나 예상과 다를 경우 fallback 메시지를 유발할 수 있음.

---

## 🛠 수정 제안

### ✅ 핵심 필드를 기준으로 조건 분기

```tsx
if (!companyData || !companyData.사업장명) {
  return <div>알 수 없는 응답 구조입니다.</div>;
}
```

또는

### ✅ 필드 단위 안전 접근으로 fallback 제거

```tsx
<h1>{companyData?.사업장명 ?? '회사명 없음'}</h1>
```

---

## 🎯 완료 판단 기준

- API 응답이 성공(`result.success === true`)일 경우 `"알 수 없는 응답 구조입니다"` 메시지가 더 이상 출력되지 않음
- `companyData`가 실제 값을 갖고 있을 때 UI에 데이터가 정상적으로 렌더링됨
- 콘솔 오류 및 fallback 경고 제거

---

## 🧱 요청 위치
- 파일: `src/pages/CompanyDetail.tsx`
- 저장 경로: `cursor_requests/작업요청서_20250604_007_CompanyDetail_UI_조건분기수정요청.md`
