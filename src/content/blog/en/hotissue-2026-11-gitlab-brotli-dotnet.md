---
title: '[Security This Week] Finish Before November 10 — GitLab RCE, Brotli and .NET Emergency Patches, .NET 8 and 9 End of Support'
description: 'A CI/CD flaw that lets an unauthenticated attacker take over a GitLab server, and a Brotli decompression flaw that affects countless programs including .NET, are both being exploited. .NET 8 and 9 support ends the same day. Check commands and fixed versions inside.'
pubDate: 'Nov 07 2026'
lang: 'en'
translation: 'hotissue-2026-11-gitlab-brotli-dotnet'
tags: ['security', 'hot-issue', 'gitlab', 'dotnet', 'brotli', 'patching']
---

> Covers information published October 25 – November 2, 2026 · Sources at the end
>
> Applies to: self-managed GitLab, in-house web apps and APIs built on .NET 8, 9 or 10, and servers that use Brotli compression

Both issues this week are on CISA's **Known Exploited Vulnerabilities (KEV) catalog**, and the deadlines happen to line up. **November 10** is the federal remediation deadline for the Brotli flaw, the day .NET 8 and 9 go out of support, and November's Patch Tuesday.

## 1. GitLab — code execution on the server without logging in

### What happened

- **CVE-2026-97229** — maximum severity, added to KEV October 29
- GitLab CI/CD's **regular-expression compiler** has an integer overflow. A crafted regex in a pipeline configuration can, under certain conditions, let **an unauthenticated attacker** run code on the GitLab server
- According to the Shadowserver Foundation, **more than 1,000 unpatched GitLab servers** were still exposed to the internet while attacks were under way

A GitLab server holds more than source code. CI/CD variables contain **deployment passwords, cloud keys and certificates**. Lose the server and those keys lead straight into production.

### Are you affected?

- **GitLab.com and GitLab Dedicated are already fixed; nothing to do there.** Only self-managed CE and EE installs are affected
- Check the version:

```bash
sudo cat /opt/gitlab/embedded/service/gitlab-rails/VERSION
# or in the web UI: Help (?) at the bottom left → version at the top of the Help page
```

- If you are not on **19.4.2, 19.3.5 or 19.2.8** or later, upgrade now. If you are on an older train, plan a stepped upgrade to a supported one

### After patching

Last month the same regex compiler produced another maximum-severity flaw (CVE-2026-110264). That is two months in a row, so it is safest to assume you may already be compromised.

1. **Rotate CI/CD variables and runner tokens** — every secret stored in project, group and instance variables
2. In the admin area, look for recently created **admin accounts, personal access tokens and SSH keys**
3. If the server does not need to face the internet, consider moving it **behind the VPN**

## 2. Brotli decompression — not just a .NET problem

### What happened

- **CVE-2026-111497** — Critical, added to KEV October 27, federal remediation deadline **November 10**
- The decompression code in **Brotli**, the compression format created by Google, has an out-of-bounds write. Sending crafted Brotli data can, **without authentication**, crash the program or read memory, and in some cases lead to remote code execution
- Brotli is built into web servers, proxies, browsers and many libraries. .NET is one of them, so Microsoft shipped an **out-of-band update** on October 25 instead of waiting for Patch Tuesday

### Check and fix

**.NET** — fixed versions are **8.0.33, 9.0.22 and 10.0.14** (.NET Framework is not affected).

```powershell
dotnet --list-runtimes
```

- **Framework-dependent apps:** update the runtime and restart the app (IIS app pool or service)
- **Self-contained apps:** the runtime ships inside the app, so you must **rebuild and redeploy**. Updating the server alone does not fix them
- **Containers:** rebuild on the new .NET base image
- Start with internet-facing apps, especially **APIs that accept Brotli-compressed request bodies**

**Linux servers** — update the system Brotli library to a fixed release (1.0.10, 1.1.1 or 1.2.1 lines).

```bash
dpkg -l | grep -i brotli      # Debian / Ubuntu
rpm -qa | grep -i brotli      # RHEL family
```

If a program **bundles its own copy of Brotli**, updating the system library will not fix it. Check that program's own updates.

**If you cannot patch right away,** block Brotli-compressed requests (`Content-Encoding: br`) at the proxy or firewall, or temporarily turn off Brotli decompression on the server.

## 3. November 10: .NET 8 and 9 reach end of support

On the same day **.NET 8 (LTS) and .NET 9 (STS) both go out of support.** After that, flaws like this Brotli one will not get patches. If you have in-house apps on .NET 8 or 9, apply this emergency patch first, then **plan the move to .NET 10 (LTS)** right away. .NET 10 is supported until November 2028.

## This week's checklist

- [ ] Self-managed GitLab: 19.4.2 / 19.3.5 / 19.2.8 or later, rotate CI/CD variables and runner tokens
- [ ] .NET: run `dotnet --list-runtimes` → 8.0.33 / 9.0.22 / 10.0.14; rebuild self-contained apps and containers
- [ ] Linux servers: update the Brotli package, find programs that bundle their own Brotli
- [ ] List your .NET 8 and 9 apps and schedule the move to .NET 10
- [ ] Block out time for Patch Tuesday on November 10

## Sources

- [CISA, Known Exploited Vulnerabilities Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
- [BleepingComputer, Over 1,000 GitLab servers vulnerable to code execution attacks](https://www.bleepingcomputer.com/news/security/over-1-000-gitlab-servers-vulnerable-to-code-execution-attacks/)
- [Canadian Centre for Cyber Security, AL26-027 Critical vulnerability impacting Google Brotli – CVE-2026-111497](https://cyber.gc.ca/en/alerts-advisories/al26-027-critical-vulnerability-impacting-google-brotli-cve-2026-111497)
- [NTCompatible, Microsoft .NET Out-of-Band Update: Fix Critical CVE-2026-111497 Brotli Flaw Now (2026-10-25)](https://www.ntcompatible.com/story/microsoft-net-outofband-update-fix-critical-cve2026111497-brotli-flaw-now/)
