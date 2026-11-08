---
title: 'AD Home Lab, Part 2: Build — From DC Promotion to a Domain Login'
description: 'Virtual switch and NAT, three VMs, promoting DC1, OUs and 100 users, DHCP, and joining the server and client to the domain — nine scripts, four hours. Plus how I confirmed "it works" from outside the VMs.'
pubDate: 'Nov 07 2026'
lang: 'en'
translation: 'adlab-02-build'
tags: ['active-directory', 'homelab', 'hyper-v', 'powershell', 'dns', 'dhcp']
---

> Environment: Windows Server 2025 Standard (Desktop Experience) · Windows 11 Enterprise · Hyper-V on Windows 11 Pro
>
> Series "An AD Home Lab on One Laptop," part 2 of 8 · built 2026-08-20 · about 4 hours

This is the record of actually building the design from [part 1](/blog/en/adlab-01-design/). Every step is a PowerShell script, written to be **safe to run again (idempotent)**. If something fails halfway, run it again from the top: it skips what is already done and finishes the rest.

## Build order — nine scripts

| No. | What it does | Runs on |
|---|---|---|
| 01 | Default VM paths, internal switch `LabSwitch`, 192.168.100.1 on the host vNIC, NAT | Host |
| 02 | Create 3 VMs — Gen2, dynamic memory, dynamic VHDX, auto checkpoints off, vTPM on CL1 | Host |
| 03 | Rename DC1 → static IP → install AD DS and DNS → create the forest | DC1 |
| 04 | Bulk-create OUs, security groups and 100 users | DC1 |
| 05 | DHCP scope .100–.200, gateway and DNS options | DC1 |
| 06 | FS1 static IP → SRV record pre-check → domain join | FS1 |
| 07 | CL1 gets DHCP, DNS check → domain join | CL1 |
| 10 | Enable Guest Service Interface and copy the scripts into the VMs with `Copy-VMFile` | Host |
| 20 | Export all VMs to the external disk (backup) | Host |

A few points worth calling out:

- **Script 03 goes through two reboots** — one after the rename, one after promotion. So each stage checks the current state and picks up where it left off
- **The key in script 05 is the DNS option.** Clients must get DC1 as their DNS server, not the home router, or they will not find the domain
- **Scripts 06 and 07 check DNS before joining.** If they cannot find the `_ldap._tcp.dc._msdcs` SRV record, they stop instead of attempting the join, so the cause of a failure is obvious right away. Script 07 also stops if it gets an APIPA (169.254.x.x) address, because that means DHCP did not answer
- **Script 10 removes the clipboard from the process.** Instead of pasting scripts into the VM console, the host pushes the files directly into the VM

## Directory structure — modeled on a multi-store retailer

```
thoyslab.local
└── OU=Thoys
    ├── OU=Users
    │   ├── OU=IT               18 users
    │   ├── OU=Finance          17 users
    │   ├── OU=HR                7 users
    │   ├── OU=Operations       16 users
    │   ├── OU=Store-Chandler   20 users
    │   └── OU=Store-Phoenix    22 users
    ├── OU=Computers
    │   ├── OU=Workstations
    │   └── OU=Servers
    └── OU=Groups
        └── GG-IT, GG-Finance, GG-HR, GG-Operations,
            GG-Store-Chandler, GG-Store-Phoenix
```

Splitting departments down to the store level was done with Group Policy in mind. With GPOs linked to OUs, you can practice real scenarios like mapping a different drive for each store or deploying tools only to the IT department.

The 100 users are random combinations from first-name and last-name lists, but with a **fixed random seed**. Delete the lab and rebuild it, and you get the same roster. Every account has "User must change password at next logon" set. That blocked my first login once; the story is in [part 3](/blog/en/adlab-03-pitfalls/).

## Verification — from outside the VMs, not inside

A "success" message printed inside the server you just built is weak evidence. **I only counted what could be confirmed separately from the host.**

### AD service ports

```
192.168.100.10   53 DNS · 88 Kerberos · 389 LDAP
                 445 SMB · 464 kpasswd · 3268 Global Catalog   all open
```

### DNS registration — proof of the domain join

```
_ldap._tcp.dc._msdcs.thoyslab.local  →  dc1.thoyslab.local:389

dc1.thoyslab.local  →  192.168.100.10
fs1.thoyslab.local  →  192.168.100.11
cl1.thoyslab.local  →  192.168.100.101
```

A workgroup computer cannot register its own record in AD-integrated DNS. **The fact that the record exists proves it is an authenticated domain member.** And the SRV record is how clients find a DC, so most domain-join failures come down to not finding this record.

### Final — logging in to the client with a domain account

```
CL1 logon: THOYSLAB\jlee012  (IT department test user)
Password change at first logon completed
```

Logging in to another computer with an account created on the DC. That is where the goal set in part 1 is met.

### No ping reply does not mean it is broken

From the host, DC1 answered ping but FS1 and CL1 did not. When a server is promoted to a DC, the firewall rules for AD services open and ICMP is allowed along with them, but ordinary members block it by default. "It doesn't ping, so the server is down" is a common misdiagnosis. Checking service ports (`Test-NetConnection -Port`) or DNS records is more accurate.

> Even after writing this lesson down, I made the same mistake again in step 5. That story is in [part 6](/blog/en/adlab-06-group-policy/).

## Wrap-up — back up first

After finishing this far, and before starting the break-things exercises, I exported all three VMs to the external disk. 61GB for the three, 10 minutes. Restoring is one line: `Import-VM -Path <vmcx> -Copy -GenerateNewId`.

Next time: the seven places I actually got stuck during these four hours. Personally, I think that is worth more than the build procedure.

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
