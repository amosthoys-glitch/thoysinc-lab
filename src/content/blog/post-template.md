---
title: '글 템플릿 (이 파일은 드래프트라 배포되지 않습니다)'
description: 'frontmatter 필드 사용법과 글 구조 참고용. npm run new 로 새 글을 만들면 이 형식으로 생성됩니다.'
pubDate: 'Aug 22 2026'
lang: 'ko'
tags: ['meta']
draft: true
---

> 환경: (OS 빌드 / 제품 버전을 여기 명시)

## frontmatter 필드

| 필드 | 필수 | 설명 |
|---|---|---|
| `title` | O | 글 제목 |
| `description` | O | 목록·검색결과·OG 태그에 쓰임. 한 문장. |
| `pubDate` | O | `'Aug 22 2026'` 형식 |
| `updatedDate` | | 본문을 고쳤을 때 추가 |
| `lang` | | `'ko'` (기본) 또는 `'en'` |
| `tags` | | 소문자 kebab-case 배열. 태그 페이지 자동 생성 |
| `draft` | | `true` 면 프로덕션 빌드에서 제외 (dev 서버에서는 보임) |
| `heroImage` | | `'../../assets/파일명.jpg'` |

## 글 구조 권장안

1. **환경 명시** — 버전 없는 트러블슈팅 글은 6개월 뒤 쓸모없어집니다
2. **증상** — 실제 에러 메시지 원문을 그대로
3. **원인**
4. **해결** — 붙여넣고 바로 돌아가는 명령
5. **왜 그런가** — 여기가 AI 요약이 못 채우는 부분

## 코드 블록

```powershell
Get-ADDomain | Select-Object DNSRoot, DomainMode
```

## 이미지

`src/assets/` 에 넣고 상대경로로 참조하면 Astro 가 자동 최적화합니다.
