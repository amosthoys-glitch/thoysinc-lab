---
title: 'AD Home Lab, Part 6: The OUs Were There, but Nothing Was Linked — Group Policy'
description: 'A lockout threshold of 0, users typing share paths by hand, and every permission concentrated in Domain Admins. Filling those gaps with password and lockout policy, per-OU baselines, GPP drive maps and help desk delegation.'
pubDate: 'Nov 07 2026'
lang: 'en'
translation: 'adlab-06-group-policy'
tags: ['active-directory', 'homelab', 'group-policy', 'delegation', 'powershell']
---

> Environment: Windows Server 2025 · GPMC · GroupPolicy PowerShell module · Windows 11 Enterprise client
>
> Series "An AD Home Lab on One Laptop," part 6 of 8 · built 2026-08-22

The OU structure I built so carefully in [part 2](/blog/en/adlab-02-build/) had not had a single policy linked to it all the way to this point.

## Pre-check — by query, not by memory

Instead of listing what I had done, I queried **what was missing**. That was the more accurate way to decide what to do next.

| Item | Result |
|---|---|
| GPOs | Only the 2 defaults, 0 created by me |
| Account lockout | Threshold 0 — never locks no matter how many wrong tries |
| Minimum password length | 7 characters (default) |
| AD Recycle Bin | Disabled |
| Sites and subnets | No subnets defined |

## Policies created

| GPO | Linked to | Settings |
|---|---|---|
| Default Domain Policy | Domain root | Minimum 12 characters · 15-minute lockout after 5 failures |
| Lab - Workstation Baseline | OU=Workstations | Hide last user name · 15-minute screen lock |
| Lab - Server Baseline | OU=Servers | Logon banner |
| Lab - Department Drive Maps | OU=Users | 6 department drives |

**Password and lockout policy only works at the domain root.** Linked to an OU, it applies only to local accounts on that OU's computers and has no effect on domain accounts. If departments need different password policies, use a **fine-grained password policy (PSO)**, not a GPO. "I linked a password policy to the OU, why doesn't it apply?" is working as designed.

I had heard that `Set-ADDefaultDomainPasswordPolicy` only changes the AD attributes and gets reverted at the next GPO refresh, so I checked. In fact it also updates `GptTmpl.inf` in the Default Domain Policy and bumps the GPO version (0 → 4). The values held after `gpupdate /force`.

## Drive mapping — with GPP, in one GPO

Users had been typing paths like `\\FS1\IT` by hand to reach the shares built in [part 4](/blog/en/adlab-04-fileserver-dc2/). Now they map automatically at logon. Group Policy Preferences (GPP) **item-level targeting** lets one GPO hold all six department conditions.

```
I:  →  \\FS1\IT               condition: member of GG-IT
F:  →  \\FS1\Finance          condition: member of GG-Finance
H:  →  \\FS1\HR               condition: member of GG-HR
O:  →  \\FS1\Operations       condition: member of GG-Operations
K:  →  \\FS1\Store-Chandler   condition: member of GG-Store-Chandler
P:  →  \\FS1\Store-Phoenix    condition: member of GG-Store-Phoenix
```

### The trap — GPP cannot be created from the command line

GPMC builds drive maps for you in the GUI, but the PowerShell GroupPolicy module has **no cmdlets for GPP at all.** To script it, you have to do three things yourself:

1. Write `Drives.xml` into the GPO's folder in SYSVOL
2. Register the drive-mapping client-side extension (CSE) GUID in the GPO's `gPCUserExtensionNames`
3. Bump the GPO version (`versionNumber` and `GPT.INI`)

**Miss any one of them and it fails silently, with no error.** The policy list says "applied," but the drives never map. The version has to change because clients decide whether anything changed by the version number. The high 16 bits are the user version and the low 16 bits the computer version, so if you changed only user settings, bump only the high part.

## Delegation — only as much as needed

Up to here, doing anything in this domain required being a Domain Admin. In a real organization, password resets and unlocks are half the day's work, but you cannot hand out Domain Admin for that.

The structure is AGDLP, just like the shares. Users go into `GG-Helpdesk`, that goes into `DL-Delegate-UserSupport`, and permissions go only on the DL group, **scoped to OU=Users only**.

| Permission | What it allows |
|---|---|
| Reset Password | Reset a user's password |
| Write pwdLastSet | Set "change password at next logon" |
| Write lockoutTime | Unlock a locked account |

**Adding someone to the built-in Account Operators is not delegation.** That group can create and delete users, groups and computers across the whole domain, and you cannot narrow its scope to an OU.

I verified in both directions:

- **Does it reach where it should?** — the three permissions appear as "inherited" on actual user objects in the Finance OU. The most common failure is permissions that land on the OU but, with the wrong inheritance scope, never reach the user objects
- **Does it leak?** — 0 permissions on the built-in Administrator, computer accounts, the domain root and the Groups OU. In particular, **if the built-in Administrator falls inside the scope**, the help desk can change the domain admin password. That is not delegation; it is a privilege-escalation path

## Did it apply? — by registry value and a real lockout

- **Did policy split by OU?** — CL1 has `dontdisplaylastusername = 1`, FS1 has `0` and shows the logon banner. I checked the registry values instead of trusting "applied" in `gpresult`
- **Does lockout really happen?** — 6 attempts with a wrong password → locked True, 5 failures, Security log event 4740 recorded, unlocked with `Unlock-ADAccount`
- **Do the drives map?** — drive maps are processed only at interactive logon, so I logged in on the console and checked the `I:` drive. That one check proves the whole chain: SMB, AGDLP permissions, firewall and targeting

## The same mistake twice

During the check I also found an error in my earlier notes. Seeing that the gateway (192.168.100.1) did not answer ping, I had written "it's an internal switch, so VMs can't get out; external NTP is impossible." That was wrong. NAT was configured correctly on the host, and the VMs could make outbound 443 connections and query external time. Ping failed only because the host firewall blocks ICMP.

I wrote "a failed ping is not an outage" in [part 2](/blog/en/adlab-02-build/) and still repeated it. Knowing something and having it as a habit are different. Check reachability with `Test-NetConnection -Port`, against the real service port.

Next time: making DHCP, which ran only on DC1, redundant — and actually turning off the primary server.

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
