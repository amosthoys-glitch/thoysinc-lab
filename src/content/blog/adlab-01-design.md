---
title: 'AD 홈랩 ① 설계 — 노트북 한 대에 도메인 하나'
description: 'Windows 11 노트북 한 대에 Hyper-V로 DC·파일서버·클라이언트를 세우기 전에 종이에 먼저 정한 것들. 내부 스위치와 NAT, IP 규칙, 스토리지 배치, 그리고 메모리 배분.'
pubDate: 'Nov 01 2026'
lang: 'ko'
translation: 'en/adlab-01-design'
tags: ['active-directory', 'homelab', 'hyper-v', 'networking']
---

> 환경: Windows 11 Pro (빌드 26200) 호스트 · Hyper-V · Windows Server 2025 Evaluation (빌드 26100) · Windows 11 Enterprise Evaluation 25H2
>
> 연재 「노트북 한 대로 AD 홈랩」 1/8 · 작업일 2026-08-20

8월에 Active Directory 홈랩을 처음부터 다시 세웠습니다. 목표는 단순했습니다. **도메인 컨트롤러에서 만든 일반 사용자 계정으로 다른 컴퓨터에 로그인되는 것.** AD가 하는 일의 본질이 그것이고, 나머지는 그 위에 얹히는 것들입니다.

이 연재는 그 과정을 순서대로 정리합니다. 1회는 VM을 하나도 만들기 전, 종이에 먼저 정한 것들입니다.

## 구성 — 호스트 한 대 안에서 끝나는 도메인

```
호스트 · Windows 11 Pro · 32GB
 ├─ LabNAT ─────────── 외부 인터넷 경로
 └─ LabSwitch (Internal) 192.168.100.1/24
     ├─ DC1  192.168.100.10   AD DS · DNS · DHCP   고정 · 4GB
     ├─ FS1  192.168.100.11   파일서버             고정 · 2GB
     └─ CL1  192.168.100.101  Windows 11 Enterprise DHCP · 4GB

DHCP 범위 .100 – .200 / 서버 고정 IP 몫 .10 – .99
```

**내부(Internal) 스위치를 쓴 이유**는 집 공유기(192.168.0.x)와 완전히 떼어 놓기 위해서입니다. DC1이 DHCP를 나눠 주는데, 공유기와 같은 대역에 두면 DHCP 서버 두 대가 같은 네트워크에서 싸웁니다. 인터넷은 호스트의 NAT를 통해서만 나갑니다.

## 호스트 — 실측한 사양과 판단

| 항목 | 사양 | 판단 |
|---|---|---|
| CPU | Core Ultra 5 235U · 12C/14T | 충분 |
| 메모리 | 32GB | 여유 (VM 합계 10GB) |
| 내장 디스크 | 256GB NVMe | **병목** — 여유 118GB |
| 외장 디스크 | 2TB USB HDD | VM 구동엔 부적합 |

병목은 메모리가 아니라 디스크였습니다. 그래서 스토리지를 역할별로 나눴습니다.

| 대상 | 위치 | 근거 |
|---|---|---|
| 설치 ISO 2개 (14.2GB) | 외장 HDD | 순차 읽기뿐 — HDD로 충분 |
| VM · VHDX | 내장 NVMe | 랜덤 I/O — SSD 필요 |
| VM 내보내기 백업 | 외장 HDD | 순차 쓰기 — HDD가 잘 처리 |

외장 디스크가 SSD가 아니라 **USB 하드디스크**라는 점이 중요했습니다. 랜덤 I/O가 약해 VM을 거기서 돌리면 설치부터 느리고, 절전으로 디스크가 멈추면 VHDX가 손상될 위험까지 있습니다. 이렇게 나누니 내장 디스크 118GB를 전부 VM에 쓸 수 있었고, 구축을 마친 시점 실사용량은 약 55GB였습니다.

## 랩 설계 — 실무 원칙을 그대로

| 호스트명 | IP | 방식 | 메모리 (동적) | 역할 |
|---|---|---|---|---|
| DC1 | .10 | 고정 | 4GB (2–6) | AD DS · DNS · DHCP |
| FS1 | .11 | 고정 | 2GB (1–4) | 파일서버 |
| CL1 | .101 | DHCP | 4GB (2–8) | 클라이언트 |

- **서버는 고정 IP, 클라이언트는 DHCP.** DHCP 범위를 .100부터 시작한 것은 .10–.99를 서버 몫으로 비워 두기 위해서입니다
- **전부 동적 메모리.** 합계 10GB로 시작해도 호스트에 20GB 넘게 남습니다
- **VM은 2세대(Gen2), VHDX는 동적 확장.** 자동 체크포인트는 껐습니다. 켜 두면 VM을 켤 때마다 체크포인트가 쌓여 디스크를 잠식합니다
- **CL1에는 vTPM을 켰습니다.** 없으면 Windows 11 설치가 거부됩니다. (이 vTPM은 8회에서 랩을 옮길 때 다시 문제가 됩니다)

### 도메인 이름

랩 도메인은 `thoyslab.local`로 정했고, 실제로 가진 도메인 `thoysinc.com`은 쓰지 않았습니다. 랩의 DNS 영역이 실제 도메인과 겹치면 나중에 같은 네트워크에서 진짜 서비스를 찾을 때 랩 DNS가 대신 답해 버리는 사고가 납니다.

다만 `.local`이 최선은 아니었습니다. mDNS 충돌, 공인 인증서 발급 불가 같은 문제가 뒤따릅니다. 그 이야기는 프롤로그 [홈랩 AD 도메인 이름 글](/blog/ad-domain-naming/)에 따로 정리했습니다.

## 준비물 — 평가판 ISO 두 개

- **Windows Server 2025 Evaluation** (빌드 26100, 약 7.6GB)
- **Windows 11 Enterprise Evaluation 25H2** (빌드 26200, 약 6.6GB)

둘 다 마이크로소프트 평가판 센터에서 무료로 받습니다. 받은 뒤 마운트해서 `setup.exe`와 `sources\install.wim`이 있는지 확인해 두면, 설치 도중 "이미지를 찾을 수 없다"로 막히는 일을 피할 수 있습니다.

## 호스트 준비 — 두 가지

1. **Hyper-V 켜기** (관리자 PowerShell, 재부팅 필요)

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All -All
```

2. **내 계정을 Hyper-V Administrators 그룹에 넣기.** 이 그룹에 있으면 관리자 창을 열지 않고도 VM을 만들고, 켜고, PowerShell Direct로 VM 안에 명령을 보낼 수 있습니다. 랩 작업 대부분을 일반 창에서 할 수 있게 되어 손이 훨씬 덜 갑니다. 그룹에 넣은 뒤에는 로그아웃했다가 다시 들어와야 적용됩니다.

## 다음 회

설계가 끝났으니 다음은 구축입니다. 스크립트 9개로 가상 스위치를 만들고, DC1을 승격하고, 사용자 100명을 만들어 클라이언트에서 도메인 계정으로 로그인하기까지를 정리합니다.

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
