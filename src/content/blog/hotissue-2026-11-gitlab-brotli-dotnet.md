---
title: '[이번 주 보안] 11월 10일 전에 끝낼 것 — GitLab 원격 코드 실행, Brotli·.NET 긴급 패치, .NET 8·9 지원 종료'
description: '로그인 없이 GitLab 서버를 장악하는 CI/CD 취약점과, .NET을 포함한 수많은 프로그램이 쓰는 Brotli 압축 해제 취약점이 모두 실제 공격에 쓰이고 있습니다. 같은 날 .NET 8과 9의 지원도 끝납니다. 확인 명령과 수정 버전을 정리했습니다.'
pubDate: 'Nov 02 2026'
lang: 'ko'
tags: ['security', 'hot-issue', 'gitlab', 'dotnet', 'brotli', 'patching']
---

> 기준: 2026년 10월 25일 ~ 11월 2일 공개 정보 · 출처는 글 끝에 있습니다
>
> 대상: 직접 운영하는 GitLab(Self-managed), .NET 8·9·10으로 만든 사내 웹앱·API, Brotli 압축을 쓰는 서버

이번 주 두 건 모두 미국 사이버보안청(CISA)의 **"알려진 악용 취약점(KEV)" 목록**에 올랐습니다. 그리고 우연히도 마감이 겹칩니다. **11월 10일**은 Brotli 취약점의 연방 기관 조치 기한이자, .NET 8과 9의 지원이 끝나는 날이자, 11월 정기 보안 업데이트(Patch Tuesday) 날입니다.

## 1. GitLab — 로그인 없이 서버에서 코드 실행

### 무슨 일인가

- **CVE-2026-97229** — 최고 심각도, 10월 29일 KEV 등재
- GitLab CI/CD의 **정규식 컴파일러**에 정수 오버플로가 있습니다. 파이프라인 설정에 조작한 정규식을 넣으면, 조건에 따라 **로그인하지 않은 공격자도** GitLab 서버에서 코드를 실행할 수 있습니다
- 인터넷 감시 단체 Shadowserver에 따르면 공격이 이어지는 와중에도 **패치하지 않은 GitLab 서버가 1,000대 넘게** 인터넷에 노출돼 있습니다

GitLab 서버에는 소스 코드만 있는 게 아닙니다. CI/CD 변수에 들어 있는 **배포용 비밀번호, 클라우드 키, 인증서**가 함께 있습니다. 서버를 뚫리면 그 키로 운영 환경까지 이어집니다.

### 해당되는지 확인

- **GitLab.com(클라우드)과 GitLab Dedicated는 이미 조치돼 할 일이 없습니다.** 직접 설치해 운영하는(Self-managed) CE·EE만 해당됩니다
- 버전 확인:

```bash
sudo cat /opt/gitlab/embedded/service/gitlab-rails/VERSION
# 또는 웹에서 왼쪽 아래 도움말(?) → Help 화면 상단의 버전
```

- **19.4.2, 19.3.5, 19.2.8** 이상이 아니면 바로 올립니다. 그보다 오래된 계열이라면 지원되는 계열로 단계 업그레이드 계획이 필요합니다

### 패치 뒤에 할 일

지난달에도 같은 정규식 컴파일러에서 최고 심각도 취약점(CVE-2026-110264)이 나왔습니다. 두 달 연속입니다. 이미 뚫렸을 가능성을 전제로 보는 것이 안전합니다.

1. **CI/CD 변수와 러너 토큰을 교체합니다.** 프로젝트·그룹·인스턴스 단위 변수에 들어 있는 비밀 값 전부
2. 최근 만들어진 **관리자 계정, 개인 액세스 토큰, SSH 키**가 있는지 관리자 화면에서 확인합니다
3. 인터넷에 꼭 열어 둘 필요가 없다면 **VPN 뒤로** 옮기는 것을 검토합니다

## 2. Brotli 압축 해제 — .NET만의 문제가 아니다

### 무슨 일인가

- **CVE-2026-111497** — 치명(Critical), 10월 27일 KEV 등재, 연방 기관 조치 기한 **11월 10일**
- 구글이 만든 압축 형식 **Brotli**의 압축 해제 코드에 메모리 범위 밖 쓰기가 있습니다. 조작한 Brotli 압축 데이터를 보내면 **인증 없이** 프로그램을 멈추거나 메모리를 읽고, 경우에 따라 원격 코드 실행까지 이어질 수 있습니다
- Brotli는 웹 서버, 프록시, 브라우저, 각종 라이브러리에 두루 들어 있습니다. .NET도 그중 하나라서 마이크로소프트가 10월 25일 **정기 패치를 기다리지 않고 긴급(out-of-band) 업데이트**를 냈습니다

### 해당되는지 확인과 조치

**.NET** — 수정 버전은 **8.0.33, 9.0.22, 10.0.14**입니다(.NET Framework는 해당 없음).

```powershell
dotnet --list-runtimes
```

- **런타임에 의존하는 앱:** 런타임을 업데이트하고 앱(IIS 앱 풀, 서비스)을 다시 시작합니다
- **자체 포함(self-contained)으로 배포한 앱:** 런타임이 앱 안에 들어 있어서 **다시 빌드해 배포**해야 합니다. 서버 업데이트만으로는 안 고쳐집니다
- **컨테이너:** 새 .NET 베이스 이미지로 다시 빌드합니다
- 인터넷에서 요청을 받는 앱, 특히 **Brotli로 압축된 요청 본문을 받는 API**부터 처리합니다

**리눅스 서버** — 시스템 Brotli 라이브러리를 수정 버전(1.0.10, 1.1.1, 1.2.1 계열)으로 올립니다.

```bash
dpkg -l | grep -i brotli      # Debian / Ubuntu
rpm -qa | grep -i brotli      # RHEL 계열
```

프로그램이 Brotli를 **자체적으로 묶어 넣은 경우**에는 시스템 라이브러리를 올려도 안 고쳐집니다. 그 프로그램의 업데이트를 따로 확인해야 합니다.

**당장 패치가 어렵다면** 프록시나 방화벽에서 Brotli로 압축된 요청(`Content-Encoding: br`)을 막거나, 서버의 Brotli 압축 해제를 잠시 끄는 임시 조치가 있습니다.

## 3. 11월 10일, .NET 8과 9 지원 종료

같은 날 **.NET 8(LTS)과 .NET 9(STS)의 지원이 함께 끝납니다.** 그 뒤로는 이번 Brotli 같은 취약점이 나와도 패치가 나오지 않습니다. 사내에 .NET 8·9로 만든 앱이 있다면 이번 긴급 패치를 적용한 다음 **.NET 10(LTS)으로 옮기는 계획**을 바로 세우세요. .NET 10은 2028년 11월까지 지원됩니다.

## 이번 주 할 일 요약

- [ ] Self-managed GitLab: 19.4.2 / 19.3.5 / 19.2.8 이상, CI/CD 변수·러너 토큰 교체
- [ ] .NET: `dotnet --list-runtimes` 확인 → 8.0.33 / 9.0.22 / 10.0.14, 자체 포함 앱·컨테이너는 재빌드
- [ ] 리눅스 서버: Brotli 패키지 업데이트, 자체 포함 Brotli 쓰는 프로그램 확인
- [ ] .NET 8·9 앱 목록 만들고 .NET 10 이전 일정 잡기
- [ ] 11월 10일 Patch Tuesday 일정 확보

## 출처

- [CISA, Known Exploited Vulnerabilities Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
- [BleepingComputer, Over 1,000 GitLab servers vulnerable to code execution attacks](https://www.bleepingcomputer.com/news/security/over-1-000-gitlab-servers-vulnerable-to-code-execution-attacks/)
- [Canadian Centre for Cyber Security, AL26-027 Critical vulnerability impacting Google Brotli – CVE-2026-111497](https://cyber.gc.ca/en/alerts-advisories/al26-027-critical-vulnerability-impacting-google-brotli-cve-2026-111497)
- [NTCompatible, Microsoft .NET Out-of-Band Update: Fix Critical CVE-2026-111497 Brotli Flaw Now (2026-10-25)](https://www.ntcompatible.com/story/microsoft-net-outofband-update-fix-critical-cve2026111497-brotli-flaw-now/)
