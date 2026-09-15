# 06. 출력 계약 (Agent ↔ Frontend Contract)

> 근거: `sources/KB_GenAI_ProAgent_SourceOfTruth_v2.md` §10~§13, §35~§38
> + `app/pensionAgentDemo.js` 실제 구조 분석
> 이 문서는 **Mock → 실제 Agent 교체 작업의 설계도** 다.

---

## 1. 대원칙

```text
LLM       = 문장을 생성한다
Backend   = 구조를 결정한다      ← Pydantic으로 강제
Frontend  = 표현을 결정한다
```

LLM에게 아래를 **절대 생성시키지 않는다.**

```text
schema_version   answer_type   event
blocks           block.type    action.type
CSS              HTML
```

이유:

```text
LLM 출력 변동 → JSON shape 변동 → Frontend parser 오류
```

프론트에서 *"어떤 필드가 올지 모르겠다"* 상태가 되면 안 된다.
LLM이 이상한 걸 뱉어도 `schema_version` 누락 / `blocks` 누락 / `block.type` 랜덤 값이
**프론트까지 도달하지 않게** Backend가 막는다.

---

## 2. 현재 Agent 출력 계약 (`agent/main.py`)

```python
class Block(BaseModel):
    type: Literal["paragraph", "caution"]
    title: str | None = None
    text: str
    items: list[str] = Field(default_factory=list)


class AgentAnswer(BaseModel):
    schema_version: Literal["1.0"] = "1.0"
    answer_type: Literal["fact"] = "fact"
    lead: str
    blocks: list[Block] = Field(default_factory=list)
    followups: list[str] = Field(default_factory=list)


class AnswerEvent(BaseModel):
    event: Literal["answer"] = "answer"
    data: AgentAnswer


class ErrorEvent(BaseModel):
    event: Literal["error"] = "error"
    message: str
```

LLM은 `lead` / `detail` / `caution` **문자열 slot만** 채우고,
Python이 `build_fact_answer()` 에서 조립한다.

---

## 3. 검증된 전달 경로

```text
Python Pydantic Object
    ↓ model_dump()
    ↓ json.dumps(ensure_ascii=False)
Agent SSE content
    ↓
Fabrix
    ↓
Browser
    ↓ content 문자열
    ↓ JSON.parse()
Frontend 객체
```

브라우저에 실제로 도달한 형태:

```json
{
  "event": "answer",
  "data": {
    "schema_version": "1.0",
    "answer_type": "fact",
    "lead": "김서연 고객은 ...",
    "blocks": [
      { "type": "list", "title": "이 고객 기준 공제 구조", "text": null,
        "items": ["기본 세액공제 잔여한도 500만원"] },
      { "type": "paragraph", "title": null, "text": "...", "items": [] },
      { "type": "caution",   "title": null, "text": "...", "items": [] }
    ],
    "followups": []
  }
}
```

**구조 보존이 확인됐다.** → `JSON.parse(event.content)` 로 정상 파싱 가능.

---

## 4. ★ 프론트가 실제로 기대하는 형태 (Mock 내부 구조)

여기가 핵심이다. **Agent 출력과 프론트 내부 구조는 키 이름이 다르다.**
`app/pensionAgentDemo.js` 의 `QA[고객].answers[aid]` 는 이렇게 생겼다:

```javascript
{
  aType: 'fact',                       // ← answer_type 에 대응
  status: ['관련 제도를 확인하고 있어요', ...],   // 로딩 중 표시 문구
  lead: '완전히 못 빼는 건 아니고, ...',
  leadSub: '',                         // 선택
  blocks: [
    { t: 'list', title: '...', items: ['...', '...'] },
    { t: 'p',    x: '...' },           // ← text 가 아니라 x
    { t: 'caution', x: '...' }
  ],
  srcs: [{ type: '본부 공식 자료' }],    // 출처 배지
  evid: [{ doc, org, date, points: [], url }],   // 근거
  cta:  { ask, yes, next },            // 후속 행동 제안
  useGuard: false,
  follow: ['고객이 앱에서 직접 할 수 있어?']     // ← followups 에 대응
}
```

### 4.1 블록 타입 매핑표

`agVals()` (`pensionAgentDemo.js:736`) 가 `b.t` 로 분기한다.

| 프론트 `b.t` | 의미 | 사용하는 필드 | Agent `block.type` (현재) |
|---|---|---|---|
| `p` | 문단 | `x` | `paragraph` ✅ |
| `caution` | 주의 박스 | `x` | `caution` ✅ |
| `list` | 목록 | `title`, `items` | ❌ 미지원 |
| `steps` | 단계 | `title`, `items[{title,desc}]` | ❌ 미지원 |
| `quote` | 인용 | `x` | ❌ 미지원 |
| `msg` | 고객 안내 문구(복사 가능) | `msg` | ❌ 미지원 |
| `table` | 표 | `title`, `rows: [k, v][]` | ❌ 미지원 |
| `memoryNote` | 상담 기억 | `x` | ❌ 미지원 |
| `link` | 링크 | `title`, `x` | ❌ 미지원 |
| `eventCard` | 이벤트 카드 | `kind`, `icon`, `when`, `desc`, `msg` | ❌ 미지원 |

### 4.2 `aType` 값

`TYPE` 맵 (`pensionAgentDemo.js:714`) — 답변 유형 배지를 결정한다.

| `aType` | 배지 라벨 |
|---|---|
| `fact` | 제도 안내 |
| `pitch` | 상담 화법 |
| `memory` | 상담 기억 |
| `knowhow` | 현장 노하우 |
| `summary` | 상담 요약 |
| `action` | 실행 |

Agent는 현재 `answer_type: Literal["fact"]` 하나만 낸다.

### 4.3 키 차이 요약 — **어댑터가 반드시 변환해야 하는 것**

```text
Agent                    Frontend
─────────────────────────────────────
answer_type          →   aType
block.type           →   block.t
  "paragraph"        →     "p"          ← 이름이 다르다
  "caution"          →     "caution"
block.text           →   block.x        ← 이름이 다르다
block.items          →   block.items
block.title          →   block.title
followups            →   follow
lead                 →   lead
(없음)                →   status, srcs, evid, cta, useGuard
```

> ⚠️ `paragraph` → `p`, `text` → `x` 이 두 개를 놓치면 블록이 **조용히 빈 칸으로 렌더된다.**
> 에러가 안 나기 때문에 디버깅이 오래 걸린다.

---

## 5. 연동 설계 — 기존 renderer를 재작성하지 마라

```text
agSend()                       (pensionAgentDemo.js:633)
   ↓
callFabrixAgent()              ← 신규 (transport)
   ↓
parseFabrixSSE()               ← 신규 (04 §7~8)
   ↓
JSON.parse(content)            ← 2단계 파싱
   ↓
normalizeAgentAnswer()         ← 신규 (어댑터, §4.3 변환)
   ↓
state.agChat                   ← 기존 state 그대로
   ↓
기존 agVals()                  (:709)
   ↓
기존 UI
```

```text
✅ Transport만 교체
✅ Response Adapter 추가
✅ Renderer는 최대한 유지
❌ renderer / 템플릿 재작성
```

### 어댑터 스켈레톤

```javascript
var BLOCK_TYPE_MAP = { paragraph: 'p', caution: 'caution', list: 'list',
                       steps: 'steps', quote: 'quote', msg: 'msg',
                       table: 'table', memoryNote: 'memoryNote',
                       link: 'link', eventCard: 'eventCard' };

function normalizeAgentAnswer(data) {
  if (!data || typeof data !== 'object') return null;

  return {
    aType:  data.answer_type || 'fact',
    lead:   data.lead || '',
    blocks: (data.blocks || []).map(function (b) {
      return {
        t:     BLOCK_TYPE_MAP[b.type] || 'p',   // 모르는 타입은 문단으로 격하
        title: b.title || '',
        x:     b.text || '',
        items: b.items || [],
        rows:  b.rows || []
      };
    }),
    follow: data.followups || [],
    srcs: [], evid: [], cta: null, useGuard: false,
    status: ['답변을 준비하고 있어요']
  };
}
```

> 모르는 `block.type` 이 와도 **throw하지 말고 `p` 로 격하**한다.
> 계약 위반이 화면 전체를 깨뜨리면 안 된다.

---

## 6. 계약을 확장할 때 (권장 순서)

프론트는 이미 10종 블록을 렌더할 수 있으므로,
**프론트를 고치는 게 아니라 Agent 쪽 `Literal` 을 넓히는 방향**이 맞다.

```text
1. agent/main.py 의 Block.type Literal 에 타입 추가
   Literal["paragraph", "caution", "list", "steps", "table", ...]

2. 필요한 필드 추가 (rows 등)
   class Block(BaseModel):
       type: Literal[...]
       title: str | None = None
       text: str = ""
       items: list[str] = Field(default_factory=list)
       rows: list[list[str]] = Field(default_factory=list)   # table용

3. Python 조립 함수에서 해당 블록을 만든다 (LLM이 아니라!)

4. 프론트 어댑터 BLOCK_TYPE_MAP 에 매핑 추가

5. schema_version 은 호환성이 깨질 때만 올린다
```

### `schema_version` 정책

```text
1.0  현재
     - 하위호환 필드 추가  → 버전 유지
     - 필드 의미 변경/삭제 → 버전 상승 + 프론트 동시 배포
```

프론트는 모르는 `schema_version` 을 만나면 **에러가 아니라 degrade** 해야 한다.

---

## 7. 오류 이벤트

```json
{ "event": "error", "message": "답변 생성 중 오류가 발생했습니다." }
```

프론트는 `agentEvent.event` 로 분기한다.

```javascript
if (agentEvent.event === 'answer')  { /* 정상 */ }
else if (agentEvent.event === 'error') { /* 안내 메시지 표시 */ }
else { /* 알 수 없는 이벤트 → 무시하거나 fallback */ }
```

> `event` (Agent 계약) 와 `event_status` (Fabrix envelope) 는 다른 키다. → [04](04-Fabrix-연계.md) §6

---

## 8. 아직 확정되지 않은 것

```text
⏳ Multi-turn / session       — FabrixRequest.message_hists 를 어떻게 쓸지 미확정
⏳ actions 처리                — Fabrix envelope의 actions 활용 방안 미확정
⏳ references / recommend_queries 활용
⏳ 프론트의 srcs / evid / cta / guard 를 Agent가 채울지 여부
```

이 항목들은 **"미확정"** 이다. 임의로 설계해서 "검증됨"처럼 말하지 마라.
필요하면 설계안을 제시하되 미확정임을 명시한다.

---

## 9. 체크리스트

### Agent 쪽
```text
[ ] 출력이 Pydantic 모델을 거치는가
[ ] LLM이 구조가 아니라 문장만 만드는가
[ ] 예외 경로도 고정 구조(ErrorEvent)를 반환하는가
[ ] Literal 확장 시 프론트 어댑터도 같이 갱신했는가
```

### 프론트 쪽
```text
[ ] 2단계 JSON.parse 를 하는가
[ ] paragraph → p, text → x 변환을 하는가
[ ] 모르는 block.type 을 p 로 격하하는가 (throw 금지)
[ ] 기존 agVals / renderer 를 유지하는가
[ ] Mock(QA) fallback 경로를 남겨뒀는가
```
