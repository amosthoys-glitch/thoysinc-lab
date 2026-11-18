---
title: '[보안 권고] Puppet 서버 원격 코드 실행(CVE-2026-115731) — 에이전트 인증서 하나면 뚫려요, 12월 1일까지'
description: 'Puppet Server의 리포트 처리 코드에서 Critical(9.4) 취약점이 나왔고, CISA가 11월 17일 실제 악용 목록(KEV)에 올렸어요. CA가 요청을 자동 서명하면 인증 없이도 공격할 수 있어요. 해당 버전과 고친 버전, 지금 확인할 것을 정리했어요.'
pubDate: 'Nov 17 2026'
lang: 'ko'
translation: 'en/hotissue-2026-11-puppet-server-report-rce'
tags: ['security', 'hot-issue', 'puppet', 'configuration-management', 'patching']
draft: false
---

> 기준: 2026년 11월 17일 CISA KEV 등재, Perforce 공지 · 출처는 글 끝에 있어요
>
> 대상: Puppet Enterprise, Puppet Core(오픈소스 Puppet Server)를 직접 운영하는 곳

<p><small>이 글에는 제휴 링크가 있으며, 구매 시 블로그가 수수료를 받을 수 있습니다(가격은 같습니다).</small></p>

**바쁘면 이것만:** Puppet을 쓰고 있다면 **Puppet Enterprise 2026.0.1 / 2025.12.1 / 2023.8.13**, 또는 **Puppet Core 9.1.3 / 8.22.2** 이상인지 지금 확인하세요. 그보다 낮으면 바로 올려야 해요. CISA가 **11월 17일** 실제 공격에 쓰이는 취약점 목록(KEV)에 올렸고, 연방 기관 조치 기한은 **12월 1일**이에요. CA가 인증서 요청을 **자동 서명(autosign)** 하게 해 두었다면 더 급해요.

## 무슨 일인가요

- **CVE-2026-115731** — 심각도 **Critical(CVSS 9.4)**
- Puppet Server의 **리포트 처리 코드**에 신뢰할 수 없는 데이터를 역직렬화하는 문제가 있어요
- **CA가 서명한 에이전트 인증서를 하나라도 가진 클라이언트**가 조작한 rich-data 타입을 담은 리포트를 PUT 요청으로 보내면, Puppet Server에서 **서비스 계정 권한으로 코드를 실행**할 수 있어요
- CA가 요청을 **강한 확인 없이 자동 서명**하는 환경이라면, **인증 없는 공격자도** 그런 인증서를 받아 낼 수 있어요
- Perforce는 **11월 3일** 수정 버전을 냈고, CISA가 **11월 17일** KEV에 올렸어요

Puppet 서버는 관리하는 모든 서버에 설정을 내려보내는 자리예요. 여기서 코드가 실행되면 그 아래 서버 전체로 이어질 수 있어요.

## 해당 버전과 고친 버전

| 제품 | 해당되는 버전 | 고친 버전 |
|---|---|---|
| Puppet Enterprise 2026 | 2026.0.0 ~ 2026.0.1 전 | **2026.0.1** (Puppet Core 9.1.3) |
| Puppet Enterprise 2025 | 2025.0.0 ~ 2025.12.1 전 | **2025.12.1** (Puppet Core 8.22.2) |
| Puppet Enterprise 2023.8 | 2023.8.0 ~ 2023.8.13 전 | **2023.8.13** (Puppet Core 8.22.2) |
| Puppet Core 9 | 9.0.0 ~ 9.1.3 전 | **9.1.3** |
| Puppet Core 8 | 8.x ~ 8.22.2 전 | **8.22.2** |

## 지금 확인할 것

1. **버전 확인** — Puppet Server(또는 Puppet Enterprise 주 서버) 버전을 위 표와 맞춰 보세요
2. **업그레이드** — 고친 버전보다 낮으면 바로 올려요
3. **자동 서명 설정 확인** — CA가 인증서 요청을 자동으로 서명하게 해 두었다면, 이번 취약점에서는 "인증서가 있어야 공격 가능"이라는 조건이 사라져요. 누가 요청하든 서명되는지, 검증 조건이 있는지 확인하세요
4. **이미 서명된 인증서 점검** — 모르는 이름의 에이전트 인증서가 서명돼 있지 않은지 CA 목록을 한 번 보세요
5. **접속 범위 줄이기** — Puppet Server 포트가 꼭 필요한 네트워크에만 열려 있는지 확인하세요

## 운영자 한마디

저는 GPO로 관리해요.

Windows 서버를 그룹 정책으로 관리하는 이야기는 [AD 홈랩 ⑥ 그룹 정책](/blog/adlab-06-group-policy/)에 적어 두었어요. 그룹 정책을 처음부터 정리하고 싶다면 <a href="https://www.amazon.com/s?k=windows+group+policy+book&tag=thoysinc-20" target="_blank" rel="sponsored noopener">Windows 그룹 정책 책</a>을 한 권 옆에 두는 것도 좋아요.

## 출처

- [Perforce, Report Deserialization Code Execution (CVE-2026-115731)](https://portal.perforce.com/s/cve/a91Qi000003IaHpIAK/report-deserialization-code-execution) — 해당·수정 버전, CVSS 9.4, 해결일 2026-11-03
- [CISA, Known Exploited Vulnerabilities Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) — 2026-11-17 등재, 조치 기한 2026-12-01
