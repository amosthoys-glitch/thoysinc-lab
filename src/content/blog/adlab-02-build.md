---
title: 'AD 홈랩 ② 구축 — DC 승격부터 도메인 계정 로그인까지'
description: '가상 스위치와 NAT, VM 3대, DC1 승격, OU와 사용자 100명, DHCP, 서버·클라이언트 도메인 가입까지 스크립트 9개로 4시간. 그리고 "됐다"를 VM 밖에서 확인한 방법.'
pubDate: 'Nov 02 2026'
lang: 'ko'
tags: ['active-directory', 'homelab', 'hyper-v', 'powershell', 'dns', 'dhcp']
---

> 환경: Windows Server 2025 Standard (Desktop Experience) · Windows 11 Enterprise · Hyper-V on Windows 11 Pro
> 연재 「노트북 한 대로 AD 홈랩」 2/8 · 작업일 2026-08-20 · 약 4시간

[1회](/blog/adlab-01-design/)에서 정한 설계대로 실제로 세운 기록입니다. 모든 단계는 PowerShell 스크립트로 만들었고, **다시 돌려도 안전하게(멱등)** 작성했습니다. 중간에 실패해도 처음부터 다시 돌리면 이미 된 것은 건너뛰고 남은 것만 합니다.

## 구축 순서 — 스크립트 9개

| 번호 | 하는 일 | 실행 위치 |
|---|---|---|
| 01 | VM 기본 경로, 내부 스위치 `LabSwitch`, 호스트 vNIC에 192.168.100.1, NAT 구성 | 호스트 |
| 02 | VM 3대 생성 — Gen2, 동적 메모리, 동적 VHDX, 자동 체크포인트 끔, CL1 vTPM | 호스트 |
| 03 | DC1 이름 변경 → 고정 IP → AD DS·DNS 설치 → 포리스트 생성 | DC1 |
| 04 | OU · 보안 그룹 · 사용자 100명 일괄 생성 | DC1 |
| 05 | DHCP 범위 .100–.200, 게이트웨이·DNS 옵션 | DC1 |
| 06 | FS1 고정 IP → SRV 레코드 사전 검사 → 도메인 가입 | FS1 |
| 07 | CL1 DHCP 수령·DNS 확인 → 도메인 가입 | CL1 |
| 10 | Guest Service Interface를 켜고 `Copy-VMFile`로 스크립트를 VM 안에 복사 | 호스트 |
| 20 | VM 전체를 외장 디스크로 내보내기 (백업) | 호스트 |

몇 가지는 짚어 둘 만합니다.

- **03번은 재부팅을 두 번 거칩니다.** 이름 변경 후 한 번, 승격 후 한 번. 그래서 단계마다 현재 상태를 확인하고 이어서 진행하도록 만들었습니다
- **05번의 핵심은 DNS 옵션입니다.** 클라이언트가 받는 DNS를 공유기가 아니라 DC1로 고정해야 도메인을 찾습니다
- **06·07번은 가입 전에 DNS부터 검사합니다.** `_ldap._tcp.dc._msdcs` SRV 레코드를 못 찾으면 가입을 시도하지 않고 멈춥니다. 실패 원인을 즉시 알 수 있게 하려는 것입니다. 07번은 APIPA(169.254.x.x) 주소가 나오면 DHCP를 못 받은 것이므로 역시 멈춥니다
- **10번은 클립보드를 없앴습니다.** 스크립트를 VM 콘솔에 붙여 넣는 대신 호스트에서 VM 안으로 파일을 직접 밀어 넣습니다

## 디렉터리 구조 — 리테일 다점포를 본떠서

```
thoyslab.local
└── OU=Thoys
    ├── OU=Users
    │   ├── OU=IT               18명
    │   ├── OU=Finance          17명
    │   ├── OU=HR                7명
    │   ├── OU=Operations       16명
    │   ├── OU=Store-Chandler   20명
    │   └── OU=Store-Phoenix    22명
    ├── OU=Computers
    │   ├── OU=Workstations
    │   └── OU=Servers
    └── OU=Groups
        └── GG-IT, GG-Finance, GG-HR, GG-Operations,
            GG-Store-Chandler, GG-Store-Phoenix
```

부서를 매장 단위까지 쪼갠 것은 뒤에 할 그룹 정책을 염두에 둔 설계입니다. OU에 GPO를 걸면 매장마다 다른 드라이브를 붙이거나 IT 부서에만 도구를 배포하는 시나리오를 그대로 실습할 수 있습니다.

사용자 100명은 이름·성 목록에서 무작위로 조합하되 **난수 시드를 고정**했습니다. 랩을 지우고 다시 만들어도 같은 명단이 나옵니다. 모든 계정에는 "첫 로그온 시 암호 변경"을 걸었습니다. 이것 때문에 첫 로그인에서 한 번 막혔는데, [3회](/blog/adlab-03-pitfalls/)에 정리했습니다.

## 검증 — VM 안이 아니라 밖에서

구축한 서버 안에서 "성공"이 출력되는 것은 증거로 약합니다. **호스트에서 따로 확인되는 것만 검증으로 쳤습니다.**

### AD 서비스 포트

```
192.168.100.10   53 DNS · 88 Kerberos · 389 LDAP
                 445 SMB · 464 kpasswd · 3268 Global Catalog   모두 열림
```

### DNS 등록 — 도메인 가입의 증거

```
_ldap._tcp.dc._msdcs.thoyslab.local  →  dc1.thoyslab.local:389

dc1.thoyslab.local  →  192.168.100.10
fs1.thoyslab.local  →  192.168.100.11
cl1.thoyslab.local  →  192.168.100.101
```

워크그룹 컴퓨터는 AD 통합 DNS에 자기 레코드를 등록할 수 없습니다. **레코드가 있다는 것 자체가 인증된 도메인 멤버라는 증명**입니다. 그리고 SRV 레코드는 클라이언트가 DC를 찾는 길이라, 도메인 가입 실패의 대부분이 이 레코드를 못 찾아서 생깁니다.

### 최종 — 도메인 계정으로 클라이언트 로그인

```
CL1 로그온 : THOYSLAB\jlee012  (IT 부서 테스트 사용자)
첫 로그온 시 암호 변경 완료
```

DC에서 만든 계정으로 다른 컴퓨터에 로그인되는 것. 1회에서 정한 목표가 여기서 끝납니다.

### ping이 안 되는 것은 고장이 아닙니다

호스트에서 DC1은 ping에 답하는데 FS1과 CL1은 답하지 않았습니다. DC로 승격되면 AD 서비스용 방화벽 규칙이 열리면서 ICMP도 함께 허용되지만, 일반 멤버는 기본으로 막습니다. "ping이 안 되니 서버가 죽었다"는 흔한 오진입니다. 서비스 포트(`Test-NetConnection -Port`)나 DNS 레코드로 확인하는 쪽이 정확합니다.

> 이 교훈을 적어 두고도 저는 5단계에서 같은 실수를 한 번 더 했습니다. 그 이야기는 [6회](/blog/adlab-06-group-policy/)에 있습니다.

## 마무리 — 백업 먼저

여기까지 마친 뒤, 망가뜨리는 실습에 들어가기 전에 VM 3대를 외장 디스크로 통째로 내보냈습니다. 세 대 합계 61GB, 10분 걸렸습니다. 복구는 `Import-VM -Path <vmcx> -Copy -GenerateNewId` 한 줄입니다.

다음 회는 이 4시간 동안 실제로 막혔던 일곱 지점입니다. 개인적으로는 구축 절차보다 그쪽이 더 값어치 있다고 생각합니다.

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
