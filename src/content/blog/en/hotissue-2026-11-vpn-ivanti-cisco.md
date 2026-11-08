---
title: '[Security This Week] Check Your VPN Appliances First — Ivanti Connect Secure Auth-Bypass Chain, Cisco ASA/FTD Remote Reload'
description: 'Two VPN appliance flaws CISA added to its Known Exploited Vulnerabilities list in the last week of October. What the problem is, how to tell whether you are affected, and what to do on the Active Directory side after patching.'
pubDate: 'Nov 07 2026'
lang: 'en'
translation: 'hotissue-2026-11-vpn-ivanti-cisco'
tags: ['security', 'hot-issue', 'vpn', 'ivanti', 'cisco', 'active-directory']
---

> Covers information published October 26 – November 1, 2026 · Sources at the end
>
> Applies to: anyone running remote-access VPN on Ivanti Connect Secure or Cisco Secure Firewall ASA/FTD

Two kinds of VPN appliances landed on CISA's **Known Exploited Vulnerabilities (KEV) catalog** this week. KEV only lists flaws that are **confirmed to be used in real attacks**, not ones that are merely "dangerous in theory." Both products sit directly on the internet, so if you run either one, plan to deal with it this week.

## 1. Ivanti Connect Secure — from no login to root

### What happened

- **CVE-2026-104935** (authentication bypass + remote code execution, CVSS 8.6) — added to KEV October 13
- **CVE-2026-111357** (missing authentication for a critical function, CVSS 8.8) — added to KEV October 30
- **CVE-2026-118527** (malicious file upload via a predictable identifier, CVSS 4.3) — added to KEV October 30

Volexity first reported this in early October. The attacker (UTA0576) **chained** all three to get root on the appliance without logging in, including on devices their owners believed were fully patched. Note that a "low" CVSS 4.3 bug was one link in the chain. That is exactly why you should not postpone fixes based on the score alone.

The worse part comes next. The attackers used the VPN appliance as a foothold to go after **Active Directory credentials, LAPS passwords and BitLocker recovery keys**. Because the appliance is wired into AD, owning the appliance leads straight into the internal domain.

### Are you affected?

- Upgrade **25.1.1.2 and earlier → 25.1.1.3**, and **22.8R2.5 and earlier → 22.8R2.6**
- Check the current version in the admin console, then run Ivanti's **Integrity Checker Tool (ICT)** to see whether the appliance has already been tampered with

### What to do on the AD side after patching

It is safest to act as if the appliance was already compromised.

1. **Change the password of the service account the VPN uses to bind to AD (the LDAP bind account)**
2. **Force LAPS password rotation.** With Windows LAPS, pull the expiration time forward to now so a new password is generated on the next processing cycle

```powershell
# Expire the LAPS password immediately for every computer in the OU
Get-ADComputer -SearchBase 'OU=Workstations,DC=corp,DC=example,DC=com' -Filter * |
    ForEach-Object { Set-LapsADPasswordExpirationTime -Identity $_.DistinguishedName }
```

3. **Find out who read LAPS passwords and BitLocker recovery keys.** If Directory Service Access auditing is on, reads are logged as event **4662** in the domain controllers' Security log. Any reads from the VPN appliance or its service account should be treated as a compromise
4. Review firewall logs for **unusual connections from the VPN appliance into the internal network (lateral movement)**

## 2. Cisco ASA/FTD — firewall reload without a VPN login

### What happened

- **CVE-2026-76418** (CVSS 8.6) — added to KEV October 29
- Affects **remote-access SSL VPN** tunnel groups configured with **secondary authentication**
- An unauthenticated attacker, without ever completing a VPN login, can **force the firewall to reload**. Repeat it and you have a denial of service

When the firewall reloads, it is not just the VPN that drops — **all traffic** through that firewall stops. If your stores or branch offices run POS and phones through the headquarters firewall, the impact is large.

### Are you affected?

- Check the version with `show version`, and look for a **secondary-authentication-server-group** in your tunnel-group configuration
- If both apply, upgrade to at least the fixed release below

| Train | First fixed release |
|---|---|
| ASA 9.18 / 9.20 / 9.22 | 9.18.4.96 / 9.20.4.50 / 9.22.3.200 |
| ASA 9.24 | 9.24.1.27 or 9.24.10.1 |
| FTD 7.2 / 7.4 / 7.6 | 7.2.13 / 7.4.9 / 7.6.7 |
| FTD 10.0 / 10.1 | 10.0.3 / 10.1.1 |

See Cisco's security advisory for the full list. **There is no configuration workaround that fixes it.** If you cannot upgrade right away, temporarily removing secondary authentication is a stopgap, but it weakens VPN security, so keep that window short.

## Bonus — if you still have not applied October's Patch Tuesday

Microsoft's October security update (October 13) was the largest ever, with more than 1,400 fixes, and the **Windows Shell vulnerability (CVE-2026-96951)** in it is already being exploited. It **bypasses the Mark of the Web warning** on files downloaded from the internet, which makes it a natural partner for phishing attachments. If any PCs still lack it, take care of them before November's Patch Tuesday (November 10).

## This week's checklist

- [ ] Ivanti Connect Secure: 25.1.1.3 / 22.8R2.6 or later, run the Integrity Checker Tool
- [ ] Ivanti shops: change the VPN service account password, force LAPS rotation, review event 4662
- [ ] Cisco ASA/FTD: if any tunnel group uses secondary authentication, move to a fixed release
- [ ] Windows: clean up PCs still missing the October cumulative update

## Sources

- [CISA, Known Exploited Vulnerabilities Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
- [Security Affairs, U.S. CISA adds Ivanti Connect Secure flaws to its KEV catalog (2026-10-31)](https://securityaffairs.com/202175/security/u-s-cisa-adds-ivanti-connect-secure-flaws-to-its-known-exploited-vulnerabilities-catalog.html)
- [Neoteo, Cisco CVE-2026-76418: exposure and fixed releases (2026-11-01)](https://www.neoteo.com/en/cisa-adds-cisco-cve-2026-76418-to-the-kev-catalog)
- [Malwarebytes, Record Patch Tuesday fixes flaw already under attack (2026-10)](https://www.malwarebytes.com/blog/bugs/2026/10/update-windows-record-patch-tuesday-fixes-flaw-already-under-attack)
