# 부점 Agent 사내 배포용

03 실제 데이터와01 고정 계약을 사용하는 부점 공통 서비스다. 검색·집계·추천·짧은 브리핑·명확화·멀티턴 상태 재실행, `/health`·`/chat` SSE를 구현했다. 기존 `agent/`의 고정 S1~S5는 별도로 유지한다.

이 폴더의 실행 파일10개를 사내 배포 repo 루트에 반입한다. Dockerfile은 `/custom` 평면 import, 모든 실행 파일의 개별 COPY, Nexus 설치, `uvicorn main:app --host 0.0.0.0 --port 8000`을 사용한다. validation 없이 로컬 기동을 검사했지만 실제 사내 Python3.10 이미지·Nexus·LLM endpoint·E2E는 미검증이다.

모델 식별값은 `gemma-4-31b-it`, 사내 deployment 별칭은 `LLM_DEPLOYMENT_NAME`으로 별도 설정한다. 이전 모델 별칭으로 자동 대체하지 않는다. 기존 `llm_client.call(messages, *, system, model, max_tokens, x_client_user)`와 stage/인증 헤더 방식을 유지한다. Secret은 서버 환경변수로만 주입한다.

자세한 파일·패키지·환경변수·프론트/API 연결·내일 확인 순서는 [루트 배포 안내](../../BRANCH_AGENT_DEPLOY_TOMORROW.md), 구현/검사 결과는 [04](../../docs/handover/branch-agent/04-AGENT-STATE.md)·[05](../../docs/handover/branch-agent/05-GOLDEN.md)를 따른다. 로컬 Google 호출기와 브리지는 `../validation/`에만 있으며 사내 이미지에 포함하지 않는다.
