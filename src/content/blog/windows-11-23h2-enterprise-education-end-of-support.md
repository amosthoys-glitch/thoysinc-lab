---
title: 'Windows 11 23H2 Enterprise·Education 지원 종료 — 11월 11일에 끝났어요, 버전부터 확인하세요'
description: 'Windows 11 23H2 Enterprise와 Education 판의 지원이 2026년 11월 11일에 끝났어요. 지금 어떤 버전이 언제까지 지원되는지 표로 정리하고, 우리 PC가 몇 버전인지 확인하는 방법을 적었어요.'
pubDate: 'Nov 15 2026'
lang: 'ko'
translation: 'en/windows-11-23h2-enterprise-education-end-of-support'
tags: ['windows-11', 'end-of-support', 'hot-issue', 'patching', 'enterprise', 'lifecycle']
---

> 기준: Microsoft Lifecycle 문서(2026년 11월 15일 확인) · 출처는 글 끝에 있어요
>
> 대상: Windows 11 Enterprise, Education, Enterprise multi-session

**바쁘면 이것만:** Windows 11 **23H2 Enterprise·Education**의 지원이 **2026년 11월 11일**에 끝났어요. 아직 23H2인 PC가 있다면 **24H2 이상**으로 올려야 해요. Home·Pro는 23H2가 **2025년 11월 12일**에 먼저 끝났고, 지금은 **24H2도 2026년 10월 14일에 끝난 상태**예요.

## 무슨 일인가요

Microsoft Lifecycle 문서에 따르면 Windows 11 Enterprise and Education은 Modern Lifecycle Policy를 따라요. 이 정책에서는 버전마다 지원 기간이 정해져 있고, 23H2의 종료일이 **Nov 11, 2026**이에요(시간은 미국 태평양 시간 기준). 이미 지난 날짜라서, 아직 23H2를 쓰는 PC는 지원 대상이 아니에요.

## 지금 지원되는 버전

Enterprise·Education 기준이에요.

| 버전 | 시작 | 종료 |
|---|---|---|
| 26H2 | 2026-09-29 | 2029-10-09 |
| 26H1 | 2026-02-10 | 2029-03-14 |
| 25H2 | 2025-09-30 | 2028-10-11 |
| 24H2 | 2024-10-01 | **2027-10-13** |
| 23H2 | 2023-10-31 | **2026-11-11 (종료)** |
| 22H2 | 2022-09-20 | 2025-10-15 (종료) |

Home·Pro는 기간이 짧아요. 같은 문서 기준으로 **25H2는 2027-10-13**, **24H2는 2026-10-14**에 끝나요. 같은 번호의 버전이라도 판에 따라 종료일이 다르니, 판부터 확인해야 해요.

## 우리 PC가 몇 버전인지 보는 방법

- **Settings → System → About**의 "Windows specifications"에서 Version을 봐요
- 실행 창(Win+R)에 `winver`를 입력해도 같은 정보가 나와요
- 여러 대를 한 번에 볼 때는 PowerShell에서 아래 명령을 써요

```powershell
(Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion').DisplayVersion
```

관리 도구(Intune, 자산 관리 도구 등)를 쓴다면 거기서 버전별로 대수를 뽑아 보는 게 빨라요.

## 이번 주 할 일

- [ ] 23H2로 남아 있는 PC가 몇 대인지 뽑아요
- [ ] 24H2 이상으로 올릴 순서를 정해요. 업무 영향이 적은 PC로 먼저 시험해요
- [ ] 24H2는 Enterprise·Education 기준 **2027-10-13**까지예요. 올리는 김에 25H2나 26H2로 갈지 같이 정해요
- [ ] Home·Pro가 섞여 있다면 **24H2는 이미 끝났다**는 점을 기억해요

## 운영자 한마디

비즈니스에서 Home과 Pro를 섞어 쓴다면, 가능한 한 Home을 Pro로 바꾸는 게 관리 차원에서도 좋다고 생각해요.

## 출처

- [Microsoft Lifecycle, Windows 11 Enterprise and Education](https://learn.microsoft.com/en-us/lifecycle/products/windows-11-enterprise-and-education)
- [Microsoft Lifecycle, Windows 11 Home and Pro](https://learn.microsoft.com/en-us/lifecycle/products/windows-11-home-and-pro)
