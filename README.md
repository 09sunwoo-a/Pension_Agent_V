# Pension_Agent_V

퇴직연금(IRP) AI 상담 에이전트 데모와 그 기반이 되는 지식·데이터 자료를 모아둔 저장소입니다.

## 디렉터리 구조

```
.
├── app/                      # 데모 웹 화면 (바닐라 JS, 빌드 도구 없음)
│   ├── local_preview.html    # 로컬에서 바로 열어보는 미리보기 (상대경로 사용)
│   ├── mnPensionAgentDemo.html  # 실제 배포용 마크업 (/mnbank/... 절대경로 사용)
│   ├── pensionAgentDemo.css
│   └── pensionAgentDemo.js
├── data/
│   ├── customer-display-data/   # 고객 30명 표시용 JSON + all-customers.json + validation-report.md
│   └── golden-cases/            # B01~B10 골든 케이스 더미데이터 (생성 원천자료)
├── docs/
│   ├── briefings/            # 고객 브리핑 MD (B01~B10) 및 제작대상 정리
│   ├── kb/                   # 상품 마스터 / 매칭 KB / 일반운용전략 마스터 KB
│   └── specs/                # 데이터 스키마, 골든 케이스 후보 통합본, 필요지식 출처맵, DEMO-01 참고본
└── scripts/
    └── generate_customer_display_data.js   # 골든 케이스 → 표시용 JSON 생성기
```

## 데모 실행

빌드 과정이 없습니다. `app/local_preview.html` 을 브라우저로 열면 바로 동작합니다.

```bash
open app/local_preview.html          # macOS
# 또는 간단한 정적 서버로
npx serve app
```

`app/mnPensionAgentDemo.html` 은 배포 환경 기준으로 CSS/JS 를 `/mnbank/app/...` 절대경로로 참조하므로
로컬에서 그대로 열면 스타일과 스크립트가 로드되지 않습니다. 로컬 확인은 `local_preview.html` 을 사용하세요.

## 고객 표시용 데이터 재생성

`data/golden-cases/` 의 마크다운에 들어 있는 JSON 블록을 읽어 `data/customer-display-data/` 를 다시 만듭니다.

```bash
node scripts/generate_customer_display_data.js
```

결과물: 고객별 JSON 30개, `all-customers.json`, 생성 검증 결과인 `validation-report.md`.

## 참고

- 저장소에 포함된 고객 데이터는 전부 **더미 데이터**이며 실제 고객 정보가 아닙니다.
- 분석 기준일(`AS_OF_DATE`)은 생성 스크립트 상단에 상수로 정의되어 있습니다.
