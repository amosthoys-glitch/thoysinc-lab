---
title: '[November Patch Tuesday] An Outlook Zero-Day and Your Domain Controllers — What to Patch First'
description: 'Only one flaw in November''s Patch Tuesday is being exploited: an Outlook NTLM leak. But Active Directory, LDAP and Exchange also got serious fixes, so domain controllers come first on the server side. Scope, KB numbers and order.'
pubDate: 'Nov 11 2026'
lang: 'en'
translation: 'hotissue-2026-11-patch-tuesday'
tags: ['security', 'hot-issue', 'patch-tuesday', 'outlook', 'active-directory', 'exchange', 'patching']
---

> Scope: Microsoft's November 10, 2026 security updates · Sources are at the end
>
> Affects: Outlook (Microsoft 365 Apps, Office LTSC 2021 and 2024), Windows Server domain controllers, Exchange Server

This month's release is large. Depending on how you count, Tenable puts it at 1,093 CVEs, and BleepingComputer at 1,235 including 142 Edge (Chromium) flaws. The order matters more than the total: **only one flaw is being exploited**, and a good share of the ones marked "exploitation more likely" sit on **domain controllers and Exchange**.

## 1. Outlook — an NTLM leak already used in attacks

### What happened

- **CVE-2026-124194** — Outlook spoofing vulnerability, CVSS 6.5, rated "Moderate" by Microsoft
- Microsoft has **confirmed exploitation**, and CISA added it to the KEV (Known Exploited Vulnerabilities) catalog on November 10, with a federal due date of **November 24**
- An attacker sends a crafted file and gets the user to **open it in Outlook**. Outlook then connects to an attacker-controlled location without showing its usual external-content warning, and the user's **NTLMv2 hash** goes with it. The hash can be used to impersonate the user or cracked offline
- **The Preview Pane is not an attack vector.** The user has to open the file

The score looks low, but it is the **only flaw being used in the wild** this month, so it comes first.

### Fix — this is an Office update, not a Windows update

The fix is not in the Windows cumulative update. It ships as an **Office (Microsoft 365 Apps) update**. Fixed builds as of November 10:

| Channel / product | Version (build) |
|---|---|
| Current Channel | 2610 (20527.20196) |
| Monthly Enterprise Channel | 2610 (20527.20194), 2609 (20430.20264), 2608 (20326.20320) |
| Semi-Annual Enterprise Channel | 2610 (20527.20192), 2609 (20430.20262), 2608 (20326.20318) |
| Office LTSC 2024 (volume licensed) | 2408 (17932.21140) |
| Office LTSC 2021 (volume licensed) | 2108 (14334.21048) |

To check a PC, look under **File → Office Account → About** for the build, or run:

```powershell
Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Office\ClickToRun\Configuration' |
  Select-Object VersionToReport, CDNBaseUrl, UpdateChannel
```

If you manage Office update deadlines through Intune or Configuration Manager, pull them in to this week. Even after the update arrives, **Outlook has to be closed and reopened** for it to apply.

### If patching is delayed

This CVE's advisory lists no separate mitigation. The guidance Microsoft gave for the similar 2023 Outlook NTLM leak (CVE-2023-23397) still applies:

- **Put high-value accounts such as Domain Admins in the Protected Users group.** Members of this group can't use NTLM. Apps that need NTLM will be affected, so start with admin accounts
- **Block outbound TCP 445 (SMB)** at the perimeter firewall, the local firewall and the VPN. That closes the path for NTLM authentication to remote shares

```powershell
# Current members of Protected Users
Get-ADGroupMember -Identity 'Protected Users' | Select-Object Name, SamAccountName
```

## 2. Domain controllers — patch DCs first this month

No attacks have been reported yet, but three serious Active Directory flaws were fixed.

- **CVE-2026-118146** — Active Directory Domain Services remote code execution, CVSS 8.8, **Critical**, "Exploitation More Likely." An attacker with **just a low-privileged domain account** can send a crafted request to a DC and run code. No user interaction needed
- **CVE-2026-118148** — AD DS elevation of privilege, CVSS 7.5, **Critical**, "Exploitation More Likely." Success means **SYSTEM**. The attacker has to win a race condition, so it is harder to pull off
- **CVE-2026-119958** — Windows LDAP remote code execution, CVSS **9.8**, **Critical**. **Unauthenticated**, through a crafted set of LDAP calls, running code in the context of the LDAP service. Microsoft rates it "Exploitation Less Likely," but it has the highest score of the three

One phished user account is enough to meet the condition for the first flaw — which is exactly what the Outlook hash leak in section 1 can lead to. **Patch DCs first** this month.

### KB by server version

| Version | KB |
|---|---|
| Windows Server 2025 | KB5131080 (KB5131077 for Azure Arc hotpatch machines) |
| Windows Server 2022 | KB5131090 |
| Windows Server 2019 | KB5131085 |
| Windows Server 2016 | KB5131291 |

```powershell
# DCs in the domain and their OS
Get-ADDomainController -Filter * | Select-Object Name, OperatingSystem, Site

# Is this month's KB installed on each DC? (example: Server 2022)
Get-ADDomainController -Filter * | ForEach-Object {
  [pscustomobject]@{
    DC = $_.Name
    KB5131090 = [bool](Get-HotFix -ComputerName $_.HostName -Id KB5131090 -ErrorAction SilentlyContinue)
  }
}
```

With two or more DCs, patch **one at a time**: restart, confirm replication is healthy, then move to the next.

```powershell
repadmin /replsummary
dcdiag /test:replications /q
```

## 3. Exchange Server Subscription Edition

- **CVE-2026-118207** — Exchange remote code execution, CVSS 8.8, **Critical**, "Exploitation More Likely." An authenticated attacker with low-level access to the server can run code with a crafted request
- Microsoft lists **Exchange Server Subscription Edition (SE) RTM** as the fixed product, with update **KB5133453**
- Several Exchange elevation-of-privilege and spoofing flaws were fixed in the same release

If you run Exchange on-premises, patch it right after the DCs. Exchange Online–only organizations have nothing to do; Microsoft handles it.

## 4. Also worth a look

- **Windows Schannel RCE (CVE-2026-119952)** — Critical, "Exploitation More Likely." Unauthenticated, via a crafted packet, but specific protocol settings must be in place, which makes it harder
- **Windows NAT RCE (CVE-2026-113862)** — Critical, "Exploitation More Likely"
- **Windows Search RCE (CVE-2026-116928)** — CVSS 9.8, Critical
- **SQL Server RCE (CVE-2026-116945)** — CVSS 9.8, rated Important by Microsoft

On the client side: Windows 11 24H2, 25H2 and 26H2 get **KB5132061**, 23H2 gets **KB5131087**, and Windows 10 ESU gets **KB5131096**.

## Summary — this week's order

1. **Outlook (Office) update** — exploited in the wild. Every user PC, this week
2. **Domain controllers** — AD DS and LDAP. One at a time, checking replication
3. **Exchange SE** — KB5133453 if you run it on-premises
4. Everything else on your normal schedule

## Sources

- Microsoft Security Response Center, November 2026 security update data (CVRF, released Nov 10, revised Nov 11): https://api.msrc.microsoft.com/cvrf/v3.0/cvrf/2026-Nov
- Microsoft, CVE-2026-124194: https://msrc.microsoft.com/update-guide/vulnerability/CVE-2026-124194
- Microsoft 365 Apps security update release notes: https://learn.microsoft.com/en-us/officeupdates/microsoft365-apps-security-updates
- Microsoft, Windows Server 2025 hotpatch KB5131077: https://support.microsoft.com/help/5131077
- CISA Known Exploited Vulnerabilities Catalog (added Nov 10): https://www.cisa.gov/known-exploited-vulnerabilities-catalog
- Microsoft, CVE-2023-23397 mitigations (Protected Users, blocking TCP 445): https://msrc.microsoft.com/update-guide/vulnerability/CVE-2023-23397
- Tenable, Microsoft's November 2026 Patch Tuesday (Nov 10): https://www.tenable.com/blog/microsoft-november-2026-patch-tuesday-addresses-1093-cves-cve-2026-124194
- BleepingComputer, Microsoft November 2026 Patch Tuesday (Nov 10): https://www.bleepingcomputer.com/news/microsoft/microsoft-november-2026-patch-tuesday-fixes-1-235-flaws-outlook-zero-day/
