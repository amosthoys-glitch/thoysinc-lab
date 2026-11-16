---
title: 'Windows 11 23H2 Enterprise and Education Support Ended Nov 11 — Check Your Versions'
description: 'Support for Windows 11 23H2 Enterprise and Education ended on November 11, 2026. Here is a table of which versions are supported until when, and how to check which version each PC is on.'
pubDate: 'Nov 15 2026'
lang: 'en'
translation: 'windows-11-23h2-enterprise-education-end-of-support'
tags: ['windows-11', 'end-of-support', 'hot-issue', 'patching', 'enterprise', 'lifecycle']
---

> Scope: Microsoft Lifecycle pages (checked November 15, 2026) · Sources are at the end
>
> Affects: Windows 11 Enterprise, Education, Enterprise multi-session

**Short version:** Support for Windows 11 **23H2 Enterprise and Education** ended on **November 11, 2026**. If any PC is still on 23H2, move it to **24H2 or later**. On Home and Pro, 23H2 ended earlier, on **November 12, 2025**, and **24H2 has already ended too, on October 14, 2026**.

## What happened

According to the Microsoft Lifecycle page, Windows 11 Enterprise and Education follows the Modern Lifecycle Policy. Each version has a fixed support period, and the end date for 23H2 is **Nov 11, 2026** (Pacific Time). That date has passed, so a PC still on 23H2 is no longer in support.

## Versions in support now

For Enterprise and Education:

| Version | Start | End |
|---|---|---|
| 26H2 | 2026-09-29 | 2029-10-09 |
| 26H1 | 2026-02-10 | 2029-03-14 |
| 25H2 | 2025-09-30 | 2028-10-11 |
| 24H2 | 2024-10-01 | **2027-10-13** |
| 23H2 | 2023-10-31 | **2026-11-11 (ended)** |
| 22H2 | 2022-09-20 | 2025-10-15 (ended) |

Home and Pro get shorter periods. On the same Microsoft pages, **25H2 ends 2027-10-13** and **24H2 ends 2026-10-14**. The same version number can have a different end date depending on the edition, so check the edition first.

## How to see which version a PC is on

- Go to **Settings → System → About** and look at Version under "Windows specifications"
- Or press Win+R and run `winver`
- For many PCs at once, use this in PowerShell

```powershell
(Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion').DisplayVersion
```

If you use a management tool (Intune, an asset tool), it is faster to pull the count per version from there.

## To do this week

- [ ] Pull a count of PCs still on 23H2
- [ ] Decide the order for moving them to 24H2 or later, starting with PCs where the impact on work is small
- [ ] 24H2 on Enterprise and Education runs only until **2027-10-13**, so decide at the same time whether to go straight to 25H2 or 26H2
- [ ] If Home and Pro are mixed in, remember that **24H2 has already ended** there

## From the operator

If a business is running Home and Pro, I think it is better to switch Home to Pro wherever possible, for management reasons as well.

## Sources

- [Microsoft Lifecycle, Windows 11 Enterprise and Education](https://learn.microsoft.com/en-us/lifecycle/products/windows-11-enterprise-and-education)
- [Microsoft Lifecycle, Windows 11 Home and Pro](https://learn.microsoft.com/en-us/lifecycle/products/windows-11-home-and-pro)
