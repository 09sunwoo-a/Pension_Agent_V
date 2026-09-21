# 부점 Agent 로컬 검증

공통 업무 로직은 `../deploy/`에 있으며 이 폴더는 검사·Google 호출기·localhost 브리지만 제공한다. 사내 이미지에 이 폴더를 반입하지 않는다. 현재03 실제 데이터와02 remote transport를 사용한다. 검사 결과는 [05](../../docs/handover/branch-agent/05-GOLDEN.md), 사내 반입은 [내일 안내](../../BRANCH_AGENT_DEPLOY_TOMORROW.md)를 따른다.

## 로컬 패키지 준비

저장소 루트에서 실행한다. 기존 venv가 있으면 재생성하지 않는다. 이번 로컬 환경은 Python3.13이며 사내 Python3.10 이미지 실행 결과와 구분한다.

```sh
cd /Users/leesunwoo/Desktop/Pension_Agent_V
python3 -m venv branch-agent/validation/.venv
branch-agent/validation/.venv/bin/python -m pip install --index-url https://pypi.org/simple -r branch-agent/deploy/requirements.txt
branch-agent/validation/.venv/bin/python -m pip check
```

공개 PyPI 설치는 사용자가 승인한 로컬 검증 전용이다. deploy Docker는 계속 사내 Nexus를 사용한다. Google 호출기는 표준 라이브러리 REST 구현이므로 Google SDK 설치가 필요 없다. venv와 `.local-results/`는 Git에서 제외된다.

## 실제 Google 모델과 프론트 시작·종료

**서버 환경변수 `GEMINI_API_KEY`가 설정된 터미널**에서 다음 명령을 실행한다. 키는 서버만 읽는다. 프론트 설정·명령 인수·문서·로그에 키 값을 넣지 않는다.

```sh
node tools/briefing/build.js
branch-agent/validation/.venv/bin/python -B branch-agent/validation/local_server.py --port 8766
```

브라우저에서 **http://127.0.0.1:8766/** 를 연다. 이 명령 하나가 프론트 HTML/JS/CSS, Starroot 초기화 하네스, `/health`, `/chat`, FabriX 형식의 POST 브리지를 제공한다. 기존 프론트의 remote transport가 `contents[0]`을 보내며 브리지는 같은 서비스의 응답 포장만 변환한다. 로컬 JS 규칙 엔진·저장된 답변으로 대체하지 않는다. 모델은 `gemma-4-31b-it`이다.

종료는 **서버를 시작한 터미널에서 Ctrl+C**다. 이미 실행 중이면 같은 포트에 중복 실행하지 않는다. 다른 포트는 `--port`로 지정하며 접속 주소도 맞춘다. 서버는127.0.0.1에만 바인딩한다. `/validation/status`는 제공처·모델·호출 수·안전한 오류 코드·문장 대체 횟수만 반환한다.

별도 정적 화면만 보려면 `node tools/briefing/build.js --preview` → http://127.0.0.1:8765/ 를 사용하며 종료는 Ctrl+C다. **8765는 실제 Google 연결 서버가 아니다.**

## 검사 명령

```sh
node tools/briefing/build.js
node tools/briefing/check.js
PYTHON=branch-agent/validation/.venv/bin/python node tools/briefing/check.js --agent
node branch-agent/validation/run.js
```

`run.js`는 데이터·계약·프론트 전송·36개 stub 서비스 골든·실제 localhost HTTP/SSE 검사를 실행한다. HTTP runner는 임시 포트/프로세스를 만들고 종료하며 포트 바인딩 허용이 필요하다. FastAPI 미설치/기동 실패를 PASS로 처리하지 않는다.

기존 `check.js --agent`는 `PYTHON`으로 interpreter를 선택한다. 위 venv를 지정하면 기존 고정31건 Agent의 FastAPI ASGI 검사도 실행된다. **ASGI 검사와 실제 TCP HTTP 검사는 별개**이며 신규 부점의 실제 기동은 `check_http.py`가 검사한다.

Google 실제 검사는 명시적으로 실행한다. 서버/브라우저 live 검사와 동시에 실행하면 같은 키의 quota를 공유하므로 순서대로 진행한다.

```sh
branch-agent/validation/.venv/bin/python -B branch-agent/validation/run_live.py --pace 10
```

기본은36개×3회이며 두 번째는 금액 표기, 세 번째는 일부 동의어 변형이다. Google429/접근 제한이면 실행 수·FAIL·SKIP을 그대로 기록하고 다른 모델이나 stub으로 전환하지 않는다. `--repeats 1`은36개 한 번의 부분 검사로,108회 완료를 뜻하지 않는다. `--diagnose R-05`는 선행 State를 stub 서비스로 준비한 단일 해석 진단이므로 전체 live PASS 근거로 쓰지 않는다.

브라우저 live 검사에는 별도 테스트 Chrome과 Node22 이상이 필요하다. 사용자 기본 Chrome 프로필과 다른 임시 프로필을 쓴다.

```sh
'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' --headless=new --disable-gpu --no-first-run --no-default-browser-check --remote-debugging-address=127.0.0.1 --remote-debugging-port=9229 --user-data-dir=/private/tmp/pension-branch-live-validation about:blank
```

위 Chrome과8766 서버를 켠 상태에서 별도 터미널에서 실행한다.

```sh
node branch-agent/validation/check_live_ui.js
```

포트가 다르면 `BRANCH_LOCAL_PORT`/`BRANCH_CDP_PORT` 환경변수로 지정한다. Chrome 종료는 시작한 터미널에서 Ctrl+C다. 이미 사용하는 디버깅 포트/프로필에 두 번째 Chrome을 띄우지 않는다. live UI runner는 테스트 페이지를 열고 기존 카드·상단 보존, keep DOM, 실제 응답 ID/금액, 취소/재시도·새 대화·재진입을 검사한다.

## 검사 파일과 결과 구분

| 파일 | 역할 |
|---|---|
| `scenarios.json` | 검토해 고정한36개 기대값. Agent 출력으로 정답을 재생성하지 않음 |
| `check_service.py` | deploy 서비스·실제 데이터에 해석/문장 stub을 주입, 경계·상태·추천·실패 검사 |
| `check_http.py` | 실제 서버/소켓 SSE, timeout·abort·늦은 worker·재시도, Docker COPY 파일만의 기동, FabriX 브리지 |
| `google_client.py` | 동일 call 시그니처, 서버 키/role/timeout/토큰·비추론 텍스트 추출 |
| `local_server.py` | same-origin 정적 프론트·하네스·응답 포장 변환 |
| `run_live.py` / `check_live_ui.js` | 실제 Google 해석/응답, 실제 remote 브라우저 |
| `check_data.js` / `check_data.py` |03 생성물·manifest·ID/집계/해시 검증 |
| `check_contract.js` / `check_contract.py` |125개 Python/JS 교차 사례+outer4개·schema freshness·SSE·Docker 정적 검사 |
| `check_frontend.js` / `check_frontend_browser.js` |02 가짜 SSE 기반 remote transport/UI 검사 |
| `contract.examples.json` / `export_schema.py` | 계약 전용 샘플, 기존 Pydantic 모델의 schema export |

실제 live 결과는 `.local-results/`에 ID·안전한 코드·소요·토큰 수·문장 대체 여부만 저장한다. 질문/응답 원문·고객 자료·Secret은 로그에 저장하지 않는다. Google quota로 중단된 이력과 해석 실패를 기록하며 최종 결과와 구분한다. 로컬 PASS는 사내 이미지·Nexus·Connector/Starroot E2E PASS가 아니다.
