---
title: '[11월 Patch Tuesday] Outlook 제로데이와 도메인 컨트롤러 — 이번 달 먼저 올릴 것'
description: '11월 정기 보안 업데이트에서 실제 공격에 쓰인 것은 Outlook NTLM 유출 취약점 하나입니다. 다만 Active Directory와 LDAP, Exchange에 무게 있는 취약점이 함께 나와 도메인 컨트롤러부터 올려야 합니다. 대상, KB 번호, 순서를 정리했습니다.'
pubDate: 'Nov 11 2026'
lang: 'ko'
translation: 'en/hotissue-2026-11-patch-tuesday'
tags: ['security', 'hot-issue', 'patch-tuesday', 'outlook', 'active-directory', 'exchange', 'patching']
---

> 기준: 2026년 11월 10일 Microsoft 정기 보안 업데이트 · 출처는 글 끝에 있습니다
>
> 대상: Outlook(Microsoft 365 Apps, Office LTSC 2021·2024), Windows Server 도메인 컨트롤러, Exchange Server

이번 달 패치는 건수가 많습니다. 집계 기준에 따라 Tenable은 1,093건, BleepingComputer는 Edge(Chromium) 142건을 포함해 1,235건으로 셉니다. 숫자보다 중요한 것은 순서입니다. **실제 공격에 쓰인 것은 하나**이고, **공격 가능성이 높다고 표시된 것 중 상당수가 도메인 컨트롤러와 Exchange**에 몰려 있습니다.

## 1. Outlook — 이미 공격에 쓰인 NTLM 유출

### 무슨 일인가

- **CVE-2026-124194** — Outlook 스푸핑 취약점, CVSS 6.5, Microsoft 평가 "Moderate"
- Microsoft는 **실제 악용을 확인**했고, CISA도 11월 10일 KEV(알려진 악용 취약점) 목록에 올렸습니다. 연방기관 조치 기한은 **11월 24일**입니다
- 공격자가 조작한 파일을 보내 사용자가 **Outlook에서 열게** 만들면, Outlook이 평소 띄우는 외부 콘텐츠 경고 없이 공격자 서버에 접속하면서 사용자의 **NTLMv2 해시**가 넘어갑니다. 이 해시로 사용자 행세를 하거나, 오프라인으로 비밀번호를 풀 수 있습니다
- **미리 보기 창은 공격 경로가 아닙니다.** 사용자가 파일을 직접 열어야 합니다

점수는 낮아 보여도 이번 달 **유일하게 실제로 쓰이고 있는** 취약점이라 1순위입니다.

### 조치 — Windows 업데이트가 아니라 Office 업데이트

이 패치는 Windows 누적 업데이트에 들어 있지 않습니다. **Office(Microsoft 365 Apps) 업데이트**로 따로 나옵니다. 11월 10일 기준 수정 빌드는 다음과 같습니다.

| 채널·제품 | 버전 (빌드) |
|---|---|
| Current Channel | 2610 (20527.20196) |
| Monthly Enterprise Channel | 2610 (20527.20194), 2609 (20430.20264), 2608 (20326.20320) |
| Semi-Annual Enterprise Channel | 2610 (20527.20192), 2609 (20430.20262), 2608 (20326.20318) |
| Office LTSC 2024 (볼륨 라이선스) | 2408 (17932.21140) |
| Office LTSC 2021 (볼륨 라이선스) | 2108 (14334.21048) |

PC에서 Outlook 버전을 확인하려면 **파일 → Office 계정 → 정보**에서 빌드 번호를 보거나, 아래 명령으로 확인합니다.

```powershell
Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Office\ClickToRun\Configuration' |
  Select-Object VersionToReport, CDNBaseUrl, UpdateChannel
```

Intune이나 Configuration Manager로 Office 업데이트 기한을 관리한다면 이번 주 안으로 당겨 두는 것이 좋습니다. Office는 업데이트를 받아도 **Outlook을 껐다 켜야** 적용됩니다.

### 당장 패치가 늦어진다면

이번 CVE 문서에는 따로 적힌 완화책이 없습니다. 다만 같은 종류였던 2023년 Outlook NTLM 유출(CVE-2023-23397) 때 Microsoft가 권한 방법이 그대로 통합니다.

- **도메인 관리자 같은 중요 계정을 Protected Users 그룹에 넣습니다.** 이 그룹의 계정은 NTLM 인증을 쓰지 않습니다. NTLM이 필요한 프로그램이 있으면 영향이 있으니 관리자 계정부터 적용합니다
- **방화벽과 VPN에서 밖으로 나가는 TCP 445(SMB)를 막습니다.** 원격 공유로 NTLM 인증이 새어 나가는 길이 끊깁니다

```powershell
# Protected Users 그룹 현재 구성원 확인
Get-ADGroupMember -Identity 'Protected Users' | Select-Object Name, SamAccountName
```

## 2. 도메인 컨트롤러 — 이번 달 서버 패치는 DC부터

공격 사례는 아직 없지만, Active Directory 쪽에 무게 있는 취약점이 셋 나왔습니다.

- **CVE-2026-118146** — Active Directory Domain Services 원격 코드 실행, CVSS 8.8, **Critical**, "Exploitation More Likely". **낮은 권한의 도메인 계정만 있으면** DC에 조작한 요청을 보내 코드를 실행할 수 있습니다. 사용자가 클릭할 필요도 없습니다
- **CVE-2026-118148** — AD DS 권한 상승, CVSS 7.5, **Critical**, "Exploitation More Likely". 성공하면 **SYSTEM 권한**입니다. 경쟁 상태(race condition)를 이겨야 해서 난이도는 높습니다
- **CVE-2026-119958** — Windows LDAP 원격 코드 실행, CVSS **9.8**, **Critical**. **인증 없이** 조작한 LDAP 호출로 LDAP 서비스 권한의 코드를 실행합니다. Microsoft 평가는 "Exploitation Less Likely"이지만 점수가 가장 높습니다

피싱 한 번으로 일반 사용자 계정 하나만 넘어가도 첫 번째 취약점의 조건이 채워집니다. 1번의 Outlook 해시 유출과 이어질 수 있다는 뜻입니다. **이번 달은 DC를 먼저** 올리는 것을 권합니다.

### 서버별 KB

| 버전 | KB |
|---|---|
| Windows Server 2025 | KB5131080 (Azure Arc 핫패치 대상은 KB5131077) |
| Windows Server 2022 | KB5131090 |
| Windows Server 2019 | KB5131085 |
| Windows Server 2016 | KB5131291 |

```powershell
# 도메인의 DC 목록과 OS 버전
Get-ADDomainController -Filter * | Select-Object Name, OperatingSystem, Site

# 각 DC에 이번 달 KB가 설치됐는지 (예: Server 2022)
Get-ADDomainController -Filter * | ForEach-Object {
  [pscustomobject]@{
    DC = $_.Name
    KB5131090 = [bool](Get-HotFix -ComputerName $_.HostName -Id KB5131090 -ErrorAction SilentlyContinue)
  }
}
```

DC가 두 대 이상이라면 **한 대씩** 올리고, 다시 켠 뒤 복제가 정상인지 확인하고 다음 DC로 넘어갑니다.

```powershell
repadmin /replsummary
dcdiag /test:replications /q
```

## 3. Exchange Server Subscription Edition

- **CVE-2026-118207** — Exchange 원격 코드 실행, CVSS 8.8, **Critical**, "Exploitation More Likely". 서버에 낮은 권한으로 접근할 수 있는 인증된 공격자가 조작한 요청으로 코드를 실행합니다
- Microsoft 문서에 수정 대상으로 나온 것은 **Exchange Server Subscription Edition(SE) RTM**이고, 업데이트는 **KB5133453**입니다
- 같은 달 Exchange 권한 상승·스푸핑 취약점도 여러 건 함께 고쳐졌습니다

Exchange를 온프레미스로 운영 중이라면 DC 다음으로 올립니다. Exchange Online만 쓰는 회사는 Microsoft가 처리하므로 할 일이 없습니다.

## 4. 그 밖에 눈여겨볼 것

- **Windows Schannel 원격 코드 실행 (CVE-2026-119952)** — Critical, "Exploitation More Likely". 인증 없이 조작한 패킷으로 공격하지만 특정 프로토콜 설정이 갖춰져야 해서 난이도는 높습니다
- **Windows NAT 원격 코드 실행 (CVE-2026-113862)** — Critical, "Exploitation More Likely"
- **Windows Search 원격 코드 실행 (CVE-2026-116928)** — CVSS 9.8, Critical
- **SQL Server 원격 코드 실행 (CVE-2026-116945)** — CVSS 9.8, Microsoft 평가 Important

PC 쪽은 Windows 11 24H2·25H2·26H2가 **KB5132061**, 23H2가 **KB5131087**, Windows 10 ESU가 **KB5131096**입니다.

## 정리 — 이번 주 순서

1. **Outlook(Office) 업데이트** — 실제 공격 중. 사용자 PC 전체, 이번 주 안
2. **도메인 컨트롤러** — AD DS·LDAP. 한 대씩, 복제 확인하며
3. **Exchange SE** — 온프레미스라면 KB5133453
4. 나머지 서버와 PC는 평소 일정대로

## 출처

- Microsoft Security Response Center, 2026년 11월 보안 업데이트 데이터(CVRF, 11월 10일 공개·11일 갱신): https://api.msrc.microsoft.com/cvrf/v3.0/cvrf/2026-Nov
- Microsoft, CVE-2026-124194: https://msrc.microsoft.com/update-guide/vulnerability/CVE-2026-124194
- Microsoft 365 Apps 보안 업데이트 릴리스 정보: https://learn.microsoft.com/en-us/officeupdates/microsoft365-apps-security-updates
- Microsoft, Windows Server 2025 핫패치 KB5131077: https://support.microsoft.com/help/5131077
- CISA Known Exploited Vulnerabilities Catalog(11월 10일 추가): https://www.cisa.gov/known-exploited-vulnerabilities-catalog
- Microsoft, CVE-2023-23397 완화 방법(Protected Users, TCP 445 차단): https://msrc.microsoft.com/update-guide/vulnerability/CVE-2023-23397
- Tenable, Microsoft’s November 2026 Patch Tuesday(11월 10일): https://www.tenable.com/blog/microsoft-november-2026-patch-tuesday-addresses-1093-cves-cve-2026-124194
- BleepingComputer, Microsoft November 2026 Patch Tuesday(11월 10일): https://www.bleepingcomputer.com/news/microsoft/microsoft-november-2026-patch-tuesday-fixes-1-235-flaws-outlook-zero-day/
