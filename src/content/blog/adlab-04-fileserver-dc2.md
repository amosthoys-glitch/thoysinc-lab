---
title: 'AD 홈랩 ④ 파일서버와, ISO 없이 만든 두 번째 DC'
description: '이름만 파일서버였던 FS1에 AGDLP로 공유를 세우고, 설치 미디어 없이 기존 서버를 복제·sysprep 해서 두 번째 도메인 컨트롤러를 만든 기록. 설정이 엉뚱한 층에 있던 문제들까지.'
pubDate: 'Nov 04 2026'
lang: 'ko'
tags: ['active-directory', 'homelab', 'file-server', 'hyper-v', 'sysprep', 'dns']
---

> 환경: Windows Server 2025 · Hyper-V · PowerShell Direct
> 연재 「노트북 한 대로 AD 홈랩」 4/8 · 작업일 2026-08-21

[2회](/blog/adlab-02-build/)까지의 랩은 DC가 한 대였습니다. 동작은 했지만 DC1이 멈추면 도메인 전체가 멈추는 구조였고, 점검 스크립트의 "복제" 항목은 늘 비어 있었습니다. 이번 목표는 두 가지였습니다. **파일서버를 실제로 서비스하게 만들 것, 그리고 DC를 이중화할 것.**

> 이 작업은 랩을 더 큰 PC로 옮긴 뒤에 했습니다. 옮긴 이야기는 [8회](/blog/adlab-08-migration/)에 따로 정리했습니다.

## 파일서버 — 공유가 하나도 없었다

점검을 돌리다 FS1에 공유가 하나도 없다는 것을 발견했습니다. 구축 스크립트는 고정 IP와 도메인 가입까지만 했고, 파일 서버 역할도 공유도 만들지 않았습니다. 이름만 파일서버였던 셈입니다.

권한 구조는 **AGDLP**로 세웠습니다.

```
A  사용자 100명
└ G  글로벌 그룹  GG-IT …            (부서 6개)
   └ DL 도메인 로컬 그룹  DL-Share-IT-RW / -RO …  (12개)
      └ P  권한  Modify / ReadAndExecute
```

**권한은 맨 오른쪽, 도메인 로컬 그룹에만 붙입니다.** 부서나 파일서버가 늘어도 왼쪽 구조는 그대로 둡니다. IT 부서는 헬프데스크 지원을 위해 모든 부서 공유의 RO 그룹에 넣었습니다.

| 계층 | 공유 권한 | NTFS 권한 |
|---|---|---|
| Domain Admins | Full | Full |
| DL-Share-부서-RW | Change | Modify |
| DL-Share-부서-RO | Read | ReadAndExecute |

공유 권한과 NTFS 권한 중에서는 **더 엄격한 쪽이 적용**됩니다. 그래서 공유 권한은 넓게 열고 실제 통제는 NTFS에서 했습니다. 권한을 추적할 때 볼 곳이 한 군데로 모입니다. 여기에 **접근 기반 열거(ABE)** 를 켜서, 권한이 없는 사람에게는 폴더가 목록에조차 보이지 않게 했습니다.

## 컴퓨터 계정 정리 — 컨테이너는 OU가 아니다

FS1과 CL1의 컴퓨터 계정이 둘 다 기본 `CN=Computers`에 있었습니다. 2회에서 `OU=Servers`, `OU=Workstations`를 만들어 두고도 그랬습니다.

`CN=Computers`는 **컨테이너이지 OU가 아닙니다.** 컨테이너에는 그룹 정책을 걸 수 없습니다. 서버용 OU에 GPO를 아무리 잘 걸어도 서버가 그 아래 없으면 아무 일도 일어나지 않습니다. "도메인 가입은 됐는데 정책만 안 먹는다"의 흔한 원인입니다.

```
CN=FS1,CN=Computers  →  CN=FS1,OU=Servers,OU=Computers,OU=Thoys
CN=CL1,CN=Computers  →  CN=CL1,OU=Workstations,OU=Computers,OU=Thoys
```

## 두 번째 DC — 설치 미디어 없이

DC2를 만들려는데 새 호스트 어디에도 Server 2025 ISO가 없었습니다. 6GB를 다시 받는 대신 **FS1을 복제한 뒤 sysprep으로 신원을 지우는** 길을 택했습니다. 골든 이미지에서 서버를 찍어 내고 나중에 역할을 얹는, 실무에서도 쓰는 방식입니다.

복제본은 원본과 **같은 이름, 같은 SID, 같은 도메인 계정**을 갖고 태어납니다. 그래서 `sysprep /generalize`로 신원을 지우기 전에는 절대 네트워크에 붙이면 안 됩니다. 순서가 여기서 정해집니다.

1. **원본 정지 + 디스크 복제** — FS1을 정상 종료하고 VHDX 26.7GB를 복사 (55초)
2. **VM 생성, 곧바로 네트워크 분리** — `Disconnect-VMNetworkAdapter`로 랜선부터 뽑습니다
3. **부팅 + 원본 흔적 제거** — 네트워크 없이 PowerShell Direct(VM 버스)로 붙어 공유와 파일 서버 역할 제거
4. **unattend.xml + sysprep** — 컴퓨터 이름 DC2, 시간대, OOBE 무인 통과를 지정하고 `/generalize /oobe /shutdown`
5. **그제야 네트워크 연결** — 부팅하면 사람 손 없이 OOBE가 끝납니다
6. **고정 IP .12 + AD DS·DNS 역할 설치**
7. **추가 DC로 승격** — 도메인 관리자 암호와 DSRM 암호가 필요해 이 단계만 콘솔에서 직접

### 검증

- **머신 SID가 FS1과 다를 것.** 같으면 도메인이 조용히 망가집니다. 달라졌다는 것이 `/generalize`가 제대로 돌았다는 증거입니다
- **복제 정상** — `repadmin /replsummary` 결과 지연 7초, 실패 0/5
- **DC2에 직접 질의** — 사용자 100명, GG 6개, 이날 만든 DL 12개, 이날 옮긴 FS1의 OU까지 전부 보임
- **클라이언트에서** — CL1 → FS1:445 연결, 공유 6개 조회(ABE 적용)

## 막혔던 지점 — 설정이 엉뚱한 층에

**445는 열려 있는데 클라이언트가 못 붙음.** 서비스(LanmanServer)는 Running, 445도 리슨 중인데 방화벽 규칙 `File and Printer Sharing (SMB-In)`이 꺼져 있었습니다. 진단 순서는 **서비스가 도는가 → 포트를 리슨하는가 → 방화벽이 통과시키는가**, 이 셋을 나눠 봐야 합니다.

**DC의 DNS가 1.1.1.1, 8.8.8.8.** DC1의 클라이언트 DNS가 공용 리졸버를 1순위로 보고 있었습니다. DC가 자기 도메인을 모르는 서버에 이름을 묻는 구성입니다. DC1 → DC2·127.0.0.1, DC2 → DC1·127.0.0.1로 **서로를 1순위, 자기 자신을 2순위**로 고쳤습니다. 공용 DNS가 있어야 할 자리는 클라이언트 설정이 아니라 DNS 서버의 **전달자(Forwarder)** 입니다.

**`SeSecurityPrivilege` 오류.** Windows PowerShell의 `Set-Acl`은 권한(DACL)만 바꿔도 감사 설정(SACL)까지 쓰려 해서 관리자 특권을 요구합니다. `(Get-Item $Path).SetAccessControl($acl)`로 바꾸거나 `icacls`를 쓰면 해결됩니다. 이후 파일 권한은 전부 `icacls`로 넣었습니다.

**새 VM에 `Copy-VMFile` 실패(0x80070015).** 새로 만든 VM은 Guest Service Interface가 기본으로 꺼져 있습니다. `Enable-VMIntegrationService -Name 'Guest Service Interface'`.

**스크립트 세 개가 호스트에서 사라짐.** 백업용 동기화 스크립트가 호스트 → OneDrive **단방향**이라, OneDrive에만 있던 파일은 영원히 돌아오지 않았습니다. 하필 DC2에 필요한 스크립트들이었습니다. 단방향 동기화는 백업이지 동기화가 아닙니다.

이번 단계의 오류는 대부분 "설정이 없다"가 아니라 **"설정이 엉뚱한 층에 있다"** 였습니다. 공용 DNS가 전달자가 아니라 클라이언트에, 컴퓨터 계정이 OU가 아니라 컨테이너에. 다음 회는 DC가 두 대가 된 덕에 할 수 있게 된 연습, FSMO 역할 이전입니다.

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
