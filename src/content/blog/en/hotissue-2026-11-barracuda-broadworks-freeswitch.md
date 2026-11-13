---
title: '[This Week in KEV] Barracuda Email Gateways, Cisco BroadWorks, FreeSWITCH — Nearest Deadline First'
description: 'The KEV additions from November 9–10 that this blog has not covered yet. Barracuda ESG chains an auth bypass with command injection to reach root, with a federal deadline of November 13. Plus Cisco BroadWorks XXE and the FreeSWITCH and GPUStack workarounds.'
pubDate: 'Nov 12 2026'
lang: 'en'
translation: 'hotissue-2026-11-barracuda-broadworks-freeswitch'
tags: ['security', 'hot-issue', 'kev', 'barracuda', 'cisco', 'freeswitch', 'patching']
---

> Scope: information published November 9–12, 2026 · Sources are at the end
>
> Affects: Barracuda ESG, WAF, Load Balancer and related appliances; Cisco BroadWorks; FreeSWITCH; GPUStack

CISA added four entries to the **Known Exploited Vulnerabilities (KEV) catalog** on November 9 and six on November 10. OpenSSH, Chrome and Outlook are covered in earlier posts ([OpenSSH, Chrome, Zyxel](/blog/en/hotissue-2026-11-openssh-chrome-zyxel/) and [November Patch Tuesday](/blog/en/hotissue-2026-11-patch-tuesday/)), so this one takes the rest **in order of the federal remediation deadline**. The deadlines bind federal agencies, but they are a good signal of urgency for everyone.

| Product | CVE | Added to KEV | Federal deadline |
|---|---|---|---|
| FreeSWITCH | CVE-2026-116779 | 11/9 | **11/12** |
| GPUStack | CVE-2026-102895 | 11/9 | **11/12** |
| Barracuda ESG | CVE-2026-116606 | 11/10 | **11/13** |
| Barracuda multiple products | CVE-2026-111560 | 11/10 | **11/13** |
| Cisco BroadWorks | CVE-2026-20320 | 11/10 | 11/24 |
| Openwave Webtop Media Transcoder | CVE-2026-111793 | 11/10 | 11/24 |

## 1. Barracuda — chain the two flaws and you get root

### What happened

- **CVE-2026-116606** — Email Security Gateway (ESG) only. An attacker who can reach the Admin UI can, **without logging in**, use the configuration-import function to restore a crafted backup and change the appliance's configuration. CVSS 4.0 score 9.3
- **CVE-2026-111560** — shell metacharacters in the timezone setting **run as root**. It requires admin access, but chained with the bypass above, that condition is met. CVSS 4.0 score 8.6
- Barracuda published its advisory on November 2 and updated it on November 9 to say it has observed exploitation affecting a small number of organizations

### Affected products and patches

| Product | 116606 | 111560 | Patch |
|---|---|---|---|
| Email Security Gateway (ESG) | Yes | Yes | BNSF-40425 (9.4.017 and later), BNSF-40430 (earlier than 9.4.017) |
| Load Balancer ADC | – | Yes | BNADC-16586 |
| Web Application Firewall (WAF) | – | Yes | BNADC-16586 |
| WAF Control Center (WCC) | – | Yes | BNWF-60060 |
| Message Archiver (BMA) | – | Yes | BNMA-32468 |
| Web Security Gateway (WSG) | – | Yes | BNYF-24789 |

### What to do

- Barracuda says the patches **should have been applied automatically**. Log in anyway and **confirm the latest firmware and the patch above are actually in place**. Turn automatic patching on if it is off
- Appliances several versions behind may need **more than one** update
- **Don't expose the admin interface to the internet.** Restrict it to trusted internal networks. CVE-2026-116606 needs the Admin UI to be reachable, so this alone cuts exposure sharply

## 2. FreeSWITCH — one SIP message runs API commands

- **CVE-2026-116779**, CVSS 9.8, affects **1.11.2 and earlier**, fixed in **1.11.3**
- An inbound SIP MESSAGE can select the `api` chat protocol through the `+` syntax in the To user, which runs FreeSWITCH API commands **with the FreeSWITCH process's privileges**. Where mod_lua is loaded, inline Lua is a second route
- The advisory states that exploitation has been observed in the wild

If you can't upgrade right away, **`enable-chat=false`** on profiles that don't need inbound SIP chat is the most complete workaround in the advisory. It says explicitly that enabling `auth-messages` alone, or setting `disable_system_api_commands=true` alone, is **not sufficient**.

## 3. GPUStack — behind a reverse proxy, everyone is admin

- **CVE-2026-102895**, CVSS 9.8, affects versions **before 2.2.0**, fixed in **2.2.0**
- With the default `force_auth_localhost=False`, requests that appear to come from loopback (127.0.0.1) get **built-in admin access**. A same-host reverse proxy connecting via 127.0.0.1, or a client sending an `X-GPUStack-Real-IP: 127.0.0.1` header, makes outside requests look like loopback
- The advisory reports in-the-wild exploitation against a v2.1.1 deployment

Until you upgrade, the listed workarounds are `force_auth_localhost=true`, stripping the `X-GPUStack-Real-IP` header at the proxy, and keeping the API behind a VPN or edge authentication. If it was already exposed, consider reissuing admin API keys and worker and provider credentials.

## 4. Cisco BroadWorks — reading config files without logging in

- **CVE-2026-20320**, CVSS 3.1 score 7.5, impact is **confidentiality (file read)**
- The Open Client Interface (OCI) XML parser resolves external entities by default, so a remote attacker can send crafted XML to the OCI-P service and **read sensitive files such as configuration data** with the BroadWorks user's privileges. No login and no user interaction needed
- Affected: Application Delivery Platform, Application Server, Profile Server and Xtended Services Platform on releases **earlier than RI.2026.07**, regardless of configuration
- Fixed in **RI.2026.07**. There are **no workarounds**
- The advisory first went out on August 19; Cisco updated it on November 12 to say it became aware of active exploitation in November. If a three-month-old advisory got pushed down the list, now is the time

## 5. Openwave Webtop Media Transcoder

- **CVE-2026-111793**, CVSS 3.1 score 4.3. A logged-in user who bypasses the webmail interface can convert file types the administrator blocked
- Affects versions **before 1.1.22.0**. The vendor recommends the latest supported Media Server 2.0 release
- The score is low, but a KEV listing means it was used in real attacks. Carriers and mail providers running it should check

## This week's checklist

- [ ] FreeSWITCH: 1.11.3 or later; if not yet, `enable-chat=false`
- [ ] GPUStack: 2.2.0 or later; if not yet, `force_auth_localhost=true` and strip the header
- [ ] Barracuda appliances: confirm the patches in the table are actually applied; block the admin UI from outside
- [ ] Cisco BroadWorks: RI.2026.07
- [ ] Openwave Webtop Media Transcoder: latest Media Server 2.0

## A note from me

We have an outside company for this, and they handle our IT infrastructure, including equipment like this.

## Sources

- [CISA, Adds Four Known Exploited Vulnerabilities to Catalog (2026-11-09)](https://www.cisa.gov/news-events/alerts/2026/11/09/cisa-adds-four-known-exploited-vulnerabilities-catalog)
- [CISA, Adds Six Known Exploited Vulnerabilities to Catalog (2026-11-10)](https://www.cisa.gov/news-events/alerts/2026/11/10/cisa-adds-six-known-exploited-vulnerabilities-catalog)
- [CISA, Known Exploited Vulnerabilities Catalog (deadlines and references)](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
- [Barracuda, Pre-Authentication Authorization Bypass and Command Injection (published 2026-11-02, updated 11-09)](https://trust.barracuda.com/security/pre-authentication-authorization-bypass-command-injection)
- [Mandiant, MNDT-2026-0042 (CVE-2026-116606)](https://github.com/mandiant/Vulnerability-Disclosures/blob/master/2026/MNDT-2026-0042.md)
- [Mandiant, MNDT-2026-0041 (CVE-2026-111560)](https://github.com/mandiant/Vulnerability-Disclosures/blob/master/2026/MNDT-2026-0041.md)
- [FreeSWITCH, GHSA-mg63-h38w-8p9p (2026-10-28)](https://github.com/signalwire/freeswitch/security/advisories/GHSA-mg63-h38w-8p9p)
- [GPUStack, GHSA-gj9m-f8ph-pmhr](https://github.com/gpustack/gpustack/security/advisories/GHSA-gj9m-f8ph-pmhr)
- [Cisco, BroadWorks Out-of-Band Blind XXE Injection (published 2026-08-19, updated 11-12)](https://sec.cloudapps.cisco.com/security/center/content/CiscoSecurityAdvisory/cisco-sa-bworks-xxe-uwUd7CEt)
- [Openwave, CAN-2026-2032674 (CVE-2026-111793)](https://github.com/GISOpenwave/security-advisories-public/blob/main/CAN-2026-2032674.md)
