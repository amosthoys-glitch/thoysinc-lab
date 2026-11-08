---
title: 'AD Home Lab, Part 8: Moving the Whole Lab to Another PC — Commands That Succeeded, Results That Failed'
description: 'Exporting three VMs (84.3GB) — a DC, a file server and a client — and importing them on another laptop. Zero compatibility issues, yet I got stuck in four places: a sealed vTPM, execution policy, one misdiagnosis, and VMs still holding an ISO on a USB drive.'
pubDate: 'Nov 08 2026'
lang: 'en'
translation: 'adlab-08-migration'
tags: ['active-directory', 'homelab', 'hyper-v', 'migration', 'vtpm']
---

> Environment: Hyper-V on Windows 11 (build 26200) → Hyper-V on Windows 11 (build 26200) · VM configuration version 12.0
>
> Series "An AD Home Lab on One Laptop," part 8 of 8 · done 2026-08-21 · about 2 hours

This one goes back a little in time. The day after finishing [part 2](/blog/en/adlab-02-build/), I moved the lab to a bigger laptop. Everything from [part 4](/blog/en/adlab-04-fileserver-dc2/) on was done on the new machine.

## Why I moved it — disk space

The first laptop had a 256GB internal disk. I tried squeezing the VHDX files with `Optimize-VHD`, but got back only 6.85GB. The VHDX sizes were almost the same as the guests' real usage, so there was nothing left to squeeze, and the lab actually needed more than 80GB.

|  | Source | Destination |
|---|---|---|
| CPU | Core Ultra 5 235U | Core i7-1195G7 · 4C/8T |
| Memory | 32GB | 32GB |
| C: free | 29GB | 832.9GB |
| Windows | 11 · 26200 | 11 · 26200 |

**Both machines ran the same Windows build**, so VM configuration version 12.0 could come over as is. The most common cause of migration failure simply was not there. The new machine's home router subnet (192.168.0.x) did not overlap the lab subnet (192.168.100.0/24) either.

## Before the move

- **Disable CL1's vTPM** (`Disable-VMTPM`). The vTPM's key protector is tied to the host, so if you move it as is, CL1 refuses to boot. CL1's disk was encrypted, but protection was off and there was no key protector, so it was not bound to the TPM
- **Export everything** — 3 VMs, 84.3GB, to an external USB disk in 15 minutes
- **Pre-check with `Compare-VM`** — 0 compatibility issues on all three
- **Keep the original VMs off after the move.** If the same DC runs in two places at once, a USN rollback breaks the domain

## On the receiving side

1. Turn on Hyper-V → add my account to Hyper-V Administrators → rebuild the virtual switch and NAT
2. Import — CL1 5.3 min, DC1 6.8 min, FS1 4.4 min, 16.5 min total
3. Start in order, **DC1 first** — DC1 answered LDAP within 40 seconds
4. Check the clocks — 3 to 6 seconds off the host. Within Kerberos's 5-minute tolerance, so no resync needed
5. Health check — 6 core services, the SYSVOL and NETLOGON shares, and all 5 FSMO roles healthy
6. Domain login — logged in to CL1 with a domain account and confirmed a Kerberos ticket was issued

## Four places I got stuck

The failures I expected (missing permissions, subnet collisions, a changed USB drive letter) were all handled in advance. The places I actually got stuck were four I did not expect, and three of them were the **command succeeded, result failed** kind.

### 1. CL1 won't start — `authentication tag (0xC000A002)`

The import script ended by re-enabling the vTPM "for the new host." Both commands — creating a new key protector and enabling the vTPM — printed **success**. But the new key protector cannot open vTPM state sealed on the original host, so the VM worker process could not start.

After `Disable-VMTPM -VMName CL1`, it started normally right away. Windows 11 checks for a TPM as an install requirement, but once installed it boots without one. I changed the script to turn the vTPM off instead of back on.

### 2. `running scripts is disabled on this system`

The new machine had the default execution policy, Restricted. On top of that, `.ps1` files downloaded from OneDrive carry a **Mark of the Web (Zone.Identifier)**, which blocks them even under RemoteSigned. For a one-off, use `powershell -ExecutionPolicy Bypass -File <path>`; to fix it for good, change the policy in an elevated window and also run `Unblock-File`.

### 3. FS1 not answering on 445 — a misdiagnosis

FS1 did not answer ping, 135, 139 or 445; only WinRM (5985) was open. I assumed the firewall profile had been set to Public and rebooted FS1, but nothing changed.

In fact it was **never a problem.** FS1's profile was DomainAuthenticated, and having the file-sharing inbound rules off is **the default on a Windows Server with no shares** (at this point I had not created any shares yet). Only DC1 had 445 open because promotion created the SYSVOL and NETLOGON shares, which opened it automatically.

One `Get-NetConnectionProfile` would have settled it in 3 seconds. Before guessing a cause from the symptoms, **check whether you can query the cause directly.**

### 4. All three VMs were holding an ISO on the USB drive — a delayed failure

There were no symptoms. Import, startup and verification all passed. I found it while checking whether the USB drive could be removed: the virtual DVD drives of all three VMs still pointed at the install ISO paths on the USB drive. Unplug the drive in that state, and the next time a VM starts it cannot find the path and refuses to boot.

Installation was long finished, so I ejected the media. There was a trap here too.

```powershell
# Fails silently — no error, and the path is still there
Get-VMDvdDrive -VMName DC1 | Set-VMDvdDrive -Path $null

# You must give the controller number and location for it to really eject
foreach ($v in 'DC1','FS1','CL1') {
    $d = Get-VMDvdDrive -VMName $v
    Set-VMDvdDrive -VMName $v -ControllerNumber $d.ControllerNumber `
        -ControllerLocation $d.ControllerLocation -Path $null
}
```

**Lesson.** Verifying right after the move is not enough. **References to temporary resources** — a USB drive, a network share, mounted media — only show up the moment that resource disappears. Before removing external media, query every DVD drive, disk, configuration and checkpoint path.

## Wrap-up — cleaning up the copies is part of the move

Right after the import there were four copies: the live VMs on the new host (production), this export on the USB drive (the only external backup), the day-one backup on the USB drive, and the originals on the old laptop. The day-one backup was a subset of this export, so I deleted it — but before deleting, I used `Get-VHD` to confirm that none of the three locations had **a differencing-disk chain (no Parent)**. Had there been a chain, deleting one would have broken the others with it. The VMs on the old laptop were deleted later, freeing 84GB.

## Closing the series

Looking back over eight parts, one lesson kept repeating: **check the result, not the output.** A command that printed "success" and did half the job (part 5), a policy that said "applied" and did nothing (part 6), redundancy that showed Normal but was unproven until I turned it off (part 7), and a vTPM change that succeeded but left the VM unable to start (this part). The build procedures are all in the documentation. What the documentation does not have are moments like these.

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
