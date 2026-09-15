# Starroot 프론트엔드 코딩 가이드

> 목적: 다른 AI 또는 개발자가 KB 사내 Starroot 환경에서 업무 화면을 작성·포팅할 때, 일반적인 독립 웹페이지/React SPA를 전제로 잘못된 코드를 생성하지 않도록 현재까지 확인한 프론트 구조와 코딩 규칙을 정리한다.

---

## 1. 문서 범위

이 문서는 **프론트엔드 코딩에만 한정**한다.

포함 범위:
- Starroot SPA 환경에서 HTML/CSS/JavaScript가 로딩되는 방식
- 업무 페이지의 `PG_파일코드` 라이프사이클
- HTML/CSS/JS 파일 구성 원칙
- Vanilla JavaScript 기반 화면 구현 규칙
- 브라우저 테스트 환경 특성
- 포팅 중 확인된 주요 버그와 회피 방법
- 다른 AI가 코드 생성 시 따라야 할 DO / DON'T

제외 범위:
- 백엔드 Action/JSP 상세
- DB/Hadoop/Impala
- Agent 서버 구현
- LLM/Gemma/Azure 환경
- 배포/CM 프로세스

---

## 2. 환경 개요

Starroot는 일반적인 "HTML 한 장을 새 document로 여는 구조"가 아니다.

업무 화면은 Starroot SPA Shell 안에서 동적으로 로드된다.

개념적으로:

```text
Starroot SPA Shell
│
├─ spa_base.js
├─ SPA_COMMON
├─ kbstar / navi / 공통 객체
│
└─ 업무 페이지
    ├─ page.html
    ├─ page.css
    ├─ page.js
    └─ window.PG_<파일코드>
```

현재 확인된 핵심 SPA 엔진은:

```text
/mnbank/app/js/spa/spa_base.js
```

이다.

React는 이 환경의 기본 지원 구조가 아니므로, 현재 포팅 전략은 **HTML + CSS + Vanilla JavaScript**를 기준으로 한다.

---

## 3. Starroot 페이지 로딩 방식

`spa_base.js`를 기준으로 확인한 실제 흐름은 다음과 같다.

```text
loadPage(payload)
    ↓
pageRender(payload)
    ↓
jsCssfileImport(payload)
    ↓
payload.template_path의 HTML을 XHR GET
    ↓
HTML 문자열 분석
    ├─ <link> 추출
    ├─ <script src> 추출
    ├─ inline <script> 추출
    └─ <head> 제거
    ↓
업무 HTML을 .pt-page에 innerHTML로 주입
    ↓
참조 JS 실행
    ↓
inline JS 실행
    ↓
window 객체에서 PG_* 탐색
    ↓
beforeBinding()
    ↓
SPA_COMMON.docReady(payload)
    ↓
onParam()
```

중요한 점:
- 업무 HTML이 새로운 브라우저 document가 되는 것이 아니다.
- 이미 존재하는 SPA document 내부의 `.pt-page`에 화면 HTML이 삽입된다.
- 따라서 독립 페이지처럼 `body`, `html`, `DOMContentLoaded`를 전제로 코딩하면 문제가 생길 수 있다.

---

## 4. DOM 구조

브라우저 테스트 환경에서 확인된 상위 구조 예시:

```html
<body>
    <!-- 공통 브라우저 테스트 영역 -->
    <div>
        <div class="browserHeader on">...</div>
        <div class="leftMenu">...</div>
    </div>

    <div class="pt-perspective">
        <div id="app-root"
             class="pt-page pt-page-current">
            <!-- 업무 페이지가 이 안에 삽입됨 -->
        </div>
    </div>
</body>
```

업무 페이지는 `.pt-page` 내부 콘텐츠라고 생각하는 것이 안전하다.

---

## 5. 권장 파일 구성

```text
mnPensionAgentDemo.html
pensionAgentDemo.css
pensionAgentDemo.js
```

HTML은 화면 구조만 최대한 얇게 유지한다.

예:

```html
<!doctype html>
<html lang="ko">
<head>
    <meta charset="utf-8">
    <title>퇴직연금 AI 대시보드</title>

    <link
        rel="stylesheet"
        href="/mnbank/app/css/.../pensionAgentDemo.css"
    >

    <script
        id="PENSION_AGENT_DEMO"
        src="/mnbank/app/js/.../pensionAgentDemo.js">
    </script>
</head>

<body>

<div id="pensionAgentDemo">
    <section data-view="dashboard">
        ...
    </section>

    <section data-view="customer" hidden>
        ...
    </section>

    <section data-view="chat" hidden>
        ...
    </section>
</div>

</body>
</html>
```

### 주의

Starroot의 `jsCssfileImport()`는 업무 HTML을 문자열로 읽고 `<head>`를 제거한다.

따라서 `<head>` 내부의 inline `<style>`에 핵심 CSS를 넣는 방식은 권장하지 않는다.

```html
<style>
    ...
</style>
```

보다는:

```html
<link rel="stylesheet" href="/.../page.css">
```

형태가 안전하다.

---

## 6. CSS 작성 원칙

Starroot Shell과 동일 document를 공유하므로 전역 스타일을 피해야 한다.

### 피해야 하는 예

```css
* {
    box-sizing: border-box;
}

body {
    margin: 0;
    background: #fff;
}

button {
    font-family: ...;
}
```

이렇게 작성하면 Starroot header, toolbar, layer 등 공통 DOM까지 영향을 받을 수 있다.

### 권장

업무 화면 root를 하나 두고 모든 스타일을 namespace 처리한다.

```css
#pensionAgentDemo {
    min-height: 100vh;
}

#pensionAgentDemo *,
#pensionAgentDemo *::before,
#pensionAgentDemo *::after {
    box-sizing: border-box;
}

#pensionAgentDemo .customer-card {
    ...
}

#pensionAgentDemo button {
    ...
}

#pensionAgentDemo input {
    ...
}
```

원칙:

```text
CSS selector는 가능하면 항상
#업무Root ...
형태로 제한한다.
```

---

## 7. 공통 CSS/JS는 필수가 아니다

기존 업무 화면에 다음 리소스가 들어 있다고 해서 신규 화면에도 복사할 필요는 없다.

예:

```text
assets.css
common_ui_init.js
container_mnbank.js
asstmgtCommon.js
asstmgtConst.js
swiper.min.js
lottie.min.js
```

실제 테스트 결과, 신규 Vanilla 화면은 다음 리소스 없이도 Starroot에서 정상 구동되었다.

```text
assets.css
common_ui_init.js
container_mnbank.js
```

이들은 Starroot SPA 엔진 자체라기보다는 **개별 업무 페이지가 필요에 따라 import하는 dependency**로 보는 것이 적절하다.

Starroot 핵심 페이지 로더는 `spa_base.js` 쪽이다.

---

## 8. JavaScript 로딩 방식

상대경로 JavaScript는 일반 브라우저의 단순 `<script src>` 방식으로만 처리되는 것이 아니다.

Starroot는 참조 JS를 XHR로 가져온 뒤 문자열로 실행할 수 있다.

개념적으로:

```javascript
const scriptText = await httpClient(...);

(new Function(scriptText)).call();
```

실패 시 `globalEval()`을 사용할 수 있다.

### 영향

다른 파일에서 선언한 `const`, `let`이 자동으로 동일 scope에서 공유될 것이라고 가정하면 안 된다.

예:

```javascript
// a.js
const demoData = {...};

// b.js
console.log(demoData);
```

이 구조는 안전하지 않다.

공유가 필요하면:

```javascript
window.PensionDemoData = {...};
```

처럼 명시적으로 `window`에 올린다.

현재 데모 규모에서는 **업무 JS를 한 파일로 유지하는 방식**이 가장 단순하고 안전하다.

---

## 9. PG_파일코드 라이프사이클

Starroot는 JS 실행 후 `window` 객체에서 이름이 `PG_`로 시작하는 객체를 찾는다.

대표 라이프사이클:

```text
beforeBinding()
onParam()
onGoback()
onBeforeUnload()
```

권장 형태:

```javascript
(function () {

    function init(params) {
        ...
    }

    function destroy() {
        ...
    }

    var STARROOT_FILE_CODE = '1234567';

    window['PG_' + STARROOT_FILE_CODE] = new (function () {

        this.beforeBinding = function (params) {
        };

        this.onParam = function (params) {
            init(params || {});
        };

        this.onGoback = function () {
        };

        this.onBeforeUnload = function () {
            destroy();
        };

    })();

})();
```

### 왜 bracket notation을 권장하는가

잘못된 예:

```javascript
window.1234567 = ...
```

이는 JavaScript 문법 오류이며:

```text
Unexpected number
```

오류가 발생한다.

안전한 방법:

```javascript
window['PG_' + STARROOT_FILE_CODE]
```

---

## 10. 초기화는 DOMContentLoaded가 아니라 onParam

일반 standalone 페이지에서는:

```javascript
document.addEventListener('DOMContentLoaded', init);
```

를 많이 사용하지만 Starroot 업무 페이지에서는 적절하지 않다.

이유:

```text
Shell document의 DOMContentLoaded
    ↓
이미 완료됨
    ↓
그 후 업무 HTML이 SPA로 동적 삽입됨
```

따라서 업무 화면 초기화는:

```javascript
PG_xxx.onParam()
```

에서 시작한다.

예:

```javascript
this.onParam = function (params) {
    window.PensionAgentDemo.init(params || {});
};
```

페이지 이탈 시 정리는:

```javascript
this.onBeforeUnload = function () {
    window.PensionAgentDemo.destroy();
};
```

에서 처리한다.

---

## 11. 화면 상태 관리 권장 구조

React 상태관리 대신 단순한 JS 객체를 사용할 수 있다.

```javascript
const state = {
    view: 'dashboard',
    selectedCustomerId: null,
    selectedFilter: 'all',
    chatMessages: []
};
```

화면 구조는 크게 고정하고 필요한 부분만 갱신하는 것이 좋다.

```text
dashboard
customer briefing
chat
```

예:

```javascript
function showView(viewName) {

    state.view = viewName;

    document
        .querySelectorAll('#pensionAgentDemo [data-view]')
        .forEach(function (view) {
            view.hidden =
                view.dataset.view !== viewName;
        });
}
```

---

## 12. 이벤트 처리

버튼마다 이벤트를 개별 등록하기보다 root event delegation을 권장한다.

HTML:

```html
<button
    data-action="select-customer"
    data-customer-id="C001">
    고객 보기
</button>
```

JS:

```javascript
function handleClick(e) {

    var actionEl =
        e.target.closest('[data-action]');

    if (!actionEl) return;

    switch (actionEl.dataset.action) {

        case 'select-customer':
            openCustomer(
                actionEl.dataset.customerId
            );
            break;

        case 'open-chat':
            showView('chat');
            break;
    }
}
```

초기화:

```javascript
root.addEventListener('click', handleClick);
```

정리:

```javascript
root.removeEventListener('click', handleClick);
```

---

## 13. 전체 DOM 재렌더링 주의

현재 포팅 과정에서 가장 중요한 버그 중 하나였다.

Vanilla renderer가 state 변경 시:

```javascript
mount.replaceChildren(newFragment);
```

방식으로 화면 전체를 다시 만들면 다음 문제가 생길 수 있다.

```text
스크롤 위치 초기화
input focus 유실
caret 위치 유실
CSS animation 재실행
AI streaming 시 화면 흔들림
scrollbar 생성/제거에 따른 layout jump
```

특히 다음 상황에서 잘 나타났다.

```text
운용 현황 자세히 토글
실시간 상담 메시지 streaming
AI가 생각하는 문구 출력
AI 분석/솔루션 영역 동시 표시
```

### 권장 해결

가능하면 전체 화면이 아니라 변경되는 작은 영역만 갱신한다.

전체 렌더를 유지해야 한다면 다음 상태를 보존해야 한다.

```text
scrollTop / scrollLeft
document scroll
input focus
selectionStart / selectionEnd
기존 animation 재실행 여부
```

---

## 14. 스크롤 영역 안정화

독립 스크롤 영역에는 식별자를 부여하는 것이 좋다.

```html
<div
    data-scroll-key="briefing-main"
    style="overflow-y:auto">
</div>
```

```html
<div
    data-scroll-key="agent-chat"
    style="overflow-y:auto">
</div>
```

렌더 전:

```javascript
const scrollTop = el.scrollTop;
```

렌더 후:

```javascript
el.scrollTop = scrollTop;
```

CSS:

```css
#pensionAgentDemo [data-scroll-key] {
    scrollbar-gutter: stable;
    overscroll-behavior: contain;
}
```

`scrollbar-gutter: stable`은 스크롤바 유무에 따라 화면 폭이 흔들리는 현상을 줄이는 데 도움이 된다.

---

## 15. Streaming UI 구현 시 주의

AI 메시지를 streaming할 때 지나치게 짧은 주기로 전체 render를 반복하면 화면이 불안정해진다.

예:

```text
26ms마다 전체 DOM 재생성
```

보다:

```text
조금 더 긴 간격
+
한 번에 여러 글자 갱신
```

방식이 낫다.

현재 포팅에서는 대략:

```text
26ms × 2글자
→
40ms × 3글자
```

형태로 render 빈도를 줄여 화면 안정성을 높였다.

가능하면 최종 구조에서는 전체 화면이 아니라 **해당 메시지 text node만 갱신**하는 것이 가장 좋다.

---

## 16. CSS Animation 재실행 문제

전체 DOM을 다시 만들면:

```css
animation: msgIn ...
```

같은 입장 animation이 state 변경마다 다시 시작될 수 있다.

이 현상은 사용자가 "AI 분석 솔루션 화면이 같이 흔들린다"고 느끼게 만드는 주요 원인 중 하나였다.

해결 원칙:
- 최초 mount 시에만 entry animation 수행
- 이미 표시 중인 요소는 state update 시 animation 재실행 금지
- streaming 중에는 layout-affecting animation 최소화

---

## 17. Browser Test 환경 상단 Header

브라우저 테스트 환경에는 실제 앱과 다른 공통 UI가 존재한다.

확인된 DOM:

```html
<div class="browserHeader on">...</div>
<div class="leftMenu">...</div>
```

이 browser header가 업무 화면 위를 덮을 수 있다.

고정 padding을 무조건 적용하는 것보다 실제 겹치는 높이를 계산하는 방식이 안전하다.

예:

```javascript
function applyStarrootTopOffset() {

    var root =
        document.getElementById('pensionAgentDemo');

    var browserHeader =
        document.querySelector('.browserHeader.on');

    if (!root || !browserHeader) {
        return;
    }

    var rootRect =
        root.getBoundingClientRect();

    var headerRect =
        browserHeader.getBoundingClientRect();

    var overlap =
        Math.max(
            0,
            Math.ceil(
                headerRect.bottom -
                rootRect.top
            )
        );

    root.style.setProperty(
        '--starroot-top-offset',
        overlap + 'px'
    );
}
```

CSS:

```css
#pensionAgentDemo {
    padding-top:
        var(--starroot-top-offset, 0px);
}
```

실제 앱에서 `.browserHeader.on`이 없다면 offset은 `0px`로 유지하는 것이 좋다.

---

## 18. 높이 계산

Starroot Shell 내부에서 무조건:

```css
height: 100vh;
```

를 사용하면 브라우저 테스트 header와 합쳐져 불필요한 scroll이 생길 수 있다.

예:

```css
height:
    calc(
        100vh -
        44px -
        var(--starroot-top-offset, 0px)
    );
```

처럼 상위 shell 영역을 고려해야 할 수 있다.

화면마다 실제 Header 높이를 확인해서 적용한다.

---

## 19. 폰트 주의

Standalone mock에는 자체 font asset이 포함되어 있었으나 Starroot 포팅 시 제거했다.

따라서:

```css
font-family: inherit;
```

만 사용하는 경우 Starroot 공통 font 설정을 예상치 못하게 상속할 수 있다.

특히 `input::placeholder`에서 글자가 이상하게 보이는 현상이 확인되었다.

필요한 경우 업무 root 하위에서 명시적으로 설정한다.

예:

```css
#pensionAgentDemo input {
    font-family:
        'Malgun Gothic',
        'Apple SD Gothic Neo',
        sans-serif;
}

#pensionAgentDemo input::placeholder {
    font-family:
        'Malgun Gothic',
        'Apple SD Gothic Neo',
        sans-serif;
    font-weight: 400;
    letter-spacing: -0.02em;
    opacity: 1;
}
```

다만 전체 화면 font는 사내 디자인 가이드에 맞춰 최종 확인해야 한다.

---

## 20. 외부 CDN / 번들러 산출물

Standalone mock이 다음 구조라고 해서 그대로 반입하면 안 된다.

```text
Bundler loader
manifest
Blob URL
embedded fonts
base64 images
React
ReactDOM
custom runtime
```

Starroot에는 이 구조가 불필요하다.

실제 포팅 시 제거한 항목:

```text
Bundler loader
__bundler_thumbnail
__bundler_loading
manifest
Blob 생성 코드
embedded font assets
base64 screenshot assets
React
ReactDOM
DC runtime
```

필요한 UI/데이터/동작만 Vanilla 구조로 옮기는 것이 좋다.

---

## 21. 권장 JavaScript 구조

한 파일 안에서도 역할을 분리한다.

```javascript
(function () {

    // 1. DATA
    const MOCK_DATA = {};

    // 2. STATE
    const state = {};

    // 3. DOM
    let root = null;

    // 4. VIEW
    function showView() {}

    // 5. RENDER
    function renderDashboard() {}
    function renderCustomer() {}
    function renderChat() {}

    // 6. EVENT
    function handleClick() {}

    // 7. BUSINESS ACTION
    function openCustomer() {}

    // 8. INIT / DESTROY
    function init(params) {}
    function destroy() {}

    // 9. PUBLIC API
    window.PensionAgentDemo = {
        init: init,
        destroy: destroy
    };

    // 10. STARROOT ADAPTER
    var STARROOT_FILE_CODE =
        'REPLACE_WITH_FILE_CODE';

    window['PG_' + STARROOT_FILE_CODE] =
        new (function () {

            this.beforeBinding =
                function () {};

            this.onParam =
                function (params) {
                    init(params || {});
                };

            this.onGoback =
                function () {};

            this.onBeforeUnload =
                function () {
                    destroy();
                };
        })();

})();
```

---

## 22. 디버깅 체크리스트

화면이 뜨지 않을 때 순서대로 확인한다.

### 1) Network

다음 파일들이 200인지 확인:

```text
업무 HTML
업무 CSS
업무 JS
```

JS가 `Script`가 아니라 `XHR`로 보일 수 있다.

이는 Starroot loader의 동작 특성일 수 있으므로 자체적으로 오류가 아니다.

### 2) PG 객체

Console:

```javascript
window.PG_파일코드
```

객체가 존재해야 한다.

### 3) 업무 객체

예:

```javascript
window.PensionAgentDemo
```

또는:

```javascript
window.PensionAgentDemoInstance
```

확인.

### 4) onParam

```javascript
console.log(
    '[PensionAgentDemo] init',
    params
);
```

등으로 라이프사이클 진입 여부 확인.

### 5) CSS 충돌

Elements → Computed에서 다음을 확인:

```text
font-family
position
top
height
overflow
display
```

### 6) Shell DOM

```javascript
document.querySelector('.browserHeader')
document.querySelector('.pt-perspective')
document.querySelector('.pt-page-current')
```

확인.

---

## 23. 현재까지 실제로 확인된 사항

### ✅ 소스에서 확인

- `spa_base.js`가 페이지 HTML을 XHR로 가져온다.
- `<link>`를 추출해 CSS를 처리한다.
- `<script>`를 추출해 JS를 처리한다.
- `<head>`는 업무 page HTML에서 제거된다.
- 업무 HTML은 `.pt-page`에 `innerHTML`로 주입된다.
- 참조 JS 문자열은 `new Function(...).call()` 방식으로 실행될 수 있다.
- 실행 후 `window`에서 `PG_` prefix 객체를 탐색한다.
- `beforeBinding()` 이후 `SPA_COMMON.docReady()`가 수행된다.
- 그 이후 `onParam()`이 호출된다.
- 이전 페이지에서 `onBeforeUnload()`를 제공하면 호출된다.

### 🧪 실제 포팅 테스트에서 확인

- React 없이 Vanilla JS 업무 페이지가 정상 표시된다.
- `assets.css` 없이 동작 가능하다.
- `common_ui_init.js` 없이 동작 가능하다.
- `container_mnbank.js` 없이 동작 가능하다.
- `window.PG_파일코드`가 정상 생성되면 Starroot에서 화면 초기화가 가능하다.
- 파일코드를 잘못 `window.숫자` 형태로 쓰면 `Unexpected number` 오류가 발생한다.
- 브라우저 테스트용 `browserHeader`가 업무 화면을 덮을 수 있다.
- 전체 DOM rerender는 streaming/토글 중 화면 흔들림을 일으킬 수 있다.

### ⚠️ 페이지별 확인 필요

- 실제 Native App WebView에서의 viewport/header 차이
- clipboard 동작
- `window.open()` 동작
- 특정 deep-link scheme 동작
- 업무 페이지별 공통 CSS 충돌
- input/placeholder의 최종 사내 표준 font

---

## 24. 다른 AI를 위한 DO / DON'T

### DO

- Starroot를 SPA Shell 내부 동적 페이지로 이해할 것.
- 초기화는 `PG_xxx.onParam()`에서 할 것.
- 화면 이탈 정리는 `onBeforeUnload()`에서 할 것.
- CSS를 업무 root namespace 아래로 제한할 것.
- state / render / event / lifecycle을 분리할 것.
- streaming 시 작은 DOM만 갱신하는 것을 우선할 것.
- 타이머와 이벤트는 destroy 시 해제할 것.
- Starroot 공통 리소스는 실제 필요할 때만 import할 것.

### DON'T

- React 사용을 기본 전제로 하지 말 것.
- standalone HTML처럼 `DOMContentLoaded`에 초기화를 의존하지 말 것.
- `body`, `html`, `*`, `button`, `input`에 무분별한 전역 CSS를 적용하지 말 것.
- 기존 페이지의 `common_ui_init.js`, `assets.css`, `container_mnbank.js`를 이유 없이 복사하지 말 것.
- `.pt-perspective`, `.pt-page`, browser shell DOM을 업무 코드에서 제거하지 말 것.
- state 변경마다 전체 DOM을 무조건 교체하지 말 것.
- CDN/외부 runtime에 의존하지 말 것.
- Bundler standalone 산출물을 그대로 Starroot에 넣지 말 것.

---

## 25. 한 줄 요약

> **Starroot에서는 독립 웹앱을 새로 띄우는 것이 아니라, 이미 실행 중인 SPA Shell 안에 업무용 HTML/CSS/Vanilla JS 모듈을 삽입하고 `PG_파일코드` 라이프사이클로 초기화한다.**

이 전제를 지키면 포팅 과정에서 발생하는 대부분의 구조적 오류를 피할 수 있다.
