# 대화 Agent(동료 `Pension_agent`) ↔ 프론트 실시간 상담 패널 정합성 분석 (2026-09-22)

분석 대상: `09sunwoo-a/pension_agent` `main` 커밋 `7c2b26c` (`src/main.py`, `client/README.md`, `consult_agent/*`, `strategy_agent/customers.json`, `tests/`) vs 이 저장소의 `frontend/src/briefing/pensionChat.js`, `fabrix-chat-transport.js`, `mnPensionAgentDemo.html`(채팅 패널), [CHAT_AGENT_CONTRACT.md](CHAT_AGENT_CONTRACT.md), [chat.example.json](chat.example.json).
방법: 소스 정독 → 항목별 대조 → 코드 라인 재확인. 실제 배포 Agent 호출은 하지 않았다.

**요청 봉투·SSE 프레이밍·이벤트 추출·세션 규칙은 맞다.** 어긋나는 것은 응답 **안쪽**(answer.links, action, answer.text 서식, 빈 sources)과 **화면 배치**, 그리고 **C01-10/11/12 고객 데이터**다.

---

## 1. 반드시 고칠 것 (배포 화면에서 내용이 빠지거나 대화 경로가 끊김)

> **2026-09-22 결정·반영:** 1-1 반영(본문 화면번호를 딥링크로, 본문 아래 링크 줄, **「네」 승낙 턴(`intent: confirm_action` + `links`)은 `links[0].url`을 바로 연다**). 1-2 반영(1-6과 묶임 — 본문의 제안 문장을 떼면 질문이 사라지므로 버튼 위에 `prompt`를 쓴다). 1-3·1-4·1-5·1-6 반영. **1-7·1-8은 사용자 결정으로 보류(그대로 둠).** 추가: 큰따옴표 화법 카드의 「복사」 버튼 제거(Agent compose 프롬프트가 복사 버튼을 전제하지만 화면 결정), 답변 본문의 단일 줄바꿈 유지(`white-space: pre-line`). 검증: `tools/briefing/check.js`에 offer·memo·clarify·links·승낙 자동 열기 케이스 추가, 헤드리스 캡처 확인.

### 1-1. `answer.links[]`(단말 화면 딥링크)를 프론트가 전혀 읽지 않는다 — blocker
- Agent: 모든 answer 이벤트에 `links`가 온다(없으면 `[]`). 항목 `{screen:"04-12-642", url:"mystar-link://scnNo=0412642&mode=D", label:"적립금및수익률조회"}`. `main.py:250-260`, `effects/screens.py:82-92,139-158`. LMS 제안에 「네」 한 뒤의 답변은 본문이 제안 라벨 한 줄뿐이고 **유일한 실행 수단이 `links[0].url`**이다(`nodes/act.py:584-591`). `client/README.md:95-113`: 본문 속 `screen` 문자열을 `url`로 감싸고, URL을 프론트가 조립하지 말 것, 커스텀 스킴을 sanitizer 허용 목록에 넣을 것.
- 프론트: `compose()`가 `answer.text`만 읽는다(`pensionChat.js:181`). 근거 링크 `↗ 원문 보기`만 있고 `/^https:\/\//`로 걸러(`:171`) `mystar-link://`는 통과 못 한다. 레거시 코드는 `mode=D`를 하드코딩해 URL을 직접 만든다(`pensionAgentDemo.js:649,1396`) — Agent 규약 위반.
- 변경: `compose()`에 `links` 보존 → `message()`에서 lead/p/list 문자열을 `links[i].screen`으로 분할해 `[{t, isLink, url, label}]` 세그먼트로 만들고, 템플릿에 `<a href="{{ seg.url }}">` 브랜치 추가(엔진의 `safeHtml` 바인딩을 쓰면 `<b>`·`<a>`를 escape된 텍스트와 함께 그릴 수 있다, `pensionAgentDemo.js:12,749`). 본문 아래에 「↗ {label} ({screen})」 링크 줄도 추가(승낙 턴처럼 본문이 라벨뿐일 때 대비). `[04-12-642]`처럼 대괄호 안에 있어도 맨 번호로 찾는다. 계약 문서 §3에 `answer.links` 행 추가, check.js에 links 합성 케이스 추가.

### 1-2. 네/아니오 버튼 문구가 `label`(명사구)이고 `prompt`(질문)가 아니다 — high
- Agent: action = `{kind, label, prompt, (title,text,to)}`. `label`은 제안 이름(「75-08-110 발송 화면 열기」, 「«…»에게 쓰는 화법 2건」, 「이 쪽지 보내기(받는 사람: 본인)」), `prompt`가 직원에게 묻는 문장(「…, 연계해드릴까요? (네 / 아니오)」, 「이대로 쪽지를 보낼까요? 받는 사람은 본인이에요. (네 / 아니오)」). `nodes/act.py:43-52,183-187`, `main.py:264-268`. README: `prompt`와 버튼을 그린다.
- 프론트: `ctaAsk = label || prompt`(`pensionChat.js:220`). `kind`는 읽지 않는다.
- 변경: `ctaAsk = (prompt || label).replace(/\s*\(네 \/ 아니오\)\s*$/, '')`. `kind ∈ {lms, pitch, memo}`로 버튼 문구 분기(열기/보기/보내기)는 선택. check.js:140 픽스처를 실제 모양(`kind:'lms', label:'75-08-110 발송 화면 열기', prompt:'…연계해드릴까요? (네 / 아니오)'`)으로 교체.

### 1-3. 네/아니오 버튼이 출처 블록·추천질문 **아래**에 그려진다 — high (2026-09-17 시연 지적 사항)
- Agent README「제안은 근거가 아니다」: 버튼과 prompt는 **답변 본문 바로 아래**, 출처(`sources`)·근거 N건과 사이에 아무것도 끼우지 말 것.
- 프론트: 렌더 순서가 본문 → foot(참고한 자료·근거 N건) → 추천질문 → CTA → clarify(`mnPensionAgentDemo.html:663-733`).
- 변경: 템플릿에서 `ctaOn`/`clarifyOn` 블록을 blocks 루프 직후(foot 앞)로 옮긴다. 추천질문과 action은 같은 턴에 절대 함께 오지 않으므로(`effects/suggest.py:385-394`) 순서 충돌은 없다.

### 1-4. 쪽지 초안 턴: ``` 펜스가 글자로 보이고 초안이 두 번 나온다 — medium
- Agent: 쪽지 제안은 본문 전체를 "```\n[제목] {title}\n\n{text}\n```\n\n— 이대로 쪽지를 보낼까요? …(네 / 아니오)"로 바꾸고, action에 `title/text/to`를 함께 보낸다(`nodes/act.py:183-192`). 「네」 뒤 답변은 「쪽지를 보냈어요 — 받는 사람: 본인.」 한 줄, MCP 미연결이면 「쪽지를 보내지 못했어요. WorkB 클라이언트가 주입되지 않았습니다 — 본문만 생성했습니다」.
- 프론트: parseAnswer가 펜스를 모른다 → "```"가 lead가 되고 본문이 p로, 다시 action의 `msg` 블록으로 한 번 더(`pensionChat.js:134-158,185-188`).
- 변경: `compose()`에서 `action.kind==='memo'`이거나 본문이 "```"로 시작하면 펜스 구간을 본문에서 제거하고 `msg` 블록(복사 버튼)만 남긴다. 「보내지 못했어요」는 경고 스타일.

### 1-5. 되묻기(clarify) 턴: 선택지가 본문 글머리와 버튼으로 두 번 — medium
- Agent: 되묻기 턴의 answer.text는 "질문\n\n· 옵션1\n· 옵션2"이고 clarify 이벤트 `{question, options[]}`(문자열 2개 이상)가 따로 온다(`nodes/clarify.py:171-172,291-296`). sources는 오고 followups·action은 없다.
- 프론트: 글머리 줄이 list 블록이 되고 버튼도 그린다(`pensionChat.js:146-147,222-227`).
- 변경: clarify가 있으면 본문 마지막 "· " 목록이 `clarify.options`와 같을 때 그 list 블록을 버리고, lead와 `clarifyQuestion`이 같으면 한쪽만 표시. 옵션 버튼은 문자열 그대로 다음 `message`로 전송(금액을 덧붙이지 말 것 — Agent가 첫 금액을 납입액으로 읽음).

### 1-6. 답변 본문 끝의 「— {prompt} (네 / 아니오)」 줄이 버튼과 중복 — medium
- Agent: offer 노드가 "\n\n— {prompt}"를 본문 끝에 붙이고 같은 문장을 action.prompt로 보낸다(`nodes/act.py:407-414`). README: 버튼을 그리는 프론트는 그 마지막 줄을 뗀다. Agent 자체 정규식 `\n*— [^\n]*\(네 / 아니오\)\s*$`(`tools/history.py:186`).
- 예외: `lms_link` 의도 턴(직원이 「"문구" 로 LMS 보내줘」)은 첫 줄에 「{번호} 발송 화면을 열어드릴까요? (네 / 아니오)」가 오고 "— " 접두가 없다(`nodes/lms.py:57-58`) — 이 턴은 본문을 그대로 둔다. 「— 쪽지를 보낼 받는 사람을 알 수 없어요 — …」처럼 "(네 / 아니오)"가 없는 "— " 줄은 안내문이므로 남긴다.
- 변경: `compose()`에서 action이 있을 때만 위 정규식으로 꼬리 제거.

### 1-7. `sources.items === []`를 「근거 없음」으로 말하지 않는다 — medium
- Agent: sources는 항상 오고 agent_help·lms_link·confirm_action(승낙/취소/쪽지 발송)·correction·LLM 실패·근거 0건 턴은 `[]`다. README: «근거 없음»을 **표시한다**(빼지 않는다).
- 프론트: `footOn` 항상 true → 빈 「참고한 자료」 줄과 「▸ 근거 0건」 토글(`pensionChat.js:212-214`, 템플릿 663-671).
- 변경: evidence·guard가 모두 0이면 토글 대신 「근거 없음」 텍스트, 배지 0개면 「참고한 자료」 줄 숨김. intent가 confirm_action이고 links가 있으면 foot 자체를 생략해도 된다.

### 1-8. 실패 안내가 일반 답변처럼 보인다 (`answer.intent` 미사용) — medium
- Agent: intent 값은 정확히 `situation | guide | agent_help | correction | lms_link | confirm_action | llm_down`(`routing.py:35-47`). LLM 실패·도구 실패·근거 없음은 **error 이벤트가 아니라 answer 이벤트**로 온다: 「지금은 답변을 만들 수 없어요 — LLM 호출이 실패했습니다. …\n({reason})」, 「지금은 답변을 만들 수 없어요 — {what} 자료를 읽는 데 실패했습니다. …」, 「죄송해요, 그 질문은 제가 가진 자료로는 답을 드리기 어려워요.」(`nodes/plan.py:68,75-78`). error 이벤트는 ask() 밖으로 예외가 나갈 때만.
- 프론트: `typeLabel='AI 답변'` 고정(`pensionChat.js:203`), intent 버림.
- 변경: intent → 태그 매핑(situation/guide 「상담 답변」, agent_help 「도움말」, correction 「수정 요청」, lms_link 「LMS 연계」, confirm_action 「실행」, llm_down 「응답 실패」). `intent==='llm_down'` 또는 본문이 「지금은 답변을 만들 수 없어요 — 」로 시작하면 경고 말풍선(foot·칩 없음, 다시 시도 안내). 「죄송해요, 그 질문은…」은 회색.

---

## 2. 고치는 것이 좋은 것 (표시 품질·계약 문서)

### 2-1. answer.text 서식 — 프론트 parseAnswer가 모르는 표기
Agent 코드가 넣는 구조 표기는 다음이 전부다(마크다운 렌더러를 붙이지 말 것 — "— "·"· " 줄을 망가뜨린다). LLM이 지시를 어기고 `**굵게**`·`| 표 |`를 낼 수는 있으나 코드가 제거하지 않는다(테스트 픽스처에 실제로 존재, `tests/consult/answer.py:191-193,921-926`).

| 표기 | 어디서 | 지금 화면 | 제안 |
|---|---|---|---|
| `- 이름 — 핵심 속성` (3개 이상 나열 시 한 줄씩) | compose 규칙 | list로 정상 | 유지 |
| `"…"` 큰따옴표 한 문단 = 고객 화법 | compose 규칙, 복사 버튼 전제 | quote로 정상 | 유지 |
| `\n\n── 참고한 자료\n· 본부 공식 자료` 꼬리 | `evidence/marks.py:41`, `nodes/plan.py:934-942` | 배지로 정상 | 배지 문구 5종 확정: 「본부 공식 자료」「영업점 현장 노하우 — 본부 확정 지침이 아닙니다」「대외 공개 자료 — 고객에게 그대로 안내 가능」「직원 교육자료」「이 내용은 고객에게 그대로 안내하지는 마세요 — 내부용으로 표시된 자료입니다.」 `SOURCE_COLORS` 키를 이 문구로 맞추고 내부용 문구는 경고색 |
| `\n\n── 빠뜨리면 안 되는 표시\n\n{안내문}\n\n{안내문}` | `nodes/plan.py:152-153,927-937` | "── …"가 본문 p로 | 두 번째 꼬리 블록. 헤더를 떼고 항목을 caution 블록으로 |
| `※ …`, `⚠ …`, `⚖ …` 로 시작하는 줄 (항상 독립 줄) | `tools/cards.py`, `nodes/plan.py:155-165` | p 안에서 줄바꿈이 공백으로 붕괴(`.pad-ans__p`에 white-space 없음) | 줄 단위 caution 블록(기존 `isCaution` 템플릿 재사용) |
| `■ 제목` 섹션 헤더 + `· ` 목록 (agent_help, 근거 검증 실패 시 원문 덤프) | `nodes/meta.py:21-64`, `nodes/plan.py:209-212` | 한 문단으로 붕괴 | "■ " 줄은 소제목(`hasTitle`) + `white-space:pre-line` |
| 「답변 문장이 근거 검증을 통과하지 못해서, 찾은 근거를 원문 그대로 보여드려요 — …」 접두의 수천 자 원문 덤프 | `nodes/plan.py:929-932` | 일반 답변 | 접두 감지 → 접힘 가능한 `msg` 블록 |
| `mystar-link://` 없이 본문에 화면번호 `04-12-642`(대괄호 유무 혼재) | `effects/screens.py:56-69` | 글자 | 1-1 |
| 단일 `\n` (안내문·되묻기·승낙 턴) | 여러 곳 | 공백으로 붕괴 | `.pad-ans__p`·`.pad-ans__lead`에 `white-space:pre-line` |

### 2-2. `sources.items[].doc` 괄호 분해가 깨진다
- doc = `"{문서명} ({부서}, {일자})"`인데 부서에 괄호가 흔하다: 「퇴직소득세 계산 어렵지 않아요~ (김재 (달성종합금융센터 / L3 팀장), 2025-03-17)」, 「KB국민은행(대외 공개)」. KB 102개 doc 문자열 중 46개가 중첩 괄호. 비-KB 출처는 고정 라벨이고 끝이 `)`: 「고객 정보 — 계좌 원장 조회값 (브리핑 화면과 같은 값)」 등(`tools/briefing.py:150`).
- 프론트 `docParts()`는 `lastIndexOf(' (')`(`pensionChat.js:159-162`) → 이름이 「…어렵지 않아요~ (김재」로 잘린다.
- 변경: 끝의 `)`와 짝이 맞는 `(`를 찾아 분할하고, 괄호 안에 쉼표나 숫자가 없으면 분할하지 않는다. id 접두 `customer.|suitable.|outreach.|targets.|session.|system.|turn.`는 시스템 출처로 표시(문서 메타 분할·링크 기대 없음, **id에 KB-PIN이 들어 있으니 id를 화면에 노출하지 말 것**).
- 그 외 sources 사실: `url`은 KB 카드에서만 오고 https(lxp.kbstar.com·kbthink.com)뿐 — 지금 처리(https만 링크) 맞음. 비-KB 항목은 `url` 키 자체가 없다(`typeof` 검사 유지). `page`는 현재 항상 null. `score`는 float|null이고 2.0은 「LLM이 고른 카드」라는 뜻(퍼센트 아님), 이전 답변 재인용 시 0.0이 올 수 있다. `role`은 「근거」「주의」 둘뿐이며 없으면 근거로 본다. 「주의」 항목은 title 자체가 규칙 문장(60자 절단 시 「…」)이고 같은 고객이면 매 턴 반복된다.

### 2-3. 요청: `employee_id`를 보내지 않고 `xClientUser` 사번 규칙을 검사하지 않는다
- Agent: 쪽지 보내는 사람/받는 사람 = `employee_id` 그대로, 없으면 `x_client_user`가 **정확히 7자리 숫자로 시작하고 그 뒤가 끝이거나 구분자**일 때만(`note.py:396-425`), 그것도 없으면 서버 `WORKB_EMP_NO`, 그것도 없으면 쪽지 제안 자체가 안 붙고 「— 쪽지를 보낼 받는 사람을 알 수 없어요 — 로그인 사번이 넘어오지 않았습니다. …」가 붙는다.
- 프론트: inner는 `{message, x_client_user, customer_id, session_id}` 넷뿐(`pensionChat.js:111`), xClientUser는 비어 있지 않은지만 검사.
- 변경: `chat.employeeId`(선택, `/^\d{7}$/`)를 설정에 받아 `employee_id`로 실어 보내고, 없을 때 xClientUser가 `/^\d{7}(?!\d)/`에 안 맞으면 콘솔 경고(거부는 하지 않음 — 지식 Q&A는 사번 없이도 됨).

### 2-4. 게이트웨이 오류 본문·비이벤트 응답을 버린다
- Agent README 파싱 규칙 4: status가 SUCCESS가 아니면 content는 게이트웨이 오류 문구이므로 `responseCode`와 함께 보여주고, 이벤트가 하나도 없으면 원문을 그대로 보여준다.
- 프론트: `GATEWAY` 고정 문구만(`fabrix-chat-transport.js:71-76`, `pensionChat.js:21`). SUCCESS인데 이벤트가 없는 content는 조용히 버려져 EMPTY/TRUNCATED로 끝난다.
- 변경: GATEWAY 오류에 `responseCode`·content 앞 300자를 붙이고, 이벤트 없는 비어 있지 않은 content는 `{type:'raw', text}`로 만들어 회색 시스템 말풍선 「이벤트가 아닌 응답: …」.

### 2-5. 비스트림(JSON 한 덩이) 응답을 받을 수 없다
- Agent: Accept가 `application/json`뿐이거나 `isStream:false`면 `{"event":"CHUNK","content":"<이벤트들을 \n으로 이은 문자열>"}` JSON 하나(진행 이벤트 없음). 오류도 200 + error/done.
- 프론트: content-type이 `text/event-stream`이 아니면 `CONTENT_TYPE` 실패. `events()` 자체는 연결된 JSON을 이미 읽는다.
- 변경: `application/json`이면 `response.json()` → `events(envelope.content)`로 같은 경로 처리. 낮은 우선순위(게이트웨이가 isStream을 무시할 때만 필요).

### 2-6. 계약 문서·샘플이 낡았다
- [CHAT_AGENT_CONTRACT.md](CHAT_AGENT_CONTRACT.md): (a) `answer.links` 행이 없다. (b) 37행 「모르는 식별자면 답변이 오지 않으므로」 → 실제로는 plan 경로가 「죄송해요, 그 질문은 제가 가진 자료로는 답을 드리기 어려워요.」, lms_link·correction 경로가 「지금 조회 중인 고객을 찾을 수 없어요. 고객 화면을 먼저 열어주세요.」를 답한다. Agent는 **모르는 고객 id를 알려주지 않는다** — 프론트가 12명 목록으로 걸러야 한다. (c) 49행 intent 값 목록 → 위 7종. (d) 53행 「`label` 또는 `prompt`」 → `prompt` 우선. (e) `sources.items[].url` 키가 없을 수 있음 명시. (f) Agent README 예시의 `"intent": "procedure"`는 실제 값이 아니므로 옮기지 말 것.
- [chat.example.json](chat.example.json): answer에 `links` 키가 없고, 고객 출처 title이 「이준호 고객 계좌 현황 (KB-PIN 198734-1205842)」인데 현재 코드는 KB-PIN을 뺀다(`tools/briefing.py:144-149`). 새 Agent로 다시 녹음하되 화면번호 인용 턴(links 비어 있지 않음), lms/pitch 제안 턴 + 「네」 턴, 되묻기 턴, agent_help 턴(sources 빈 목록), 쪽지 턴을 포함한다.

---

## 3. 대화 흐름·세션에서 확인된 사실 (프론트 규칙과 맞는지)

| 항목 | Agent 동작 | 프론트 | 판정 |
|---|---|---|---|
| 세션 키 | 맥락은 `(x_client_user, session_id)`로 메모리 보관, 2시간 TTL, 12턴, 500세션, 컨테이너별(`context_store.py`). `customer_id`는 키가 아니다 | 케이스마다 UUID, 고객 변경 시 새 UUID | 맞음. 다른 고객으로 바꾸면 반드시 새 session_id(안 그러면 이전 고객 제안에 「네」가 실행됨) |
| 「네/아니오」 | **직전 턴**의 pending_action만 실행. 사이에 다른 질문이 끼면 「직전에 제안드린 작업이 없어요. 무엇을 도와드릴까요?」. 애매한 답이면 같은 prompt + 「'네' 또는 '아니오'로 답해 주세요.」와 함께 action 이벤트를 **다시** 보낸다 | 마지막 답변에만 버튼 표시, 「네」「아니오」 문자열 전송 | 맞음. 재질문 턴에 action이 다시 오므로 버튼이 다시 그려짐(현 구조 OK) |
| 「네」 결과 | lms → 라벨 한 줄 + `links[0]`(+「화면이 열리면 이 문구를 넣어 주세요 — "…"」), sources []; pitch → 근거 있는 정상 답변(followups·새 action 가능); memo → 한 줄 확인 | — | 1-1, 1-7 참조. pitch 승낙은 「짧은 상태 턴」으로 특별 취급하지 말 것 |
| followups | 최대 3개, 제안·되묻기·실패·근거 0건 턴에는 `[]`. answer.text에는 절대 없음 | 칩으로 전송 | 맞음. 모든 이전 답변의 칩이 계속 눌리는 것은 허용 범위 |
| 진행 문구 | 코드 고정 8종 + 「{도구}을/를 찾고 있어요」 20종. 같은 문구가 한 턴에 여러 번 올 수 있음(검증 재시도) | 마지막 문구만 표시 | 맞음 |
| 타임아웃 | 브리핑 캐시가 낡으면 첫 고객 질문이 LLM 11회 + 턴 4~7회(STG 분당 10회 제한이면 70초 이상). 지문에 **오늘 날짜**가 들어가 매일 첫 호출이 느리다 | 180초 | 유지하되 첫 턴 지연을 「고객 브리핑 자료를 찾고 있어요」로 버틴다. 재시도하면 서버가 턴을 두 번 기록함(끊겨도 맥락은 저장됨) |
| 끊김 | 클라이언트가 중간에 끊어도 서버는 끝까지 돌고 맥락(pending_action 포함)을 저장 | 취소 시 「요청을 취소했습니다.」 | 취소 뒤 다음 「네」가 이전 제안을 실행할 수 있음 — 취소 직후엔 버튼을 그리지 않으므로 사용자 입력으로만 가능. 문서에 명시 권장 |
| 입력 개인정보 | 프롬프트로 가기 전 12개 규칙으로 가림(KB-PIN·전화·계좌). 직원이 채팅에 고객번호를 치면 LLM은 못 본다 | — | 입력 안내 문구로 알려줄 만함 |
| 시작 칩 | `suggest.history_chips/outreach_chips`(「지난 상담(10/6 · 322일 전)에서 무슨 얘기 했지?」 등)는 **HTTP로 노출되지 않는다**(main.py에 /health, /chat뿐) | 시작 칩 없음 | 현재 맞음. 필요하면 동료에게 엔드포인트 요청 |

---

## 4. 고객 데이터 정합성 (C01 12명)

- 12명 id는 Agent 로스터(`strategy_agent/customers.json`, 9명 xlsx + `scripts/demo_cases.json` 3명)와 **1:1 일치**. B 사례 30명(`58304-91726` 꼴)은 로스터에 없다.
- **C01-01~09**: 이름·나이·등급·투자성향·평가금액·고유계정대·예금·세액공제 잔여·수익률·IRP가입일·납입이력·최근상담일·ISA(한지우 9/5·송도윤 9/20)가 모두 일치. 수정 불필요.
- **C01-10 김서연**: 헤더·ISA(8,000만·9/30·타행·전환기한 11/29)·잔여한도 500만·올해 납입 400만 일치. **어긋남**: 정기예금 은행·일자(Agent 신한은행 2025-11-20→2026-11-20, 우리 KB저축은행 2026-03-12→2027-03-12), IRP가입일(2021-04-12 vs 2019-03-15), 디폴트옵션 위험등급(저위험 vs 중위험 뿔려드림), 납입이력(2023 300/2024 400/2025 400만 vs 2025 900만), 최근입금일(7/10 vs 6/10). 동연령 비교값은 Agent에 없음(질문 시 「자료 없음」).
- **C01-11 박정호**: **등급 그랜드(Agent) vs VVIP(우리)**, **평가금액 2,000만(하나은행 정기예금 1건, 만기 2027-03-10) vs 6,800만(예금 2건)**, 수익률 2.9 vs 3.2, 2025 납입 300만 vs 600만, 최근입금일 6/15 vs 5/10, IRP가입일 6/20 vs 6/14. Agent에는 **2026-08-20 상담 기록**(「8월 퇴직으로 퇴직급여 약 1억 5,000만원을 당행 일반 입출금계좌로 수령…」)이 있고 우리 상담이력은 비어 있음 — 「지난번엔 무슨 얘기 했지?」 답변이 화면과 어긋난다. Agent 원장의 퇴직급여는 0원(계좌 밖).
- **C01-12 이수민**: **등급 패밀리(Agent) vs 그랜드(우리)**, 수익률 2.4 vs 2.8, IRP가입일 2018-05-10 vs 2014-05-20, 2025 납입 700만 vs 0. 평가금액 8,000만·예금 7,000만(기업은행, 만기 2026-10-17)·현금 1,000만·잔여한도 900만·DO 미등록은 일치.
- **기준일**: Agent 원장 스냅샷은 2026-08-24 고정(`AS_OF`)이고 D-day·경과일은 서버의 `PENSION_TODAY`(없으면 실제 날짜)로 센다. 동료의 QA 스크립트와 demo_cases 메모는 **2026-09-29**를 전제한다. 배포 컨테이너에 `PENSION_TODAY=2026-09-29`가 없으면 화면(9/29 기준)과 채팅의 D-day가 어긋난다(9/22 실행 시 오세훈 D-17 vs 화면 D-10, 김서연 ISA D-8 vs D-1).
- 기타: Agent는 「고유계정대」·「GIC」를 따로 부르고 우리 카드는 「현금성자산」·「원리금보장형(예금+GIC)」으로 접는다 — 답변 문구 차이는 정상. 잔여한도는 Agent가 「만원」 단위로 말한다. 송도윤 세션 파일에 2026-09-21 디버그 세션(llm_down 오류문)이 남아 있어 「지난 상담」에 오류문이 인용될 수 있다(동료 정리 필요). `TEST_ACT.json`은 테스트 잔재.

---

## 5. 동료에게 확인할 것
1. 배포 컨테이너 환경변수: `PENSION_TODAY=2026-09-29`, `TERMINAL_SCREEN_MODE`(지금 D), `TERMINAL_SCREEN_SCHEME`(mystar-link://), `CHAT_SSE_FRAMING`(기본 SSE) — 프론트 sanitizer 허용 스킴과 링크 표시가 이 값에 걸린다.
2. 게이트웨이가 CHUNK 여러 개를 한 `content`에 합치거나 한 이벤트를 두 프레임으로 쪼개는지(현 파서는 합침은 처리, 쪼개짐은 조용히 유실).
3. 컨테이너가 여러 개면 `(x_client_user, session_id)` 맥락이 프로세스 메모리라 세션 고정이 필요한지.
4. 운영 `x_client_user` 꼴이 7자리 사번으로 시작하는지, 아니면 `employee_id`를 따로 보내야 하는지.
5. C01-10/11/12는 우리 JSON을 `demo_cases.json`에 맞출지, 동료 데이터를 우리 화면에 맞출지(권장: 화면을 Agent 원장에 맞춘다 — 채팅 답변은 바꿀 수 없다).
6. 시작 칩(지난 상담·이벤트 안내)을 HTTP로 받을 엔드포인트가 생길 계획인지.
