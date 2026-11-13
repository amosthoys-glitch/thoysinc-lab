# IT 블로그 (blog.thoysinc.com) — 작업 규칙

PC, 웹(claude.ai/code), 휴대폰 어디서 작업하든 이 규칙을 따릅니다.

- 사용자(Amos Jung)에게는 항상 **한국어**로 답합니다. 화면·버튼·파일 이름만 영어로 둡니다.
- 글은 `src/content/blog/`. 헬프데스크 실무자의 목소리로, 사용자가 직접 겪었다고 말한 일만 경험담으로 씁니다. 개인 의견이며 회사(ATEC) 입장이 아닙니다.
- 회사·제품 이름은 영어 그대로 씁니다(Windows, Microsoft 365, TP-Link). 얼굴이 보이는 사진은 쓰지 않습니다.
- 한국어 본문은 **해요체**, 사용자의 말투(결론 먼저 → 짧은 이유 → 직접 겪은 일)로 씁니다. 사용자가 보낸 말은 뜻은 그대로, 맞춤법·문법만 다듬습니다. 영어판(`en/`)은 그 한국어를 자연스러운 영어로 옮깁니다(2026-11-13 사용자 결정). 핫이슈 글에는 `## 운영자 한마디`를 사용자 본인의 말로만 넣습니다.
- 새 글에는 내용에 어울리는 아마존 링크(`tag=thoysinc-20`, `rel="sponsored noopener"`, 첫 링크 전 제휴 고지)를 넣습니다. 어울리는 상품이 없으면 넣지 않고 알립니다.
- 새 글은 초안으로 보여 주고 사용자가 **"공개"라고 답한 뒤에만** `main`에 푸시합니다. 푸시하면 Azure 배포 후 IndexNow(Bing·Naver)에 자동 제출됩니다.
- Google Analytics: G-QT3J6F0WE0 (`src/components/BaseHead.astro`, thoysinc.com 주소에서만 켜짐). 애드센스 설정은 `src/data/adsense.ts`.

---

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
