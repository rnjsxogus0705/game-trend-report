# 섹션 이미지 생성 증거

2026-11-14 이후 호는 섹션별 `candidate.sectionVisual.image`에 실제 `image_gen` 작업 기록을 연결한다. 이미지를 만들고 원본과 배포용 파일을 보관한 뒤, 비공개 작업 원장에 생성 프롬프트, 실제 생성 시각, 원본 SHA-256, 최종 파일 SHA-256을 기록한다. 실행 결과에서 확인할 수 없는 사실은 추정하지 않는다. 도구 출력에는 토큰이나 개인정보를 보관하지 않는다.

아래는 필드 형식 예시다. 실제 실행에서는 해당 호의 경로와 계산한 해시로 바꾸며, 예시를 성공 증거로 사용하지 않는다.

```json
{
  "generator": "image_gen",
  "generatedAt": "2026-11-14T09:30:00+09:00",
  "prompt": "해당 섹션의 핵심을 한국어로 정리한 이미지 생성 요청",
  "originalPath": "_workspace/harness/weekly-game-report/RUN/evidence/games-original.png",
  "originalSha256": "<원본 파일의 SHA-256>",
  "outputSha256": "<본문에 삽입한 최종 이미지 파일의 SHA-256>",
  "toolEvidencePath": "_workspace/harness/weekly-game-report/RUN/evidence/games-image-tool-output.json",
  "toolEvidenceSha256": "<실제 도구 실행 증거 파일의 SHA-256>"
}
```

이 JSON을 저장한 뒤 해당 파일의 SHA-256을 계산해 섹션 packet에 기록한다.

```json
{
  "candidate": {
    "sectionVisual": {
      "title": "섹션 핵심",
      "points": ["첫 번째 핵심", "두 번째 핵심"],
      "image": {
        "src": "../assets/report/games.webp",
        "alt": "이미지 내용을 설명하는 대체 텍스트",
        "caption": "가상 예시",
        "width": 1200,
        "height": 800,
        "generationEvidence": {
          "path": "_workspace/harness/weekly-game-report/RUN/evidence/games-generation.json",
          "sha256": "<생성 기록 JSON의 SHA-256>"
        }
      }
    }
  }
}
```

`python3 workflows/report-ledger.py ... approve-section --kind ui ...`와 이후 승인 재사용 확인은 생성 기록·도구 증거 파일의 해시, 해당 섹션에 삽입된 최종 이미지의 바이트를 대조한다. 도구 증거의 진위, 프롬프트·시각·원본 해시는 자동 판별하지 않으므로 독립 검수자가 실제 도구 출력과 원본을 대조한다. 파일과 해시가 있다는 사실만으로 실제 도구 실행이 증명되는 것은 아니다. 변경 시 관련 UI 검수를 다시 수행한다.
