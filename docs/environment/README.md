# 사내 환경 기준 문서 (Source of Truth)

이 디렉터리는 **KB 사내망 퇴직연금 Pro Agent 프로젝트의 기준 문서**다.
코딩 에이전트/개발자가 작업을 시작하기 전에 읽는 것을 전제로 작성했다.

## 읽는 순서

```text
../../CLAUDE.md          ← 금지 규칙 요약. 가장 먼저.
        ↓
README.md (이 파일)       ← 지도 · 검증 현황
        ↓
01-사내환경-개요.md        ← 전체 아키텍처. 모두가 읽는다.
        ↓
작업 영역별 02 ~ 09
```

## 문서 목록

| 문서 | 다루는 것 | 주로 읽는 사람 |
|---|---|---|
| [01-사내환경-개요.md](01-사내환경-개요.md) | 전체 아키텍처, 구성요소 역할, 금지 가정 | 전원 |
| [02-에이전트-개발.md](02-에이전트-개발.md) | 코드 구조, 계층 분리, Gemma4 호출 규격, `/health` `/chat` | 백엔드 |
| [03-배포-파이프라인.md](03-배포-파이프라인.md) | git tag → Portal → Jenkins/Kaniko → ACR → ArgoCD → K8s | 백엔드 |
| [04-Fabrix-연계.md](04-Fabrix-연계.md) | Connector URL/헤더/바디, SSE 규격, 2단계 파싱 | 백엔드 · 프론트 |
| [05-Starroot-프론트엔드.md](05-Starroot-프론트엔드.md) | SPA Shell, `PG_` 라이프사이클, CSS namespace, 렌더 안정성 | 프론트 |
| [06-출력계약-Contract.md](06-출력계약-Contract.md) | Agent 출력 스키마, 프론트 블록 매핑, 어댑터 설계 | 백엔드 · 프론트 |
| [07-requirements-정책.md](07-requirements-정책.md) | 사내 Nexus, 버전 정책, 패키지 추가 절차 | 백엔드 |
| [08-트러블슈팅.md](08-트러블슈팅.md) | 증상별 진단 순서, 실제 장애 사례 | 전원 |
| [09-보안-시크릿.md](09-보안-시크릿.md) | Secret 취급 규칙, 브라우저 토큰 노출 문제 | 전원 |

## 참고 구현

| 디렉터리 | 내용 |
|---|---|
| [`examples/`](examples/) | 실제 동작을 확인한 코드 (토큰 제거본). 현재 `fabrixClient.js` — 브라우저 → Fabrix 호출 |

## 원본 근거 문서

`sources/` 에 원본을 **수정 없이** 보관한다.

| 파일 | 내용 |
|---|---|
| [sources/KB_GenAI_ProAgent_SourceOfTruth_v2.md](sources/KB_GenAI_ProAgent_SourceOfTruth_v2.md) | 에이전트 개발 · 배포 · Fabrix 연계 실전 기준 (§1~§53) |
| [sources/STARROOT_FRONTEND_CODING_GUIDE.md](sources/STARROOT_FRONTEND_CODING_GUIDE.md) | Starroot SPA 프론트엔드 코딩 가이드 (§1~§25) |

**요약본(01~09)과 원본이 충돌하면 원본이 우선이다.** 그리고 요약본을 고쳐라.
새로 검증한 사실이 생기면 원본이 아니라 요약본에 반영하고, 아래 검증 현황을 갱신한다.

---

## 검증 현황

이 표는 **"실제로 돌려봤는가"** 를 구분하기 위한 것이다.
✅ 가 아닌 항목을 "동작한다"고 말하지 마라.

### 백엔드 · 배포

| 항목 | 상태 |
|---|---|
| Gemma4 STG TRNN 호출 | ✅ 검증 |
| `AzureChatOpenAI` 조합 (endpoint / deployment / api_version="1") | ✅ 검증 |
| FastAPI `/chat` | ✅ 검증 |
| Agent SSE framing (`data: {JSON}\n\n`) | ✅ 검증 |
| Git tag 기반 배포 | ✅ 검증 |
| Jenkins / Kaniko build | ✅ 확인 |
| ACR push | ✅ 확인 |
| ArgoCD / Kubernetes rollout | ✅ 확인 |
| Backend fixed output contract (Pydantic) | ✅ 검증 |
| Gemma plain-text slot 생성 | ✅ 호출 성공 |
| Gemma prompt 품질 (메타 발화 제거) | ⚠ 개선 필요 |
| SERV 스테이지 End-to-End | ⏳ 미검증 |

### Fabrix · 프론트

| 항목 | 상태 |
|---|---|
| Fabrix Python 호출 | ✅ 검증 |
| `zmnbank.kbstar.com` Browser → Fabrix direct call | ✅ 검증 (HTTP 200, `text/event-stream`) |
| Fabrix `content` 전달 | ✅ 검증 |
| Pydantic JSON → Browser 구조 보존 | ✅ 검증 |
| Browser 2단계 `JSON.parse` | ✅ 검증 |
| 그 외 origin에서의 Browser direct call | ⚠ 사례에 따라 `OPTIONS 405` (Origin/CORS 정책 의존) |
| Starroot Vanilla 화면 구동 (`PG_` 라이프사이클) | ✅ 검증 |
| `assets.css` / `common_ui_init.js` / `container_mnbank.js` 없이 구동 | ✅ 검증 |
| **`pensionAgentDemo.js` Mock → 실제 Agent 교체** | ⏳ **다음 단계** |
| Multi-turn / session | ⏳ 미확정 |
| Action(`actions`) 처리 | ⏳ 미확정 |
| 실제 Native App WebView viewport/header | ⏳ 미확인 |

---

## 다음 단계 (현재 남은 일)

```text
1. 프론트 transport 교체
   app/pensionAgentDemo.js 의 agSend() → Fabrix 호출 + 응답 어댑터
   (Mock QA/agRun 은 fallback으로 유지)
   → 04, 05, 06

2. Agent 출력 블록 타입 확장
   현재 paragraph / caution 2종 → 프론트가 이미 지원하는 10종까지
   → 06

3. Multi-turn (message_hists) 설계 확정
   → 02, 06

4. SERV 스테이지 End-to-End 검증
   → 03
```
