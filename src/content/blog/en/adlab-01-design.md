---
title: 'AD Home Lab, Part 1: Design — One Laptop, One Domain'
description: 'What I settled on paper before building a DC, a file server and a client with Hyper-V on a single Windows 11 laptop: internal switch and NAT, IP rules, storage placement, and memory allocation.'
pubDate: 'Nov 07 2026'
lang: 'en'
translation: 'adlab-01-design'
tags: ['active-directory', 'homelab', 'hyper-v', 'networking']
---

> Environment: Windows 11 Pro host (build 26200) · Hyper-V · Windows Server 2025 Evaluation (build 26100) · Windows 11 Enterprise Evaluation 25H2
>
> Series "An AD Home Lab on One Laptop," part 1 of 8 · built 2026-08-20

In August I rebuilt my Active Directory home lab from scratch. The goal was simple: **log in to another computer with an ordinary user account created on the domain controller.** That is the core of what AD does; everything else sits on top of it.

This series walks through the build in order. Part 1 covers what I decided on paper before creating a single VM.

## Layout — a domain that lives entirely inside one host

```
Host · Windows 11 Pro · 32GB
 ├─ LabNAT ─────────── path to the internet
 └─ LabSwitch (Internal) 192.168.100.1/24
     ├─ DC1  192.168.100.10   AD DS · DNS · DHCP   static · 4GB
     ├─ FS1  192.168.100.11   file server          static · 2GB
     └─ CL1  192.168.100.101  Windows 11 Enterprise DHCP · 4GB

DHCP scope .100 – .200 / static range for servers .10 – .99
```

**I used an Internal switch** to keep the lab completely separate from my home router (192.168.0.x). DC1 hands out DHCP, and if it shared a subnet with the router, two DHCP servers would fight on the same network. The lab reaches the internet only through the host's NAT.

## The host — measured specs and what they meant

| Item | Spec | Verdict |
|---|---|---|
| CPU | Core Ultra 5 235U · 12C/14T | Plenty |
| Memory | 32GB | Comfortable (VMs total 10GB) |
| Internal disk | 256GB NVMe | **Bottleneck** — 118GB free |
| External disk | 2TB USB HDD | Unsuitable for running VMs |

The bottleneck was disk, not memory. So I split storage by role.

| What | Where | Why |
|---|---|---|
| Two install ISOs (14.2GB) | External HDD | Sequential reads only — an HDD is fine |
| VMs · VHDX | Internal NVMe | Random I/O — needs an SSD |
| VM export backups | External HDD | Sequential writes — an HDD handles them well |

It mattered that the external drive was a **USB hard disk**, not an SSD. Its random I/O is weak, so running VMs from it makes even the install slow, and if the disk spins down for power saving there is a real risk of corrupting the VHDX. With this split, the full 118GB on the internal disk went to the VMs, and actual usage when the build was finished was about 55GB.

## Lab design — real-world rules, unchanged

| Hostname | IP | Method | Memory (dynamic) | Role |
|---|---|---|---|---|
| DC1 | .10 | Static | 4GB (2–6) | AD DS · DNS · DHCP |
| FS1 | .11 | Static | 2GB (1–4) | File server |
| CL1 | .101 | DHCP | 4GB (2–8) | Client |

- **Servers get static IPs, clients get DHCP.** Starting the DHCP scope at .100 leaves .10–.99 free for servers
- **Dynamic memory everywhere.** Starting at 10GB total still leaves more than 20GB on the host
- **Generation 2 VMs, dynamically expanding VHDX.** Automatic checkpoints are off; left on, a checkpoint piles up every time a VM starts and eats the disk
- **vTPM is enabled on CL1.** Without it, Windows 11 setup refuses to install. (This vTPM causes trouble again in part 8, when the lab moves to another PC)

### Domain name

I named the lab domain `thoyslab.local` and did not use the real domain I own, `thoysinc.com`. If the lab's DNS zone overlaps a real domain, then later, on the same network, the lab DNS can answer for the real services and send clients to the wrong place.

That said, `.local` was not the best choice either. It brings problems such as mDNS conflicts and no way to get public certificates. I wrote that up separately in the prologue, [the home lab AD domain name post](/blog/en/ad-domain-naming/).

## What you need — two evaluation ISOs

- **Windows Server 2025 Evaluation** (build 26100, about 7.6GB)
- **Windows 11 Enterprise Evaluation 25H2** (build 26200, about 6.6GB)

Both are free from the Microsoft Evaluation Center. After downloading, mount each one and confirm that `setup.exe` and `sources\install.wim` are there; that saves you from getting stuck mid-install on "can't find the image."

## Preparing the host — two things

1. **Turn on Hyper-V** (elevated PowerShell, reboot required)

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All -All
```

2. **Add your account to the Hyper-V Administrators group.** Members can create and start VMs and send commands into VMs with PowerShell Direct without opening an elevated window. Most lab work can then happen in a normal window, which saves a lot of clicking. Sign out and back in after adding yourself for it to take effect.

## Next time

With the design done, next comes the build: nine scripts to create the virtual switch, promote DC1, create 100 users, and log in from the client with a domain account.

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
