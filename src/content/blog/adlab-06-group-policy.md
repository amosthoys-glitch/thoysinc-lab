---
title: 'AD 홈랩 ⑥ OU는 있었는데 걸린 게 없었다 — 그룹 정책'
description: '잠금 정책 0회, 사용자가 직접 찾아 들어가던 공유, 도메인 관리자에게 몰린 권한. 암호·잠금 정책, OU별 기준선, GPP 드라이브 매핑, 헬프데스크 권한 위임으로 그 공백을 메운 기록.'
pubDate: 'Nov 06 2026'
lang: 'ko'
translation: 'en/adlab-06-group-policy'
tags: ['active-directory', 'homelab', 'group-policy', 'delegation', 'powershell']
---

> 환경: Windows Server 2025 · GPMC · GroupPolicy PowerShell 모듈 · Windows 11 Enterprise 클라이언트
>
> 연재 「노트북 한 대로 AD 홈랩」 6/8 · 작업일 2026-08-22

[2회](/blog/adlab-02-build/)에서 공들여 만든 OU 구조에, 여기까지 오는 동안 정책이 하나도 걸려 있지 않았습니다.

## 시작 전 점검 — 기억이 아니라 조회로

무엇을 했는지 나열하는 대신 **무엇이 없는지** 조회했습니다. 다음 할 일을 정하는 데 그쪽이 정확했습니다.

| 항목 | 점검 결과 |
|---|---|
| GPO | 기본 2개뿐, 직접 만든 것 0개 |
| 계정 잠금 | 임계값 0 — 몇 번을 틀려도 잠기지 않음 |
| 암호 최소 길이 | 7자 (기본값) |
| AD 휴지통 | 비활성 |
| 사이트·서브넷 | 서브넷 정의 없음 |

## 만든 정책

| GPO | 연결 위치 | 설정 |
|---|---|---|
| Default Domain Policy | 도메인 루트 | 최소 12자 · 5회 실패 시 15분 잠금 |
| Lab - Workstation Baseline | OU=Workstations | 마지막 사용자명 숨김 · 15분 화면 잠금 |
| Lab - Server Baseline | OU=Servers | 로그온 배너 |
| Lab - Department Drive Maps | OU=Users | 부서별 드라이브 6개 |

**암호·잠금 정책은 도메인 루트에만 걸립니다.** OU에 걸면 그 OU 컴퓨터의 로컬 계정에만 적용되고 도메인 계정에는 효과가 없습니다. 부서마다 다른 암호 정책이 필요하면 GPO가 아니라 **세분화 암호 정책(PSO)** 을 씁니다. "OU에 암호 정책을 걸었는데 왜 안 먹냐"는 설계상 원래 그렇습니다.

`Set-ADDefaultDomainPasswordPolicy`는 AD 속성만 바꿔서 다음 GPO 적용 때 되돌아간다는 이야기가 있어 직접 확인했습니다. 실제로는 Default Domain Policy의 `GptTmpl.inf`까지 갱신하고 GPO 버전도 올립니다(0 → 4). `gpupdate /force` 뒤에도 값이 유지됐습니다.

## 드라이브 매핑 — GPP로, GPO 하나에

[4회](/blog/adlab-04-fileserver-dc2/)에서 만든 공유를 사용자가 `\\FS1\IT`처럼 직접 쳐서 들어가던 것을 로그온 때 자동으로 붙게 했습니다. 그룹 정책 기본 설정(GPP)의 **항목 수준 대상 지정**을 쓰면 GPO 하나에 부서 조건 6개를 다 담을 수 있습니다.

```
I:  →  \\FS1\IT               조건: GG-IT 소속
F:  →  \\FS1\Finance          조건: GG-Finance 소속
H:  →  \\FS1\HR               조건: GG-HR 소속
O:  →  \\FS1\Operations       조건: GG-Operations 소속
K:  →  \\FS1\Store-Chandler   조건: GG-Store-Chandler 소속
P:  →  \\FS1\Store-Phoenix    조건: GG-Store-Phoenix 소속
```

### 함정 — GPP는 명령으로 만들 수 없다

GPMC는 GUI로 드라이브 매핑을 만들어 주지만, PowerShell GroupPolicy 모듈에는 **GPP용 cmdlet이 아예 없습니다.** 스크립트로 하려면 세 가지를 직접 해야 합니다.

1. SYSVOL의 GPO 폴더에 `Drives.xml` 쓰기
2. GPO의 `gPCUserExtensionNames`에 드라이브 매핑 확장(CSE) GUID 등록
3. GPO 버전(`versionNumber`와 `GPT.INI`) 올리기

**하나만 빠져도 오류 없이 조용히 실패합니다.** 정책 목록에는 "적용됨"으로 나오는데 드라이브만 안 붙습니다. 버전을 올려야 하는 이유는 클라이언트가 버전 번호로 변경 여부를 판단하기 때문입니다. 상위 16비트가 사용자 버전, 하위 16비트가 컴퓨터 버전이라 사용자 설정만 바꿨다면 상위만 올립니다.

## 권한 위임 — 필요한 만큼만

여기까지 이 도메인에서 무언가를 하려면 전부 도메인 관리자여야 했습니다. 실제 조직에서 암호 재설정과 잠금 해제는 하루 업무의 절반인데, 그것 때문에 도메인 관리자를 나눠 줄 수는 없습니다.

구조는 공유와 똑같이 AGDLP입니다. 사용자를 `GG-Helpdesk`에, 그것을 `DL-Delegate-UserSupport`에 넣고, 권한은 DL 그룹에만, **OU=Users 범위로만** 줬습니다.

| 권한 | 할 수 있게 되는 일 |
|---|---|
| Reset Password | 사용자 암호 재설정 |
| pwdLastSet 쓰기 | "다음 로그온 시 암호 변경" 걸기 |
| lockoutTime 쓰기 | 잠긴 계정 해제 |

내장 **Account Operators에 넣는 것은 위임이 아닙니다.** 그 그룹은 도메인 전체에서 사용자·그룹·컴퓨터를 만들고 지울 수 있고, 범위를 OU로 좁힐 수도 없습니다.

검증은 두 방향으로 했습니다.

- **닿아야 할 곳에 닿는가** — Finance OU의 실제 사용자 개체에 세 권한이 "상속됨"으로 붙어 있는지. OU에는 붙었는데 상속 범위를 잘못 잡아 사용자 개체에 안 닿는 것이 가장 흔한 실패입니다
- **새지 않는가** — 내장 Administrator, 컴퓨터 계정, 도메인 루트, Groups OU에는 권한 0건. 특히 **내장 Administrator가 범위에 딸려 들어가면** 헬프데스크가 도메인 관리자 암호를 바꿀 수 있게 됩니다. 위임이 아니라 권한 상승 경로가 됩니다

## 적용됐는지 — 레지스트리와 실제 잠금으로

- **OU별로 정책이 갈렸는가** — CL1은 `dontdisplaylastusername = 1`, FS1은 `0`이고 로그온 배너가 있음. `gpresult`의 "적용됨"만 보지 않고 레지스트리 값까지 확인했습니다
- **잠금이 실제로 되는가** — 틀린 암호로 6번 시도 → 잠김 True, 실패 5회, 보안 로그 이벤트 4740 기록, `Unlock-ADAccount`로 해제 확인
- **드라이브가 붙는가** — 드라이브 매핑은 대화형 로그온에서만 처리돼서 콘솔로 직접 로그인해 `I:` 드라이브를 확인했습니다. 이 한 번으로 SMB, AGDLP 권한, 방화벽, 대상 지정까지 연쇄가 전부 증명됩니다

## 같은 실수를 두 번

점검 중에 앞선 기록의 오류도 하나 찾았습니다. 게이트웨이(192.168.100.1)에 ping이 안 가는 것을 보고 "내부 스위치라 VM은 바깥으로 못 나간다, 외부 NTP는 불가능"이라고 적어 뒀는데, 틀렸습니다. 호스트에 NAT가 정상 구성돼 있었고 VM에서 외부 443 연결과 외부 시간 조회가 다 됐습니다. ping이 안 된 건 호스트 방화벽이 ICMP를 막기 때문이었습니다.

[2회](/blog/adlab-02-build/)에 "ping 실패는 장애가 아니다"라고 적어 두고도 반복했습니다. 아는 것과 습관이 되는 것은 다릅니다. 도달성은 `Test-NetConnection -Port`로, 실제 서비스 포트로 확인합니다.

다음 회는 DC1 한 대에만 있던 DHCP를 이중화하고, 주 서버를 실제로 꺼 봅니다.

---

### 연재 「노트북 한 대로 AD 홈랩」

0. [홈랩 AD 도메인 이름: .local 을 고르면 나중에 어디서 막히나](/blog/ad-domain-naming/) (프롤로그)
1. [설계 — 노트북 한 대에 도메인 하나](/blog/adlab-01-design/)
2. [구축 — DC 승격부터 도메인 계정 로그인까지](/blog/adlab-02-build/)
3. [막혔던 일곱 지점](/blog/adlab-03-pitfalls/)
4. [파일서버와 ISO 없이 만든 두 번째 DC](/blog/adlab-04-fileserver-dc2/)
5. [FSMO 이전과 DNS가 따라오는 시간](/blog/adlab-05-fsmo/)
6. [OU는 있었는데 걸린 게 없었다 — 그룹 정책](/blog/adlab-06-group-policy/)
7. [꺼봐야 이중화인지 안다 — DHCP 페일오버](/blog/adlab-07-dhcp-failover/)
8. [랩을 통째로 다른 PC로 옮기기](/blog/adlab-08-migration/)
