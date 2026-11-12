---
title: '[이번 주 KEV] Barracuda 메일 보안 장비, Cisco BroadWorks, FreeSWITCH — 기한이 가까운 것부터'
description: 'CISA가 11월 9~10일 KEV에 올린 것 중 아직 이 블로그에서 다루지 않은 것들입니다. Barracuda ESG는 인증 우회와 명령 주입을 묶어 root까지 가고, 연방 기한이 11월 13일입니다. Cisco BroadWorks XXE, FreeSWITCH·GPUStack 우회책까지 정리했습니다.'
pubDate: 'Nov 12 2026'
lang: 'ko'
translation: 'en/hotissue-2026-11-barracuda-broadworks-freeswitch'
tags: ['security', 'hot-issue', 'kev', 'barracuda', 'cisco', 'freeswitch', 'patching']
---

> 기준: 2026년 11월 9일 ~ 11월 12일 공개 정보 · 출처는 글 끝에 있습니다
>
> 대상: Barracuda ESG·WAF·Load Balancer 등 어플라이언스, Cisco BroadWorks, FreeSWITCH, GPUStack

CISA는 11월 9일 네 건, 10일 여섯 건을 **알려진 악용 취약점(KEV) 목록**에 올렸습니다. OpenSSH, 크롬, Outlook은 앞 글들([OpenSSH·크롬·Zyxel](/blog/hotissue-2026-11-openssh-chrome-zyxel/), [11월 Patch Tuesday](/blog/hotissue-2026-11-patch-tuesday/))에서 다뤘으니, 이 글은 나머지를 **연방기관 조치 기한이 가까운 순서**로 봅니다. 기한은 연방기관 대상이지만, 그만큼 급하다는 신호로 읽으면 됩니다.

| 제품 | CVE | KEV 등재 | 연방 기한 |
|---|---|---|---|
| FreeSWITCH | CVE-2026-116779 | 11/9 | **11/12** |
| GPUStack | CVE-2026-102895 | 11/9 | **11/12** |
| Barracuda ESG | CVE-2026-116606 | 11/10 | **11/13** |
| Barracuda 여러 제품 | CVE-2026-111560 | 11/10 | **11/13** |
| Cisco BroadWorks | CVE-2026-20320 | 11/10 | 11/24 |
| Openwave Webtop Media Transcoder | CVE-2026-111793 | 11/10 | 11/24 |

## 1. Barracuda — 두 취약점을 묶으면 root

### 무슨 일인가

- **CVE-2026-116606** — Email Security Gateway(ESG)만 해당. 관리 화면(Admin UI)에 닿을 수 있는 공격자가 **로그인 없이** 설정 가져오기 기능으로 조작한 백업을 복원해 장비 설정을 바꿀 수 있습니다. CVSS 4.0 9.3
- **CVE-2026-111560** — 시간대(timezone) 설정 칸에 셸 명령을 넣으면 **root 권한으로 실행**됩니다. 관리자 권한이 있어야 하지만, 위 우회와 묶이면 조건이 채워집니다. CVSS 4.0 8.6
- Barracuda는 11월 2일 공지를 냈고, 11월 9일 "소수 조직에서 실제 악용을 확인했다"고 갱신했습니다

### 해당 제품과 패치

| 제품 | 116606 | 111560 | 패치 |
|---|---|---|---|
| Email Security Gateway (ESG) | 해당 | 해당 | BNSF-40425 (9.4.017 이상), BNSF-40430 (9.4.017 미만) |
| Load Balancer ADC | – | 해당 | BNADC-16586 |
| Web Application Firewall (WAF) | – | 해당 | BNADC-16586 |
| WAF Control Center (WCC) | – | 해당 | BNWF-60060 |
| Message Archiver (BMA) | – | 해당 | BNMA-32468 |
| Web Security Gateway (WSG) | – | 해당 | BNYF-24789 |

### 할 일

- Barracuda는 패치가 **자동으로 들어가야 정상**이라고 합니다. 그래도 장비에 들어가서 **최신 펌웨어와 위 패치가 실제로 적용됐는지** 확인합니다. 자동 패치가 꺼져 있으면 켭니다
- 펌웨어가 여러 버전 뒤처진 장비는 업데이트를 **여러 번** 거쳐야 할 수 있습니다
- **관리 화면을 인터넷에 열어 두지 않습니다.** 신뢰하는 내부망에서만 접근하게 막습니다. 116606은 관리 화면에 닿아야 쓸 수 있으니, 이것만으로도 노출이 크게 줄어듭니다

## 2. FreeSWITCH — SIP 메시지 하나로 API 명령 실행

- **CVE-2026-116779**, CVSS 9.8, **1.11.2 이하** 해당, **1.11.3**에서 수정
- SIP MESSAGE의 받는 사람(To) 사용자 이름에 `+` 문법으로 `api` 채팅 프로토콜을 고르면, FreeSWITCH API 명령이 **FreeSWITCH 프로세스 권한으로** 실행됩니다. mod_lua가 켜져 있으면 인라인 Lua도 또 하나의 경로입니다
- 권고문에 "실제 악용이 관찰됐다"고 적혀 있습니다

당장 올리기 어렵다면, 인바운드 SIP 채팅이 필요 없는 프로파일에 **`enable-chat=false`** 를 거는 것이 권고문에 나온 가장 확실한 우회책입니다. `auth-messages`만 켜거나 `disable_system_api_commands=true`만 거는 것으로는 **충분하지 않다**고 명시돼 있습니다.

## 3. GPUStack — 프록시 뒤에 두었다면 누구나 관리자

- **CVE-2026-102895**, CVSS 9.8, **2.2.0 미만** 해당, **2.2.0**에서 수정
- 기본 설정(`force_auth_localhost=False`)에서는 루프백(127.0.0.1)에서 온 요청을 **기본 관리자로 인정**합니다. 같은 서버의 리버스 프록시가 127.0.0.1로 붙어 있거나, 클라이언트가 `X-GPUStack-Real-IP: 127.0.0.1` 헤더를 보내면 외부 요청도 루프백처럼 보입니다
- 권고문에 v2.1.1 배포에서의 실제 악용이 보고돼 있습니다

올리기 전까지는 `force_auth_localhost=true`, 프록시에서 `X-GPUStack-Real-IP` 헤더 제거, API를 VPN이나 앞단 인증 뒤로 숨기는 것이 권고된 우회책입니다. 이미 노출돼 있었다면 관리자 API 키와 워커·제공자 자격 증명을 새로 발급하는 것도 고려합니다.

## 4. Cisco BroadWorks — 인증 없이 설정 파일 읽기

- **CVE-2026-20320**, CVSS 3.1 7.5, 영향은 **기밀성(파일 읽기)**
- OCI(Open Client Interface) XML 파서가 외부 엔티티를 기본으로 해석해서, 원격 공격자가 조작한 XML을 OCI-P 서비스로 보내면 **설정 파일 같은 민감한 파일**을 BroadWorks 사용자 권한으로 읽을 수 있습니다. 로그인도, 사용자 동작도 필요 없습니다
- 해당: Application Delivery Platform, Application Server, Profile Server, Xtended Services Platform — **RI.2026.07 이전** 릴리스, 설정과 상관없이
- 수정: **RI.2026.07**. 우회책은 **없습니다**
- 8월 19일에 처음 나온 공지인데, Cisco는 11월 12일 "11월에 실제 악용을 알게 됐다"고 갱신했습니다. 석 달 전 공지라고 미뤄 둔 곳이 있다면 지금 올릴 차례입니다

## 5. Openwave Webtop Media Transcoder

- **CVE-2026-111793**, CVSS 3.1 4.3. 관리자가 막아 둔 파일 형식을, 로그인한 사용자가 웹메일 화면을 우회해 변환할 수 있습니다
- **1.1.22.0 이전** 해당. 제조사는 지원 중인 최신 Media Server 2.0으로 올리라고 권합니다
- 점수는 낮지만 KEV에 올랐다는 건 실제로 쓰였다는 뜻입니다. 이 제품을 쓰는 통신사·메일 사업자라면 확인합니다

## 이번 주 할 일 요약

- [ ] FreeSWITCH: 1.11.3 이상, 당장 못 하면 `enable-chat=false`
- [ ] GPUStack: 2.2.0 이상, 당장 못 하면 `force_auth_localhost=true`와 헤더 제거
- [ ] Barracuda 어플라이언스: 위 표의 패치가 실제로 적용됐는지 확인, 관리 화면 외부 차단
- [ ] Cisco BroadWorks: RI.2026.07
- [ ] Openwave Webtop Media Transcoder: Media Server 2.0 최신

## 출처

- [CISA, Adds Four Known Exploited Vulnerabilities to Catalog (2026-11-09)](https://www.cisa.gov/news-events/alerts/2026/11/09/cisa-adds-four-known-exploited-vulnerabilities-catalog)
- [CISA, Adds Six Known Exploited Vulnerabilities to Catalog (2026-11-10)](https://www.cisa.gov/news-events/alerts/2026/11/10/cisa-adds-six-known-exploited-vulnerabilities-catalog)
- [CISA, Known Exploited Vulnerabilities Catalog (기한·참고 링크)](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
- [Barracuda, Pre-Authentication Authorization Bypass and Command Injection (2026-11-02 공개, 11-09 갱신)](https://trust.barracuda.com/security/pre-authentication-authorization-bypass-command-injection)
- [Mandiant, MNDT-2026-0042 (CVE-2026-116606)](https://github.com/mandiant/Vulnerability-Disclosures/blob/master/2026/MNDT-2026-0042.md)
- [Mandiant, MNDT-2026-0041 (CVE-2026-111560)](https://github.com/mandiant/Vulnerability-Disclosures/blob/master/2026/MNDT-2026-0041.md)
- [FreeSWITCH, GHSA-mg63-h38w-8p9p (2026-10-28)](https://github.com/signalwire/freeswitch/security/advisories/GHSA-mg63-h38w-8p9p)
- [GPUStack, GHSA-gj9m-f8ph-pmhr](https://github.com/gpustack/gpustack/security/advisories/GHSA-gj9m-f8ph-pmhr)
- [Cisco, BroadWorks Out-of-Band Blind XXE Injection (2026-08-19 공개, 11-12 갱신)](https://sec.cloudapps.cisco.com/security/center/content/CiscoSecurityAdvisory/cisco-sa-bworks-xxe-uwUd7CEt)
- [Openwave, CAN-2026-2032674 (CVE-2026-111793)](https://github.com/GISOpenwave/security-advisories-public/blob/main/CAN-2026-2032674.md)
