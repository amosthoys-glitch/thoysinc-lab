# thoysinc

Windows 인프라 실무 기록 블로그. [Astro](https://astro.build) 정적 사이트.

## 빠른 시작

```bash
npm run dev      # http://localhost:4321 — 드래프트도 보임
npm run build    # dist/ 로 정적 빌드 — 드래프트 제외
npm run preview  # 빌드 결과 확인
npm run check    # 타입/컨텐츠 스키마 검사
```

## 새 글 쓰기

```bash
npm run new -- ad-first-dc "첫 도메인 컨트롤러 세우기" --tags active-directory,homelab
```

`src/content/blog/ad-first-dc.md` 가 `draft: true` 상태로 생성됩니다. 다 쓰면 그 줄을 지우고 커밋하세요.

옵션:

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `--lang ko\|en` | `ko` | 글 언어. 블로그 목록의 KO/EN 필터에 반영 |
| `--tags a,b,c` | 없음 | 소문자 kebab-case. 태그 페이지가 자동 생성됨 |
| `--mdx` | off | 컴포넌트를 쓸 글이면 `.mdx` 로 생성 |

frontmatter 전체 필드는 `src/content/blog/post-template.md` 참고 (드래프트라 배포되지 않음).

## 구조

```
src/
  consts.ts             사이트 제목, 저자, 소셜 링크, 도메인   ← 먼저 여기부터
  content.config.ts     글 frontmatter 스키마 (zod)
  content/blog/         글 (.md / .mdx)
  lib/posts.ts          글 조회 헬퍼 (드래프트 필터, 태그 집계)
  layouts/BlogPost.astro
  components/
  pages/
    index.astro         홈
    blog/index.astro    글 목록 + KO/EN 필터
    tags/               태그 인덱스 + 태그별 페이지 (자동 생성)
    about.astro
    rss.xml.js
scripts/new-post.mjs    새 글 생성기
```

## 배포 전 체크리스트

1. ~~도메인~~ — `blog.thoysinc.com` 으로 설정 완료 (`astro.config.mjs`, `src/consts.ts`, `public/robots.txt`)
2. **소셜 링크** — `src/consts.ts` 의 `SOCIAL` 을 실제 GitHub / LinkedIn 주소로 교체 (지금은 빈 껍데기)
3. **About 페이지** — `src/pages/about.astro` 내용 확인
4. `npm run build` 통과 확인

## 배포

`www.thoysinc.com` 이 이미 Azure Static Web Apps 에 있고 메일도 M365 라, 같은 Azure 에 붙이는 게 관리 지점이 하나로 유지됩니다. Free 티어로 충분합니다 (커스텀 도메인 + 관리형 TLS 인증서 포함).

### Azure Static Web Apps

1. 이 리포를 GitHub 에 push
2. Azure Portal → Static Web Apps → Create
   - Plan type: **Free**
   - Deployment: GitHub, 이 리포/브랜치 선택
   - Build Presets: **Custom**
   - App location: `/`
   - Api location: (비움)
   - Output location: `dist`
3. 생성하면 GitHub Actions 워크플로가 리포에 자동 커밋되고 첫 배포가 돌아갑니다
4. 커스텀 도메인 연결:
   - Portal 의 Custom domains → Add → `blog.thoysinc.com`
   - DNS 존(현재 www 의 CNAME 을 관리하는 곳)에 CNAME 추가:
     ```
     blog  CNAME  <생성된이름>.azurestaticapps.net
     ```
   - 검증 통과 후 TLS 인증서는 자동 발급·갱신됩니다

apex(`thoysinc.com`)는 지금 A 레코드가 없어 해석되지 않습니다. 블로그는 서브도메인이므로 건드릴 필요 없습니다.

### 대안

Cloudflare Pages / Netlify / Vercel 모두 동일하게 동작합니다. 빌드 커맨드 `npm run build`, 출력 디렉터리 `dist`.

## 언어 정책

지금은 단일 도메인에 KO/EN 글을 섞고 목록에서 필터링합니다. 한쪽 언어 글이 30편을 넘어가면 `/ko/`, `/en/` 경로 분리와 `hreflang` 도입을 검토하세요 (Astro i18n 라우팅).

## 글 쓰는 원칙

- 문서 요약·번역은 쓰지 않는다 (AI 요약이 이미 한다)
- 모든 트러블슈팅 글은 첫 줄에 환경(OS 빌드, 제품 버전)을 명시한다
- 스크립트는 붙여넣고 바로 돌아가는 상태로 올린다
- 실패한 시도도 남긴다 — 그게 검색으로 못 찾는 부분이다
- 틀린 게 확인되면 본문을 고치고 `updatedDate` 를 남긴다
