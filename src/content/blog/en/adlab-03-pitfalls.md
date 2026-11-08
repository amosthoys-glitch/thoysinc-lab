---
title: 'AD Home Lab, Part 3: Seven Places I Got Stuck — What the Docs Do Not Show You'
description: 'A Korean-comment .ps1 without a BOM, duplicate names in the same OU, DNS negative caching, a credential prompt hiding behind a window, execution policy, a join colliding with a rename, and a first login that RDP cannot do.'
pubDate: 'Nov 07 2026'
lang: 'en'
translation: 'adlab-03-pitfalls'
tags: ['active-directory', 'homelab', 'powershell', 'troubleshooting', 'dns']
---

> Environment: Windows PowerShell 5.1 · Windows Server 2025 · Windows 11 Enterprise · Hyper-V Enhanced Session
>
> Series "An AD Home Lab on One Laptop," part 3 of 8 · built 2026-08-20

Anyone can follow the build procedure in [part 2](/blog/en/adlab-02-build/) from the documentation. The seven things in this part are the ones you only meet with your hands on the keyboard. Most of them repeat exactly in real-world work.

## 1. `The string is missing the terminator`

**Cause.** I saved `.ps1` files with Korean comments as UTF-8 without a BOM. Without a BOM, Windows PowerShell 5.1 reads the script in the system's default code page (CP949 on Korean Windows), the Korean text gets mangled, and you get a nonsensical syntax error. Five scripts failed at once.

**Fix.** Re-save as UTF-8 **with BOM**. After that, every script was checked with the parser before running. It catches syntax errors without executing anything.

```powershell
$errs = $null
[System.Management.Automation.Language.Parser]::ParseFile($path, [ref]$null, [ref]$errs) | Out-Null
$errs
```

PowerShell 7 and later read BOM-less UTF-8 correctly, so they do not have this problem.

## 2. `A name that is already in use`

**Cause.** When creating 100 users, I put only "First Last" in `-Name` (the CN). Spreading 30 first names and 20 last names across 100 people produced duplicate names in the same OU.

**Fix.** Append a number only when the CN collides, and wrap each creation in `try/catch` so one failure does not stop the whole run.

**Lesson.** Each identifier has a different scope in which it must be unique.

| Identifier | Example | Must be unique within |
|---|---|---|
| CN | James Lee | The same OU |
| sAMAccountName | THOYSLAB\jlee012 | The whole domain |
| UPN | jlee012@thoyslab.local | The whole forest |

## 3. SRV record not found

**Cause.** The script changed the DNS server and immediately queried the SRV record. The query went out before the setting took effect, failed, and **the failure stayed in the cache.** DNS caches failures as well as successes (negative caching).

**Fix.** `Clear-DnsClientCache`, then retry. I also split the check into "can we reach the DC (TCP 389)" and "does the record come back (SRV lookup)," each retried 10 times at 3-second intervals. The causes are completely different, and so are the fixes.

## 4. `Credential` argument is null

**Cause.** The prompt from `Get-Credential` **hid behind the VM console window** and was cancelled with no input.

**Fix.** Retry the prompt twice, and if it is still empty, fall back to console input with `Read-Host -AsSecureString`. No window pops up, which makes it safer in remote and console sessions.

## 5. `running scripts is disabled on this system`

**Cause.** A script that ran fine on the server was blocked on the client. The default execution policy on Windows Server is `RemoteSigned`; on clients it is `Restricted`.

**Fix.** Set CL1's execution policy to `RemoteSigned`.

**Note.** Execution policy is a **guard against mistakes, not a security control**. `-ExecutionPolicy Bypass` gets around it any time. If you really need to block execution, use AppLocker or WDAC.

## 6. `The directory service is busy`

**Cause.** I passed `-NewName` to `Add-Computer`, joining the domain and renaming in one step. The rename request overlapped with AD processing the join, and only the second part failed. The join itself had already succeeded.

**Fix.** Split the join and the rename, wait in between, and retry. When writes to the same object overlap, AD rejects the later request. Waiting and retrying is the standard answer.

## 7. First login says "the password is incorrect"

**Cause.** The account had "User must change password at next logon" set. Hyper-V **Enhanced Session mode is RDP under the hood**, and RDP checks credentials with Network Level Authentication (NLA) before it shows the desktop. An account that must change its password is rejected at that step, but the user just sees "the password is incorrect." On a real console, the password-change screen would have appeared.

**Fix.** Turn off Enhanced Session, log in on the basic console and change the password. After that, Enhanced Session logins worked normally.

**Lesson.** This is exactly the cause behind the help desk classic: "the new hire can't do their first login remotely."

## Summary

| Symptom | Real cause | Layer |
|---|---|---|
| Syntax error | File encoding | File |
| Duplicate name | Uniqueness scope of identifiers | AD |
| No SRV record | Negative caching | DNS |
| Null credential | Prompt hidden behind a window | UI |
| Execution blocked | Server vs. client defaults | Policy |
| Service busy | Overlapping writes to the same object | AD |
| Wrong password | RDP plus the password-change flag | Authentication |

Not one of the seven error messages told me the actual cause. From the next part on, the lab becomes something you can actually use: shares go up on FS1, which until now was a file server in name only, and a second DC gets built without install media.

---

### Series: "An AD Home Lab on One Laptop"

0. [Home lab AD domain names: where `.local` gets you stuck later](/blog/en/ad-domain-naming/) (prologue)
1. [Design — one laptop, one domain](/blog/en/adlab-01-design/)
2. [Build — from DC promotion to a domain login](/blog/en/adlab-02-build/)
3. [Seven places I got stuck](/blog/en/adlab-03-pitfalls/)
4. [A file server, and a second DC without an ISO](/blog/en/adlab-04-fileserver-dc2/)
5. [Moving FSMO roles, and how long DNS takes to follow](/blog/en/adlab-05-fsmo/)
6. [The OUs were there, but nothing was linked — Group Policy](/blog/en/adlab-06-group-policy/)
7. [You only know it's redundant when you turn it off — DHCP failover](/blog/en/adlab-07-dhcp-failover/)
8. [Moving the whole lab to another PC](/blog/en/adlab-08-migration/)
