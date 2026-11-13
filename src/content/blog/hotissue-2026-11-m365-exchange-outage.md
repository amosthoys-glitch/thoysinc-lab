---
title: '[장애 속보] Microsoft 365 Exchange Online 장애 — 관리자가 지금 확인할 것'
description: '11월 12일 오후(미 동부 기준) Exchange Online을 중심으로 Outlook·Teams 등 Microsoft 365에 장애가 났습니다. Microsoft가 밝힌 원인과 복구 상황, 관리 센터가 안 열릴 때 상태 확인하는 곳, 복구 뒤 점검할 것을 정리했습니다.'
pubDate: 'Nov 12 2026'
lang: 'ko'
translation: 'en/hotissue-2026-11-m365-exchange-outage'
tags: ['microsoft-365', 'exchange-online', 'outage', 'hot-issue', 'outlook', 'teams']
---

> 기준: 2026년 11월 12일 · Microsoft 공식 상태 페이지(23:06 UTC 갱신)와 언론 보도 · 진행 중인 장애라 내용이 바뀔 수 있습니다
>
> 대상: Microsoft 365 Business·Enterprise를 쓰는 회사의 관리자

## 11월 13일 갱신 — 아직 "복구 중"

- **상태:** 11월 13일 12:30 UTC 기준으로 "복구 중(Recovering)"이고, 완전 해결 발표는 아직 없다고 보도됐습니다. 사건 번호는 Exchange Online이 **EX1550543**, Microsoft 365 전체 영향이 **MO1550821** 입니다. 시작 시각은 11월 12일 16:17 UTC입니다
- **원인 설명이 바뀌었습니다:** Microsoft는 영향받은 서버에서 **보안 연결을 맺는 프로세스가 과부하**에 걸려 요청을 처리하지 못했다고 설명했습니다. 장애 시작과 시점이 맞는 **최근 네트워크 구성 변경을 되돌리는 중**이라고도 했습니다. 다만 그 변경이 원인이라고 확정하지는 않았습니다
- **복구가 더뎠던 이유:** 서버를 다시 올려도 트래픽이 돌아오면 다시 응답하지 않는 일이 반복됐다고 합니다
- **공격 여부:** Microsoft는 악의적 활동이나 사이버 공격의 징후는 없다고 밝혔습니다
- **사후 보고서:** 조치가 끝나면 근본 원인과 재발 방지책을 담은 Post-Incident Report를 내겠다고 했습니다. 아직 나오지 않았습니다

지금 상태는 관리 센터 **서비스 상태**에서 EX1550543을 직접 확인하세요.

## 무슨 일인가

- 11월 12일 미 동부 시간 **오후 1시 조금 전**(애리조나 오전 11시 무렵)부터 Outlook이 안 된다는 신고가 쏟아졌습니다. CNBC는 Downdetector 신고가 **약 13만 건**이었다고 전했습니다
- Microsoft는 문제가 **주로 Exchange Online**에 있다고 밝혔습니다. 처음엔 미주 지역 사서함으로 보고됐다가, 이후 **어느 지역 사용자든** 연결에 영향이 있을 수 있다고 넓혔습니다
- **Teams**도 북미에서 따로 문제가 있었는데, Microsoft는 조치 뒤 "서비스 상태와 기능이 복구됐다"고 밝혔습니다
- Microsoft 공식 상태 페이지(status.cloud.microsoft)에는 23:06 UTC 기준 **"Users may be unable to connect to multiple Microsoft 365 services"**, 상태는 **서비스 저하(Service degradation)** 로 올라와 있습니다

## Microsoft가 밝힌 원인과 복구 상황

- 처음 설명은 "여러 지역에서 부하가 높아졌다"였습니다
- 이후 **트래픽이 늘어난 게 아니라**, 여러 서버가 **예기치 않게 쓸 수 없게 되면서** 남은 서버에 부하가 몰린 것이라고 정정했습니다. 서버 상태를 점검하는 구성 요소 쪽 문제로 서버들이 자동 상태 점검(health check)을 통과하지 못한 것으로 보고 있고, 장애 시작과 연결된 최근 변경은 아직 찾지 못했다고 했습니다
- 오후 4시(동부) 무렵에는 **다른 방식의 상태 점검**으로 일부 서버를 다시 서비스에 올렸고, 이 방법을 더 넓게 적용하는 중이라고 했습니다. 배포를 멈추고, 영향받은 인프라에서 트래픽을 돌리고, 서버를 재시작하는 조치도 함께 진행했습니다
- 이 글을 쓰는 시점까지 **완전 복구 발표는 없습니다**

## 관리자가 지금 할 것

1. **상태는 공식 페이지에서 확인합니다.** 이런 장애 때는 관리 센터 자체가 안 열릴 수 있습니다. Microsoft도 그래서 **status.cloud.microsoft** 에 정보를 올린다고 적어 두었습니다. 관리 센터가 열리면 **상태 → 서비스 상태(Service health)** 에서 사건 번호와 갱신 내용을 봅니다
2. **사용자 PC는 건드리지 않습니다.** 원인이 서버 쪽이니 Outlook 프로필을 새로 만들거나 Office를 다시 설치해도 해결되지 않고, 복구 뒤 일만 늘어납니다. 사용자에게는 "Microsoft 쪽 장애이고, 복구되면 자동으로 이어진다"고 한 번에 알리는 편이 낫습니다
3. **급한 연락은 다른 길로.** 메일이 막힌 동안 급한 건 전화나 다른 메신저로 처리하도록 안내합니다

## 복구된 뒤 확인할 것

- **메일 흐름:** Exchange 관리 센터의 **메시지 추적(Message trace)** 으로 장애 시간대 메일이 지연 후 배달됐는지, 반송(NDR)된 것은 없는지 봅니다. 거래처에서 "메일이 반송됐다"는 연락이 오면 이 시간대를 먼저 의심합니다
- **사용자 문의 정리:** 복구 뒤에도 안 되는 사용자는 Outlook을 완전히 껐다 켜 보게 하고, 그래도 안 될 때만 개별로 봅니다
- **사후 보고서:** 큰 장애 뒤에는 관리 센터 서비스 상태에 사건 보고서가 올라오는 경우가 많습니다. 원인과 재발 방지 내용을 확인해 두면 경영진 보고에 쓸 수 있습니다

장애가 완전히 풀리거나 Microsoft가 원인을 더 밝히면 이 글을 갱신하겠습니다.

## 운영자 한마디

장애가 나면 저는 일단 연결 상태부터 점검해요.

## 출처

- [SecurityWeek, Microsoft 365 Outage Disrupts Outlook, Exchange Online and Teams](https://www.securityweek.com/microsoft-365-outage-disrupts-outlook-exchange-online-and-teams/)
- [GeekWire, Microsoft 365 starts to recover after a day of global email turmoil](https://www.geekwire.com/2026/a-huge-pain-in-the-ass-microsoft-365-starts-to-recover-after-a-daylong-global-email-blackout/)
- [Microsoft service health status (status.cloud.microsoft, 2026-11-12 23:06 UTC 갱신)](https://status.cloud.microsoft/)
- [CNBC, Widespread Microsoft outage takes down Outlook and other 365 services (2026-11-12)](https://www.cnbc.com/2026/11/12/microsoft-outage-outlook-aws-google.html)
- [ABC News, Outlook outage: Microsoft reports 'issues' with Teams and email (2026-11-12)](https://abcnews.com/US/outlook-down-microsoft-outage-reported-mail/story?id=138088203)
