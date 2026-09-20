# 06 — 사내 환경·팀원 소스 참고·시연 검증

상태: 설계, 미구현. 선행:01~05. 읽기: `agent/README.md`, 기존 agent의 Dockerfile/requirements/llm_client, 플랫폼02·03·04·06 해당 절, `COMPANY_DEPLOY_CHECKLIST.md`. 이 문서는 최신 부점 Agent의 사내 실행 증거가 아니다.

## 유지할 사내 실행 조건

- Python3.10, 현재 사내 ACR 이미지, Nexus, WORKDIR `/custom`, 평면 import, `uvicorn main:app --host 0.0.0.0 --port 8000`.
- 기존 `llm_client.call` 시그니처와 TRNN/SERV 분기, Gemma deployment·`kb-key`/`x-client-user` 규격 유지. 과거 문서의 SDK 버전은 당시 설치 이력이며 현재 보장값으로 취급하지 않는다.
- 이번 시연은 현재 requirements 범위에서 구현. LangGraph/MCP/Redis를 기능 없이 도입하지 않는다. 추가 패키지가 꼭 필요하면 해당 사내 Nexus·현재 세트 호환성을 확인한다.
- `branch-agent/deploy/` 내용만 새 사내 배포 repository root에 반입한다. 신규 Dockerfile에 Python 파일·branch_data를 개별 COPY. validation과 기존 agent는 COPY하지 않는다. 기존 S1~S5 Agent 배포는 유지한다.
- Secret은 런타임 주입, 소스/정적 JS/문서/로그/커밋 저장 금지. 프론트 branch 설정은 기존 설정 주입 통로 사용. 실제 직원별 인증/부점 조회 권한은 시연 dataset 식별값과 별개다.
- 프론트는1HTML+1JS+1CSS, 기존 WAS 경로·PG_1288272 lifecycle. CDN/React/DOMContentLoaded 의존 금지, body 위젯·CSS namespace·unload 정리 유지.

## 모델·검증 환경

- 사용자 지정 모델은 `gemma-4-31b-it`. `.env.example`에는 키 값 없이 변수 이름과 이 비밀이 아닌 모델명만 둔다. 실제 `.env`, 호출 원문, 응답 원문은 커밋하지 않는다.
- `LLM_MODEL=gemma-4-31b-it`는 모델 식별값. Azure 호환 서비스의 실제 deployment 별칭은 `LLM_DEPLOYMENT_NAME`으로 별도 지정한다. 둘이 같다고 추측하거나 과거 `gemma-4-31b-nvidia-fp4-h100`으로 자동 대체하지 않는다.
- 사내는 기존 검증된 AzureChatOpenAI+kb-key+x-client-user 통로를 유지한다. 로컬 제공처는 사용자 확인으로 **Google AI Studio**다. [Google 공식 Gemma API 문서](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api)는 `gemma-4-31b-it` 지원을 명시한다(2026-09-21 확인). REST 경로는 `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent`, 인증은 서버 환경변수의 키를 `x-goog-api-key` 헤더로 전달한다([인증 문서](https://ai.google.dev/gemini-api/docs/api-key)). Google 모델 ID를 사내 deployment 별칭으로 추정하지 않는다.
- 로컬 실제 호출·프론트 연결은04 구현 후05에서 수행한다. 공통 Agent에 validation의 Google 호출기를 주입하고 localhost 브리지로02의 remote 경로를 검증한다. 개인 키의 실제 모델 접근·quota는 아직 미검증이며 키를 다시 채팅에 요청하지 않는다. Google 전용 파일·의존성은 사내 이미지에 포함하지 않는다.
- validation stub은 키 없이 실행. live 검증은 명시적 실행 옵션으로만 켜며 설정 누락/접근 불가면 LIVE SKIP(사유)을 기록한다. 키 값을 출력하는 연결 진단은 금지한다.

## 참고 소스에서 취할 것

사용자가 사내 반입·실행된 소스라고 제공한 [Pension_agent/src](https://github.com/09sunwoo-a/Pension_agent/tree/main/src)를2026-09-20에 읽었다. **현재 GitHub main이 사내 실행된 정확한 tag와 같다는 것은 확인하지 못했다.** 부분 참고이며 전체 이식하지 않는다.

| 확인한 파일·위치 | 관찰 | 우리 적용 |
|---|---|---|
| [Dockerfile](https://github.com/09sunwoo-a/Pension_agent/blob/main/src/Dockerfile) | 같은 사내 이미지·Nexus·/custom·main:app. 패키지/캐시 디렉터리도 COPY | 실행 조건 참고. 우리 평면 모듈/개별 COPY 유지. `.env` COPY를 따라 추가하지 않음 |
| [main.py](https://github.com/09sunwoo-a/Pension_agent/blob/main/src/main.py) ChatRequest/_chunk | input_value는 문자열, logical JSON을 CHUNK.content에 직렬화, SSE 빈 줄 | 같은 플랫폼 포장을 사용. 새 부점 계약은01로 별도 고정 |
| main.py chat/generate | 동기 Agent를 to_thread로 실행, 큐로 진행 표시 전달 | LLM 동기호출을 이벤트 루프 밖으로 보내는 방법 참고 |
| main.py context_store/_remember | 직원+session_id 메모리 맥락, worker에서 결과 저장; 연결 종료 뒤도 저장 가능 | 우리 읽기전용 부점 AI는 프론트 확정 State 재전달. 취소된 턴이 다음 검색에 섞이지 않게 함 |
| main.py 로그·응답 포장 | 질문 일부/사용자 식별 로그, text 중심 answer·여러 type | 로그 내용과 응답 계약은 복사하지 않음. ID/숫자/UI 효과를 구조화하고 안전한 코드만 기록 |
| [requirements.txt](https://github.com/09sunwoo-a/Pension_agent/blob/main/src/requirements.txt) | 현재 우리 프로젝트와 다른 패키지 세트·LangGraph/MCP | 그대로 혼합하지 않음 |

읽은 파일 blob SHA: main.py `8784be8b4a97f380bbfc7d702712fdce739dd903`, Dockerfile `a179035f62b1b229b2eb78ba42da057fedc10b06`, requirements `45e1878492cc930790e2f4e7aca94b202f2d0fda`. 위 URL은 변경 가능한 main이므로 나중에 차이가 나면 SHA로 구분한다. 팀원 소스의 지식검색/업무 연계·쪽지·세션 저장 구현은 이번 범위에서 이식하지 않는다.

## 배포 전과 사내 검증 순서

1. 같은 빌드의 프론트 manifest·Agent branch_data·규칙버전 일치 확인. build/check/계약/계산/UI 검사 통과. 실제 Gemma36개 결과는05에 기록.
2. FastAPI/Pydantic 환경에서 `/health`·`/chat` 실제 HTTP 검사. 로컬 패키지가 없어 SKIP이면 사내 환경에서 반드시 보충하며 “기동 검증 완료”로 표시하지 않는다.
3. 사용자 배포 지시가 있는 세션에서만 사내 flat repository 반입·tag push·Portal tag 선택. 파일별 COPY/패키지 설치·container import/health 확인. GitHub push만으로 사내 반입 완료라고 하지 않는다.
4. branch용 Connector/agentId·런타임 인증 설정 주입. 실제 WAS Origin의 CORS·POST·ReadableStream·timeout을 확인. 테스트 토큰을 문서/스크린샷/로그에 남기지 않는다.
5. 수신한 논리 응답을 Secret/실제 식별값 없이 계약 검사기에 넣는다. progress→answer→EOF의 실제 포장·취소·오류 경로를 확인한다. 상담 Agent의 과거3턴 성공을 새 부점 Agent 성공으로 대신하지 않는다.
6. Starroot 실제 화면에서 아래 시연 후 onBeforeUnload/재진입, 스크롤·CSS 캐시·WebView 레이아웃을 확인한다. 프론트 메인 상단/고객 카드가 바뀌지 않았는지 비교한다.

시연 순서: 추천3명 → 신경호만 → 브리핑 → 처음 추천 복원 → 부점 통계(목록 유지) → ISA 등록3명 통계 → 대상 보기 → 장기대기4→50대1→DO1→나이 제거2 → IRP≥7천만원35 → 모호한 운용금액 확인 →0명/복구 → 취소 → 새대화/기존목록.

측정: 각 턴의 총 지연·해석/문장 대체 여부·UI 결과·버전. 첫 목표는 올바른 시연이며, 관측 전에 응답속도 SLA를 보장하지 않는다.90초 제한 내 성공 여부를 우선 기록하고 느린 단계만 개선한다.

## 결과 기록은 구분

| 구분 | 현재 |
|---|---|
| 기존 로컬 UI/고정 briefing 회귀 | 기존 검사 있음. 새 Agent 기능 검증과 별개 |
| 새 부점 Agent 계약 |01 구현·로컬 교차 검사 완료 |
| 새 부점 Agent 계산/HTTP/Google live·로컬 UI |04/05에서 구현·검증 예정 |
| 새 부점 Agent 실제 FabriX/Starroot | 미구현·미검증 |

실패 시 프론트와 Agent를 호환되는 동일 이전 버전으로 되돌린다. 런타임 오류를 local mode 자동 fallback으로 숨기지 않는다. 인계에는 실패 단계/안전한 코드/확인 환경만 남긴다.

| 인계 | 값 |
|---|---|
| 상태 / 변경 파일 / 검사 / 남은 문제 | 미착수 / 없음 / 미실행 /01~05 선행 |
