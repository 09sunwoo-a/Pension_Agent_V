# Sources

`sources/`는 개인형IRP 사후관리 Agent가 판단 근거를 탐색하기 위한 Source Corpus 영역이다.

## Usage Rules

1. Source Corpus 전체를 기본 Context로 읽지 않는다.
2. Case 작업에서는 먼저 `source_registry.md`를 사용하여 관련 Source 후보를 좁힌다.
3. 후보 Source가 선정되면 필요한 원문 및 Section만 직접 확인한다.
4. Source에 명시된 내용과 Agent의 추론을 구분한다.
5. Source에 없는 업무 Fact를 생성하지 않는다.
6. 서로 충돌하는 Source를 Agent가 임의로 통합하거나 해소하지 않는다.
7. 시점 의존 정보는 As-of를 확인한다.
8. 실제 판단에 사용하는 Knowledge는 원 Source와 Location까지 Trace 가능해야 한다.
9. Case에서 정제된 Knowledge는 Case-local `knowledge_pack.md`에 기록한다.
10. Source Corpus 자체를 Customer → Action Rule Base로 변환하지 않는다.

## Registry

`source_registry.md`는 Source Corpus 탐색을 위한 색인이다. Knowledge Base나 업무 정답지가 아니다.
