# 05. Starroot 프론트엔드

> 경로 안내: 아래 `frontend/app/` 및 줄 번호는 최초 사내 검증 당시의 기록입니다. 해당 구버전 파일은 제거했으며 현재 수정 원본은 `frontend/src/briefing/`, 반입본은 `frontend/briefing-fabrix/`입니다. 로컬 확인은 저장소 루트에서 `node tools/briefing/build.js --preview`를 사용합니다. 원본 근거 문서는 변경하지 않았습니다.

> 근거: `sources/STARROOT_FRONTEND_CODING_GUIDE.md` 전체
> 대상 파일: `frontend/app/mnPensionAgentDemo.html`, `frontend/app/pensionAgentDemo.css`, `frontend/app/pensionAgentDemo.js`

---

## 1. 한 줄 요약

> **Starroot에서는 독립 웹앱을 새로 띄우는 것이 아니라, 이미 실행 중인 SPA Shell 안에
> 업무용 HTML/CSS/Vanilla JS 모듈을 삽입하고 `PG_<파일코드>` 라이프사이클로 초기화한다.**

이 전제만 지켜도 포팅 시 발생하는 구조적 오류 대부분을 피할 수 있다.

---

## 2. 페이지 로딩 방식

핵심 SPA 엔진: `/mnbank/app/js/spa/spa_base.js`

```text
loadPage(payload)
    ↓
pageRender(payload)
    ↓
jsCssfileImport(payload)
    ↓
payload.template_path 의 HTML을 XHR GET
    ↓
HTML 문자열 분석
    ├─ <link> 추출
    ├─ <script src> 추출
    ├─ inline <script> 추출
    └─ <head> 제거          ← ★
    ↓
업무 HTML을 .pt-page 에 innerHTML 로 주입
    ↓
참조 JS 실행  (new Function(scriptText).call() 가능)
    ↓
inline JS 실행
    ↓
window 에서 PG_* 탐색
    ↓
beforeBinding()
    ↓
SPA_COMMON.docReady(payload)
    ↓
onParam()               ← ★ 여기서 초기화한다
```

### 여기서 나오는 3가지 결론

1. 업무 HTML은 **새 document가 아니다.** 기존 SPA document의 `.pt-page` 안에 삽입된다.
2. `<head>` 가 제거되므로 **`<head>` inline `<style>` 에 핵심 CSS를 넣으면 안 된다.** `<link>` 를 쓴다.
3. 참조 JS가 `new Function(...)` 으로 실행될 수 있으므로 **파일 간 `const`/`let` 공유를 가정하면 안 된다.**
   공유가 필요하면 명시적으로 `window.XXX` 에 올린다. 현재 규모에서는 **한 파일 유지**가 가장 안전하다.

---

## 3. DOM 구조

```html
<body>
  <div>
    <div class="browserHeader on">...</div>   <!-- 브라우저 테스트 환경 전용 -->
    <div class="leftMenu">...</div>
  </div>

  <div class="pt-perspective">
    <div id="app-root" class="pt-page pt-page-current">
      <!-- 업무 페이지가 여기에 삽입됨 -->
    </div>
  </div>
</body>
```

```text
❌ .pt-perspective / .pt-page / browser shell DOM 을 업무 코드에서 제거하지 마라.
```

---

## 4. 파일 구성

```text
mnPensionAgentDemo.html   ← 화면 구조만 얇게
pensionAgentDemo.css      ← <link> 로 로드
pensionAgentDemo.js       ← 한 파일 유지
```

HTML head (현재 `frontend/app/mnPensionAgentDemo.html`):

```html
<link rel="stylesheet" href="/mnbank/app/css/bfe/pension/pensionAgentDemo.css">
<script id="PENSION_AGENT_DEMO" src="/mnbank/app/js/bfe/pension/pensionAgentDemo.js"></script>
```

> `frontend/app/local_preview.html` 은 **로컬 확인 전용**으로 상대경로를 쓴다.
> `mnPensionAgentDemo.html` 을 로컬에서 그냥 열면 `/mnbank/...` 절대경로 때문에 CSS/JS가 안 뜬다.

---

## 5. `PG_<파일코드>` 라이프사이클

```text
beforeBinding()
onParam()           ← 초기화
onGoback()
onBeforeUnload()    ← 정리
```

현재 구현 (`frontend/app/pensionAgentDemo.js:1694-1705`):

```javascript
var STARROOT_FILE_CODE = 'REPLACE_WITH_FILE_CODE';   // ← 실제 파일코드로 교체 필요

window['PG_' + STARROOT_FILE_CODE] = new (function () {
  this.beforeBinding  = function () {};
  this.onParam        = function (params) { window.__PensionVanilla.init(params || {}); };
  this.onGoback       = function () {};
  this.onBeforeUnload = function () { window.__PensionVanilla.destroy(); };
})();
```

> ⚠️ `STARROOT_FILE_CODE` 가 아직 `'REPLACE_WITH_FILE_CODE'` 다. 실제 배포 전에 교체해야 한다.

### ⚠️ bracket notation을 반드시 쓴다

```javascript
window.1234567 = ...                    // ❌ SyntaxError: Unexpected number
window['PG_' + STARROOT_FILE_CODE]      // ✅
```

### ⚠️ `DOMContentLoaded` 로 초기화하지 마라

```text
Shell document 의 DOMContentLoaded
    ↓
이미 완료됨
    ↓
그 후에 업무 HTML이 SPA로 동적 삽입됨
```

→ 초기화는 `onParam()`, 정리는 `onBeforeUnload()`.

---

## 6. CSS namespace 원칙

Starroot Shell과 **같은 document를 공유**하므로 전역 스타일은 공통 UI를 깨뜨린다.

```css
/* ❌ 절대 금지 */
* { box-sizing: border-box; }
body { margin: 0; background: #fff; }
button { font-family: ...; }
```

```css
/* ✅ 업무 root 하위로 제한 */
#pensionAgentDemo { min-height: 100vh; }
#pensionAgentDemo *,
#pensionAgentDemo *::before,
#pensionAgentDemo *::after { box-sizing: border-box; }
#pensionAgentDemo button { ... }
#pensionAgentDemo input { ... }
```

> 현재 `frontend/app/pensionAgentDemo.css` 는 이 원칙을 지키고 있다
> (전역 selector 0개, `#pensionAgentDemo` 접두 규칙 333개).
> **CSS를 추가할 때 이 상태를 깨지 마라.**

---

## 7. 공통 리소스는 필수가 아니다

기존 업무 화면에 있다고 해서 복사하지 마라. 아래 없이도 정상 구동이 확인됐다.

```text
assets.css
common_ui_init.js
container_mnbank.js
```

이들은 SPA 엔진이 아니라 **개별 업무 페이지의 dependency** 다.
Starroot 핵심 로더는 `spa_base.js` 쪽이다. 실제로 필요할 때만 import한다.

---

## 8. 상태 / 렌더 / 이벤트 구조

현재 `frontend/app/pensionAgentDemo.js` 는 경량 `Component` + `renderVals()` + 템플릿 보간 구조다.

```text
Component (pensionAgentDemo.js:361)
    ↓ this.state / setState
renderVals()
    ↓ 템플릿 보간
mount.replaceChildren(frag)   (pensionAgentDemo.js:256)
    ↓
DOM
```

이벤트는 root delegation을 권장한다.

```javascript
function handleClick(e) {
  var el = e.target.closest('[data-action]');
  if (!el) return;
  switch (el.dataset.action) { /* ... */ }
}
root.addEventListener('click', handleClick);     // init
root.removeEventListener('click', handleClick);  // destroy
```

---

## 9. ★ 전체 DOM 재렌더링 주의

**포팅 과정에서 가장 중요한 버그였다.**
state 변경마다 `mount.replaceChildren(newFragment)` 로 화면 전체를 다시 만들면:

```text
스크롤 위치 초기화
input focus 유실
caret 위치 유실
CSS animation 재실행
AI streaming 시 화면 흔들림
scrollbar 생성/제거에 따른 layout jump
```

특히 이런 상황에서 두드러졌다:

```text
운용 현황 자세히 토글
실시간 상담 메시지 streaming
AI가 생각하는 문구 출력
AI 분석/솔루션 영역 동시 표시
```

### 권장 순서

1. **가능하면 변경되는 작은 영역만 갱신한다.** (가장 좋음)
2. 전체 렌더를 유지해야 한다면 아래 상태를 반드시 보존한다.

```text
scrollTop / scrollLeft
document scroll
input focus
selectionStart / selectionEnd
기존 animation 재실행 여부
```

> 현재 코드는 2번 방식을 쓰고 있다.
> `frontend/app/pensionAgentDemo.js` 의 `restoreRenderUiState()` (스크롤/포커스/caret 복원, :164-191)
> 와 `suppressReplayEntryAnimations()` (:255) 가 그 역할이다.
> **렌더 경로를 수정할 때 이 두 함수를 우회하지 마라.**

---

## 10. 스크롤 영역 안정화

독립 스크롤 영역에는 식별자를 준다.

```html
<div data-scroll-key="briefing-main" style="overflow-y:auto"></div>
<div data-scroll-key="agent-chat"    style="overflow-y:auto"></div>
```

```css
#pensionAgentDemo [data-scroll-key] {
  scrollbar-gutter: stable;      /* 스크롤바 유무에 따른 폭 흔들림 완화 */
  overscroll-behavior: contain;
}
```

렌더 전후로 `scrollTop` 을 저장/복원한다 (현재 `restoreRenderUiState` 가 처리).

---

## 11. Streaming UI

너무 짧은 주기로 전체 render를 반복하면 화면이 불안정해진다.

```text
26ms × 2글자   →   40ms × 3글자
```

로 빈도를 줄여 안정성을 높인 이력이 있다.
가능하면 최종적으로는 **해당 메시지 text node만 갱신**하는 것이 가장 좋다.

실제 Agent 연동 후에는 streaming 단위가 LLM/Fabrix chunk가 되므로,
**chunk 도착마다 전체 render를 호출하지 않도록** 주의한다.

---

## 12. CSS Animation 재실행

전체 DOM 재생성 시 `animation: msgIn ...` 같은 entry animation이 매번 다시 시작된다.
이게 "AI 분석 솔루션 화면이 같이 흔들린다"의 주요 원인이었다.

```text
✅ 최초 mount 시에만 entry animation
❌ 이미 표시 중인 요소의 animation 재실행
❌ streaming 중 layout-affecting animation
```

---

## 13. 상단 Header 오프셋 / 높이

브라우저 테스트 환경에는 실제 앱에 없는 `.browserHeader.on` 이 있고 업무 화면을 덮을 수 있다.
고정 padding 대신 **실제 겹치는 높이를 계산**한다.

```javascript
var overlap = Math.max(0, Math.ceil(headerRect.bottom - rootRect.top));
root.style.setProperty('--starroot-top-offset', overlap + 'px');
```

```css
#pensionAgentDemo { padding-top: var(--starroot-top-offset, 0px); }
```

실제 앱에 `.browserHeader.on` 이 없으면 `0px` 로 유지된다.
(현재 구현: `frontend/app/pensionAgentDemo.js:289-300`, 정리는 `:352`)

높이는 무조건 `100vh` 를 쓰지 말고 shell 영역을 고려한다.

```css
height: calc(100vh - 44px - var(--starroot-top-offset, 0px));
```

---

## 14. 폰트

Standalone mock의 자체 font asset은 포팅 시 제거했다.
`font-family: inherit` 만 쓰면 Starroot 공통 설정을 예기치 않게 상속한다.
특히 `input::placeholder` 에서 글자가 깨져 보이는 현상이 확인됐다.

```css
#pensionAgentDemo input {
  font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
}
#pensionAgentDemo input::placeholder {
  font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
  font-weight: 400;
  letter-spacing: -0.02em;
  opacity: 1;
}
```

> 전체 화면 font는 사내 디자인 가이드에 맞춰 최종 확인 필요.

---

## 15. 반입 금지 산출물

Standalone mock이 이런 구조라고 해서 그대로 가져오면 안 된다.

```text
Bundler loader / manifest / Blob URL
embedded fonts / base64 images
React / ReactDOM / custom runtime
외부 CDN
```

포팅 시 실제로 제거한 항목이다. 필요한 UI/데이터/동작만 Vanilla로 옮긴다.

---

## 16. 디버깅 체크리스트

```text
1) Network
   업무 HTML / CSS / JS 가 200 인가
   → JS가 Script가 아니라 XHR로 보이는 것은 Starroot loader 특성이며 오류가 아니다

2) PG 객체
   window.PG_<파일코드>          가 존재하는가

3) 업무 객체
   window.__PensionVanilla        가 존재하는가
   window.PensionAgentDemoInstance 가 존재하는가  (:333)

4) onParam 진입
   console.log('[PensionAgentDemo] init', params)

5) CSS 충돌
   Elements → Computed 에서 font-family / position / top / height / overflow / display

6) Shell DOM
   document.querySelector('.browserHeader')
   document.querySelector('.pt-perspective')
   document.querySelector('.pt-page-current')
```

---

## 17. DO / DON'T

### DO
- Starroot를 SPA Shell 내부 동적 페이지로 이해할 것
- 초기화는 `PG_xxx.onParam()`, 정리는 `onBeforeUnload()`
- CSS를 `#pensionAgentDemo` namespace 아래로 제한할 것
- state / render / event / lifecycle을 분리할 것
- streaming 시 작은 DOM만 갱신하는 것을 우선할 것
- 타이머와 이벤트는 destroy 시 해제할 것 (`componentWillUnmount`, :368)
- 공통 리소스는 실제 필요할 때만 import할 것

### DON'T
- React를 기본 전제로 하지 말 것
- `DOMContentLoaded` 에 초기화를 의존하지 말 것
- `body` / `html` / `*` / `button` / `input` 에 전역 CSS를 적용하지 말 것
- `common_ui_init.js` / `assets.css` / `container_mnbank.js` 를 이유 없이 복사하지 말 것
- shell DOM을 업무 코드에서 제거하지 말 것
- state 변경마다 전체 DOM을 무조건 교체하지 말 것
- CDN / 외부 runtime에 의존하지 말 것
- Bundler standalone 산출물을 그대로 넣지 말 것

---

## 18. 페이지별로 아직 확인이 필요한 것

```text
실제 Native App WebView 에서의 viewport / header 차이
clipboard 동작
window.open() 동작
특정 deep-link scheme 동작
업무 페이지별 공통 CSS 충돌
input / placeholder 의 최종 사내 표준 font
```
