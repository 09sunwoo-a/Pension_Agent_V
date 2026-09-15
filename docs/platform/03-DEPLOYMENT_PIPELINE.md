# 03. 배포 파이프라인

> 2026-09-16 고정 브리핑 배포본은 `briefing.py`와 `briefing_data.json`도 `/custom`에 COPY합니다. 이 단계에서는 LLM/.env를 읽지 않으므로 Dockerfile의 필수 `.env` COPY를 제거했습니다. 아래 Dockerfile은 최초 검증 이력이며 현재 배포에는 [agent/Dockerfile](../../agent/Dockerfile)과 [루트 체크리스트](../../COMPANY_DEPLOY_CHECKLIST.md)를 사용합니다. 기존 사내 이미지·Nexus·진입점·Stage 인자는 유지합니다.

> 근거: `references/KB_GenAI_ProAgent_SourceOfTruth_v2.md` §2, §3, §16~§18
> 핵심: **배포의 시작점은 "코드 push"가 아니라 "git tag"** 다.

---

## 1. 전체 흐름

```text
code 수정
    ↓
git commit
    ↓
git push origin <branch>
    ↓
git tag v1.4
    ↓
git push origin v1.4          ← ★ 이걸 빼먹으면 배포가 실패한다
    ↓
GenAI Portal 에서 해당 tag 선택 후 배포
    ↓
Jenkins Pipeline
    ↓
Kaniko Docker Build
    ↓
사내 ACR push
    ↓
ArgoCD Application 생성/갱신
    ↓
Kubernetes Deployment rollout
    ↓
Health Check
    ↓
성공 또는 자동 rollback
```

---

## 2. ⚠️ tag는 remote에 반드시 push되어 있어야 한다

Portal에서 tag를 지정했는데 remote GitLab에 그 tag가 없으면
Jenkins checkout이 실패한다.

실제 발생한 오류:

```text
Couldn't find any revision to build
```

배포 전에 확인하라:

```bash
git ls-remote --tags origin
```

로컬에만 tag를 만들고 `git push origin <tag>` 를 빼먹는 것이
가장 흔한 배포 실패 원인이다.

---

## 3. 디렉터리 매핑 (이 저장소 ↔ 배포 repo ↔ 컨테이너)

**이 저장소는 정리용이고, 실제 배포 repo는 평면 구조다.** 헷갈리지 마라.

```text
이 저장소                  사내 GitLab 배포 repo         컨테이너
─────────────────────────────────────────────────────────────────
agent/Dockerfile      →    Dockerfile             →    (build 정의)
agent/main.py         →    main.py                →    /custom/main.py
agent/llm_client.py   →    llm_client.py          →    /custom/llm_client.py
agent/requirements.txt→    requirements.txt       →    /custom/requirements.txt
agent/.env.example    →    .env (실제 값)          →    /custom/.env
```

```text
WORKDIR    : /custom
entrypoint : uvicorn main:app --host 0.0.0.0 --port 8000
```

> `.env` 는 이 저장소에 **커밋하지 않는다.** 이름만 `agent/.env.example` 에 둔다.
> → [09-보안-시크릿.md](06-SECURITY.md)

---

## 4. Dockerfile (실제 검증된 구조)

```dockerfile
FROM cmheastggenaiacr01.azurecr.io/python:3.10

ARG ENV_FILE_PATH
ENV ENV_PATH=$ENV_FILE_PATH

WORKDIR /custom

COPY ./requirements.txt /custom/requirements.txt

RUN pip install --no-cache-dir \
    --index-url https://stg-nexus-genaihub.kbonecloud.com/repository/pypi/simple \
    --trusted-host stg-nexus-genaihub.kbonecloud.com \
    -r /custom/requirements.txt

COPY ./.env /custom/.env
COPY ./main.py /custom/main.py
COPY ./llm_client.py /custom/llm_client.py

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

핵심 제약:

| 항목 | 값 |
|---|---|
| Python | **3.10** |
| Base image | 사내 ACR (`cmheastggenaiacr01.azurecr.io/python:3.10`) |
| 패키지 저장소 | 사내 Nexus (외부 PyPI 아님) |
| WORKDIR | `/custom` |
| Entrypoint | `uvicorn main:app` |
| 스테이지 주입 | `ARG ENV_FILE_PATH` → `ENV ENV_PATH` |

**파일 단위 COPY** 라는 점을 반드시 기억하라. 새 `.py` 를 추가하면 `COPY` 줄도 추가한다.

---

## 5. Jenkins에서 실제로 일어나는 일

```text
 1. Jenkins Agent Pod 생성
 2. Agent source repository checkout (특정 Git tag)
 3. Kaniko로 Training image build
 4. 사내 ACR에 image push
 5. Serving Docker build job 실행
 6. ArgoCD source checkout
 7. Agent deployment YAML 생성
 8. ArgoCD Git repository에 YAML commit / push
 9. ArgoCD sync
10. Kubernetes Deployment rollout
11. Health Check
12. 성공 또는 자동 rollback
```

Training build 예:

```text
/kaniko/executor
  --context .
  --dockerfile ./Dockerfile
  --destination <ACR>/<agent-image>:training
  --build-arg ENV_FILE_PATH=training
  --cache=false
```

> `--build-arg ENV_FILE_PATH=training` 이 컨테이너의 `ENV_PATH` 가 되고,
> 그것이 `llm_client.py` 의 TRNN/SERV 분기를 결정한다.

---

## 6. ArgoCD / Kubernetes

Portal/Jenkins가 프로세스를 직접 띄우는 것이 아니다.

```text
Deployment YAML → ArgoCD → Kubernetes
```

상태 전이:

```text
Missing → Progressing → Healthy      (정상)
          Progressing → Degraded     (문제)
```

`Degraded` 로 가면 Health Check Timeout → 자동 rollback 으로 이어질 수 있다.

---

## 7. 배포 전 체크리스트

```text
[ ] 로컬에서 uvicorn main:app 이 뜨는가
[ ] /health 가 200을 주는가
[ ] 새로 추가한 .py 가 전부 Dockerfile COPY에 있는가
[ ] import가 평면 구조 기준인가 (app. 패키지 미사용)
[ ] requirements 변경이 있다면 사내 Nexus 설치 가능성을 검토했는가  → 07
[ ] git push origin <branch> 완료
[ ] git tag 생성 완료
[ ] git push origin <tag> 완료
[ ] git ls-remote --tags origin 으로 remote tag 확인
[ ] Portal에서 그 tag를 선택
```

## 8. 배포 후 확인

```text
[ ] Jenkins Pipeline 전 단계 성공
[ ] ACR에 image push 확인
[ ] ArgoCD Application이 Healthy
[ ] /health 응답 확인
[ ] Fabrix 경유 호출이 기존대로 동작       → 04
```

실패했을 때의 진단 순서는 [08-트러블슈팅.md](05-TROUBLESHOOTING.md).
