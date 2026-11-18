---
title: '[Advisory] Puppet Server Remote Code Execution (CVE-2026-115731) — One Agent Certificate Is Enough; Patch by December 1'
description: 'A Critical (9.4) flaw in Puppet Server''s report-processing code was added to CISA''s Known Exploited Vulnerabilities catalog on November 17. If your CA autosigns requests, attackers don''t even need credentials. Affected and fixed versions, and what to check now.'
pubDate: 'Nov 17 2026'
lang: 'en'
translation: 'hotissue-2026-11-puppet-server-report-rce'
tags: ['security', 'hot-issue', 'puppet', 'configuration-management', 'patching']
draft: false
---

> Scope: CISA KEV listing of November 17, 2026 and the Perforce advisory · Sources are at the end
>
> Affects: organizations running Puppet Enterprise or Puppet Core (open-source Puppet Server) themselves

<p><small>This post contains affiliate links; the blog may earn a commission on purchases at no extra cost to you.</small></p>

**Short version:** If you run Puppet, check now that you're on **Puppet Enterprise 2026.0.1 / 2025.12.1 / 2023.8.13**, or **Puppet Core 9.1.3 / 8.22.2** or later. If not, upgrade right away. CISA added this flaw to its Known Exploited Vulnerabilities (KEV) catalog on **November 17**, and the federal deadline is **December 1**. If your CA **autosigns** certificate requests, it's even more urgent.

## What happened

- **CVE-2026-115731** — **Critical (CVSS 9.4)**
- Puppet Server's **report-processing code** deserializes untrusted data
- A client holding **any CA-signed agent certificate** can submit a report containing a crafted rich-data type via a PUT request and **execute arbitrary code on the Puppet Server as its service user**
- Where the CA **autosigns requests without strong verification**, an **unauthenticated network attacker** can obtain such a certificate
- Perforce shipped fixes on **November 3**, and CISA added the flaw to KEV on **November 17**

The Puppet server is what pushes configuration to every machine it manages. Code running there can reach every server underneath it.

## Affected and fixed versions

| Product | Affected | Fixed in |
|---|---|---|
| Puppet Enterprise 2026 | 2026.0.0 before 2026.0.1 | **2026.0.1** (Puppet Core 9.1.3) |
| Puppet Enterprise 2025 | 2025.0.0 before 2025.12.1 | **2025.12.1** (Puppet Core 8.22.2) |
| Puppet Enterprise 2023.8 | 2023.8.0 before 2023.8.13 | **2023.8.13** (Puppet Core 8.22.2) |
| Puppet Core 9 | 9.0.0 before 9.1.3 | **9.1.3** |
| Puppet Core 8 | 8.x before 8.22.2 | **8.22.2** |

## What to check now

1. **Check the version** — compare your Puppet Server (or Puppet Enterprise primary server) version with the table above
2. **Upgrade** — if you're below the fixed version, upgrade now
3. **Review autosigning** — if your CA signs certificate requests automatically, the "attacker needs a certificate" condition effectively disappears. Check whether any request gets signed and what verification is in place
4. **Review signed certificates** — look through the CA's list for agent certificates you don't recognize
5. **Narrow network access** — make sure the Puppet Server port is open only to the networks that need it

## A note from me

I manage things with GPO.

I wrote about managing Windows servers with Group Policy in [AD Home Lab ⑥ Group Policy](/blog/en/adlab-06-group-policy/). If you want to learn Group Policy from the ground up, a good <a href="https://www.amazon.com/s?k=windows+group+policy+book&tag=thoysinc-20" target="_blank" rel="sponsored noopener">Windows Group Policy book</a> is worth keeping on your desk.

## Sources

- [Perforce, Report Deserialization Code Execution (CVE-2026-115731)](https://portal.perforce.com/s/cve/a91Qi000003IaHpIAK/report-deserialization-code-execution) — affected and fixed versions, CVSS 9.4, resolved 2026-11-03
- [CISA, Known Exploited Vulnerabilities Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) — added 2026-11-17, due 2026-12-01
