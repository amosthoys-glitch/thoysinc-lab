---
title: '[이번 주 보안] Alpine SSH 비밀번호 우회, 크롬 제로데이, Zyxel 스위치 — 이번 주 먼저 막을 것'
description: '긴 비밀번호 하나로 Alpine 리눅스 SSH에 로그인되는 OpenSSH 취약점이 공개 몇 시간 만에 공격에 쓰였습니다. 크롬은 올해 여덟 번째 제로데이를 고쳤고, Zyxel 스위치는 패치를 우회한 공격이 이어졌습니다. 확인 명령과 수정 버전을 정리했습니다.'
pubDate: 'Nov 10 2026'
lang: 'ko'
tags: ['security', 'hot-issue', 'openssh', 'linux', 'chrome', 'zyxel', 'patching']
---

> 기준: 2026년 11월 3일 ~ 11월 10일 공개 정보 · 출처는 글 끝에 있습니다
>
> 대상: Alpine 리눅스 서버·컨테이너, 사내 PC의 크롬, Zyxel GS1900 스위치

CISA는 11월 9일 **알려진 악용 취약점(KEV) 목록**에 네 건을 한꺼번에 올렸습니다. 그중 관리자에게 가장 넓게 걸리는 것이 OpenSSH입니다. 같은 주에 크롬 제로데이와 Zyxel 스위치 제로데이도 나왔습니다.

## 1. OpenSSH "SSHole" — 256자 넘는 비밀번호면 로그인된다

### 무슨 일인가

- **CVE-2026-123158** — 11월 5일 공개, 11월 9일 KEV 등재
- 비밀번호가 없는 계정(비밀번호 칸이 `*`)에 **256자보다 긴 아무 비밀번호**를 넣으면 로그인이 됩니다
- 원인은 두 가지가 맞물린 것입니다. sshd는 사용자 이름 추측을 막으려고 비밀번호 없는 계정에도 다른 계정의 해시 방식을 빌려 계산합니다. 그런데 musl C 라이브러리의 `crypt()`는 256바이트가 넘는 비밀번호를 거부하면서 `*`를 돌려주고, 이 값이 비밀번호 없는 계정의 `*`와 같아져 통과됩니다
- 위협 정보 업체 Previdian은 공개 **9시간도 안 돼** 첫 공격을 봤고, 미끼 서버(Alpine)에서 root 권한까지 넘어간 것을 확인했습니다. 봇넷과 암호화폐 채굴 쪽에서 쓰이고 있습니다

### 해당되는지 확인

**glibc를 쓰는 Debian, Ubuntu, RHEL, Fedora는 해당되지 않습니다.** PAM으로 비밀번호를 확인하는 구성도 안전합니다. 아래 조건이 **모두** 맞을 때만 위험합니다.

- **musl** 기반 리눅스이면서 sshd가 **PAM 없이** 빌드됨 — Alpine 기본 openssh-server가 여기에 해당합니다. OpenWrt, Buildroot, Yocto, Alpine 기반 Docker 이미지도 확인 대상입니다
- **비밀번호 인증이 켜져 있음** (OpenSSH 기본값)
- 비밀번호 칸이 `*`인 계정이 있고, 동시에 실제 비밀번호 해시(`$5$`, `$6$`)를 가진 계정이 하나 이상 있음

```sh
cat /etc/alpine-release                       # Alpine 버전
apk info -v openssh-server                    # 설치된 openssh 버전
sshd -T | grep -Ei 'passwordauthentication|usepam|permitrootlogin'
awk -F: '$2=="*"{print $1}' /etc/shadow       # 비밀번호 칸이 * 인 계정
```

root는 기본 설정(`PermitRootLogin`)으로 막혀 있지만, AWS·Azure의 공식 Alpine 이미지(tiny-cloud 3.18.11 ~ 3.24.3)에 있는 `alpine` 사용자는 비밀번호 없이 `doas`를 쓸 수 있어 사실상 root까지 이어집니다.

### 조치

1. **OpenSSH 10.6p2 이상**(또는 배포판의 수정 패키지)으로 올립니다. Alpine은 3.16부터 edge까지 모든 계열에 수정 패키지를 냈습니다
2. **sshd를 꼭 다시 시작합니다.** 패키지만 바꾸면 돌고 있는 sshd는 옛 코드 그대로입니다
3. 컨테이너는 수정된 Alpine 베이스로 **이미지를 다시 빌드**합니다

```sh
apk update && apk upgrade openssh-server
rc-service sshd restart
```

**당장 패치가 어렵다면** `/etc/ssh/sshd_config`에 `PasswordAuthentication no`를 넣고 sshd를 다시 시작합니다. 키 인증만 쓰는 서버라면 원래 꺼 두는 것이 맞습니다.

### 이미 뚫렸는지 확인

- 로그에서 비밀번호 없는 계정으로 **"Accepted password for"** 가 찍힌 기록을 찾습니다 (`/var/log/messages`)
- 최근 만들어진 사용자, `authorized_keys` 변경, `doas` 사용 기록을 봅니다
- 의심스러우면 그 서버는 **이미 뚫린 것으로 보고** 다시 만드는 편이 안전합니다

## 2. 크롬 — 올해 여덟 번째 제로데이

- **CVE-2026-125350** — 크롬 XML 처리 부분의 메모리 해제 후 사용(use-after-free), 높음(High)
- 구글이 "실제 공격에 쓰이는 익스플로잇이 있다"고 밝혔습니다. 조작한 웹페이지를 여는 것만으로 코드 실행까지 이어질 수 있습니다
- 수정 버전: **157.0.8103.50 이상** (Mac은 .50/.51)

크롬은 자동 업데이트가 내려와도 **브라우저를 다시 켜야** 적용됩니다. 사내 PC가 며칠씩 크롬을 켜 둔 채로 쓰는 경우가 많으니, 그룹 정책이나 Intune의 크롬 재시작 알림·강제 재시작 기한을 확인하세요. 엣지 같은 크로미움 기반 브라우저도 이어서 나오는 업데이트를 챙깁니다.

## 3. Zyxel GS1900 스위치 — 패치를 우회한 공격

- **CVE-2026-107441** — 웹 관리 화면의 메모리 범위 밖 쓰기. 로그인 없이 스위치에서 명령을 실행합니다
- 6월에 고친 취약점(CVE-2026-7273)의 패치를 **우회하는 공격**이 이어졌고, GreyNoise는 48개국 **996대**가 장악된 것으로 봤습니다. 공격자는 설정, root 비밀번호 해시, 네트워크 정보를 가져갔습니다
- Zyxel이 10월 22일 수정 펌웨어를 냈고 11월 3일 권고문을 공개했습니다. GS1900 시리즈 10개 모델이 대상입니다

**6월 패치를 했다고 끝난 것이 아닙니다.** 최신 펌웨어로 다시 올리고, 관리 화면이 인터넷이나 일반 사용자 대역에 열려 있지 않은지 확인합니다. 이미 노출됐던 장비라면 관리자 비밀번호를 바꾸고 설정이 바뀌지 않았는지 봅니다.

## 함께 KEV에 오른 것

- **IBM Aspera Faspex (CVE-2026-123218)** — 로그인한 사용자가 관리자 권한을 얻는 권한 우회, CVSS 9.8. **5.0.19 PL1(Fix Pack 1)** 로 올립니다. 그냥 5.0.19는 아직 취약합니다
- **FreeSWITCH (CVE-2026-116779)**, **GPUStack (CVE-2026-102895)** — 쓰고 있다면 제조사 권고문의 수정 버전을 확인합니다

## 이번 주 할 일 요약

- [ ] Alpine 서버·컨테이너: openssh 10.6p2 이상, **sshd 재시작**, 이미지 재빌드
- [ ] 패치 전까지 `PasswordAuthentication no`, 로그에서 "Accepted password for" 확인
- [ ] 크롬 157.0.8103.50 이상, 재시작 강제 기한 확인
- [ ] Zyxel GS1900: 10월 22일 이후 펌웨어, 관리 화면 접근 제한
- [ ] IBM Aspera Faspex: 5.0.19 PL1
- [ ] 오늘(11월 10일)은 11월 Patch Tuesday — 내용은 내일 따로 정리합니다

## 출처

- [CISA, Adds Four Known Exploited Vulnerabilities to Catalog (2026-11-09)](https://www.cisa.gov/news-events/alerts/2026/11/09/cisa-adds-four-known-exploited-vulnerabilities-catalog)
- [Help Net Security, OpenSSH flaw exploited in the wild just hours after disclosure (CVE-2026-123158)](https://www.helpnetsecurity.com/2026/11/06/openssh-sshole-cve-2026-123158-exploitation/)
- [eSentire, OpenSSH SSHole Authentication Bypass Vulnerability (CVE-2026-123158)](https://www.esentire.com/security-advisories/openssh-sshole-authentication-bypass-vulnerability-cve-2026-123158)
- [Debian Security Tracker, CVE-2026-123158](https://security-tracker.debian.org/tracker/CVE-2026-123158)
- [BleepingComputer, Google patches eighth Chrome zero-day exploited in attacks this year](https://www.bleepingcomputer.com/news/security/google-patches-eighth-chrome-zero-day-exploited-in-attacks-this-year/)
- [BleepingComputer, Zyxel fixes zero-day exploited to hack nearly 1,000 network switches](https://www.bleepingcomputer.com/news/security/zyxel-fixes-zero-day-exploited-to-hack-nearly-1-000-network-switches/)
- [IBM Support, Security Bulletin: IBM Aspera Faspex (CVE-2026-123218)](https://www.ibm.com/support/pages/node/7295921)
