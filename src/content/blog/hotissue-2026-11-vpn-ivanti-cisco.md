---
title: '[이번 주 보안] VPN 장비부터 보세요 — Ivanti Connect Secure 인증 우회 체인, Cisco ASA·FTD 원격 재부팅'
description: '10월 마지막 주 CISA가 "실제 공격 중" 목록에 올린 VPN 장비 취약점 두 건. 무엇이 문제인지, 우리 회사가 해당되는지 확인하는 법, 패치 뒤 AD 쪽에서 할 일까지 정리했습니다.'
pubDate: 'Nov 01 2026'
lang: 'ko'
translation: 'en/hotissue-2026-11-vpn-ivanti-cisco'
tags: ['security', 'hot-issue', 'vpn', 'ivanti', 'cisco', 'active-directory']
---

> 기준: 2026년 10월 26일 ~ 11월 1일 공개 정보 · 출처는 글 끝에 있습니다
>
> 대상: Ivanti Connect Secure, Cisco Secure Firewall ASA/FTD로 원격 접속 VPN을 운영하는 곳

이번 주는 VPN 장비 두 종류가 미국 사이버보안청(CISA)의 **"알려진 악용 취약점(KEV)" 목록**에 올랐습니다. KEV는 "이론상 위험"이 아니라 **실제 공격에 쓰이는 것이 확인된** 취약점만 올리는 목록입니다. 둘 다 인터넷에 그대로 노출되는 장비라, 해당된다면 이번 주 안에 처리하는 것을 권합니다.

## 1. Ivanti Connect Secure — 로그인 없이 root까지

### 무슨 일인가

- **CVE-2026-104935** (인증 우회 + 원격 코드 실행, CVSS 8.6) — 10월 13일 KEV 등재
- **CVE-2026-111357** (중요 기능의 인증 확인 누락, CVSS 8.8) — 10월 30일 KEV 등재
- **CVE-2026-118527** (예측 가능한 식별자로 악성 파일 업로드, CVSS 4.3) — 10월 30일 KEV 등재

보안 업체 Volexity가 10월 초에 처음 보고했고, 공격자(UTA0576)는 이 셋을 **엮어서** 로그인 없이 장비의 root 권한을 얻었습니다. 패치를 다 했다고 생각한 장비도 당했습니다. CVSS 4.3짜리 "낮은" 취약점이 체인의 한 고리였다는 점이 눈여겨볼 대목입니다. 점수만 보고 미루면 안 되는 이유입니다.

더 무서운 것은 그다음입니다. 공격자는 VPN 장비를 발판으로 **Active Directory 자격 증명, LAPS 암호, BitLocker 복구 키**를 노렸습니다. VPN 장비가 AD와 연동돼 있으니, 장비를 뚫으면 사내 도메인으로 바로 이어집니다.

### 해당되는지 확인

- **버전 25.1.1.2 이하 → 25.1.1.3으로**, **22.8R2.5 이하 → 22.8R2.6으로** 올려야 합니다
- 관리 콘솔에서 현재 버전을 확인하고, Ivanti가 제공하는 **무결성 검사 도구(ICT)** 를 돌려 장비가 이미 변조됐는지 봅니다

### 패치 뒤 AD 쪽에서 할 일

장비가 이미 뚫렸을 가능성을 전제로 움직이는 것이 안전합니다.

1. **VPN이 AD에 붙을 때 쓰는 서비스 계정(LDAP 바인드 계정) 암호를 바꿉니다**
2. **LAPS 암호를 강제로 돌립니다.** Windows LAPS라면 만료 시간을 지금으로 당겨 다음 처리 때 새 암호가 만들어지게 합니다

```powershell
# OU 안의 컴퓨터 전부 LAPS 암호를 즉시 만료 처리
Get-ADComputer -SearchBase 'OU=Workstations,DC=corp,DC=example,DC=com' -Filter * |
    ForEach-Object { Set-LapsADPasswordExpirationTime -Identity $_.DistinguishedName }
```

3. **누가 LAPS 암호와 BitLocker 복구 키를 읽었는지 확인합니다.** 디렉터리 서비스 액세스 감사가 켜져 있다면 DC 보안 로그의 이벤트 **4662**에 기록이 남습니다. VPN 장비나 그 서비스 계정에서 읽은 흔적이 있다면 침해로 보고 대응해야 합니다
4. VPN 장비에서 사내로 향한 **비정상적인 접속(측면 이동)** 이 있었는지 방화벽 로그를 봅니다

## 2. Cisco ASA·FTD — VPN 로그인 없이 방화벽 재부팅

### 무슨 일인가

- **CVE-2026-76418** (CVSS 8.6) — 10월 29일 KEV 등재
- **원격 접속 SSL VPN**에서 **보조 인증(secondary authentication)** 을 설정한 터널 그룹이 대상입니다
- 인증 없이, VPN 로그인에 성공하지 않아도 방화벽을 **강제로 재부팅**시킬 수 있습니다. 반복하면 그 자체로 서비스 거부(DoS)입니다

방화벽이 재부팅되면 VPN만이 아니라 그 방화벽을 지나는 **모든 트래픽**이 끊깁니다. 매장이나 지점이 본사 방화벽을 거쳐 POS·전화를 쓰는 구조라면 영향이 큽니다.

### 해당되는지 확인

- `show version`으로 버전을 보고, 터널 그룹 설정에 **보조 인증 서버 그룹(secondary-authentication-server-group)** 이 들어 있는지 확인합니다
- 둘 다 해당되면 아래 수정 버전 이상으로 올립니다

| 계열 | 첫 수정 버전 |
|---|---|
| ASA 9.18 / 9.20 / 9.22 | 9.18.4.96 / 9.20.4.50 / 9.22.3.200 |
| ASA 9.24 | 9.24.1.27 또는 9.24.10.1 |
| FTD 7.2 / 7.4 / 7.6 | 7.2.13 / 7.4.9 / 7.6.7 |
| FTD 10.0 / 10.1 | 10.0.3 / 10.1.1 |

전체 목록은 시스코 보안 권고문에서 확인하세요. **해결책이 되는 우회 설정은 없습니다.** 당장 업그레이드가 어렵다면 보조 인증을 잠시 빼는 임시 조치가 있지만, 그만큼 VPN 보안이 약해지니 짧게만 쓰는 것이 좋습니다.

## 덤 — 10월 정기 패치, 아직이라면

마이크로소프트 10월 정기 보안 업데이트(10월 13일)는 1,400건이 넘는 사상 최대 규모였고, 그중 **Windows 셸 취약점(CVE-2026-96951)** 은 이미 공격에 쓰이고 있습니다. 인터넷에서 받은 파일에 붙는 **"웹에서 받은 파일" 경고(Mark of the Web)를 우회**하는 유형이라, 피싱 메일 첨부 파일과 짝을 이룹니다. 아직 적용하지 않은 PC가 있다면 11월 정기 패치(11월 10일) 전에 먼저 처리하세요.

## 이번 주 할 일 요약

- [ ] Ivanti Connect Secure: 25.1.1.3 / 22.8R2.6 이상, 무결성 검사(ICT) 실행
- [ ] Ivanti 사용처: VPN 서비스 계정 암호 변경, LAPS 암호 강제 교체, 이벤트 4662 확인
- [ ] Cisco ASA/FTD: 보조 인증 쓰는 터널 그룹이 있으면 수정 버전으로
- [ ] Windows: 10월 누적 업데이트 미적용 PC 정리

## 운영자 한마디

저는 VPN 장비 때문에 고생한 적은 아직 없어요.

## 출처

- [CISA, Known Exploited Vulnerabilities Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
- [Security Affairs, U.S. CISA adds Ivanti Connect Secure flaws to its KEV catalog (2026-10-31)](https://securityaffairs.com/202175/security/u-s-cisa-adds-ivanti-connect-secure-flaws-to-its-known-exploited-vulnerabilities-catalog.html)
- [Neoteo, Cisco CVE-2026-76418: exposure and fixed releases (2026-11-01)](https://www.neoteo.com/en/cisa-adds-cisco-cve-2026-76418-to-the-kev-catalog)
- [Malwarebytes, Record Patch Tuesday fixes flaw already under attack (2026-10)](https://www.malwarebytes.com/blog/bugs/2026/10/update-windows-record-patch-tuesday-fixes-flaw-already-under-attack)
