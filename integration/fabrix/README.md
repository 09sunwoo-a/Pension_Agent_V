# examples/ — 참고 구현

실제 사내 환경에서 **동작을 확인한 코드**를 토큰·개인정보만 제거해서 보관한다.
화면에 로드되지 않는 참고용이며, 연동 시 필요한 부분을 옮겨 쓴다.

| 파일 | 내용 | 검증 |
|---|---|---|
| [`fabrixClient.js`](fabrixClient.js) | 브라우저에서 Fabrix Agent Connector 호출 (fetch + SSE + 2단계 파싱) | ✅ `zmnbank.kbstar.com` WAS 배포 상태에서 HTTP 200 / `text/event-stream` 수신 확인 |

## 🔒 규칙

원본 진단본에는 `openapiToken` / `generativeAiClient` / `agentId` / 직원 ID가
**평문으로 박혀 있었다.** 이 디렉터리의 코드는 그 값들을 전부 제거하고
**호출 시 주입**하도록 바꾼 것이다.

```text
❌ 이 파일들에 토큰을 다시 적지 마라
❌ 토큰이 박힌 채로 커밋하지 마라
```

→ [`../../docs/platform/06-SECURITY.md`](../../docs/platform/06-SECURITY.md)

## 연동할 때

```text
integration/fabrix/fabrixClient.js   ← 여기서 transport 로직 참고
        ↓
frontend/src/briefing/pensionAgentDemo.js 의 agSend() ← 실시간 상담 교체 시 참고
        ↓
normalizeAgentAnswer()                       ← 어댑터 추가 (키 변환)
        ↓
기존 agVals() / renderer 유지
```

설계 상세: [`../contracts/AGENT_FRONTEND_CONTRACT.md`](../contracts/AGENT_FRONTEND_CONTRACT.md) §5
