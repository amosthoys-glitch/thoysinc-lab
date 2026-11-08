---
title: 'AD Home Lab, Part 4: A File Server, and a Second DC Without an ISO'
description: 'Setting up AGDLP shares on FS1, which had been a file server in name only, and building a second domain controller with no install media by cloning an existing server and running sysprep. Plus the problems where a setting lived on the wrong layer.'
pubDate: 'Nov 07 2026'
lang: 'en'
translation: 'adlab-04-fileserver-dc2'
tags: ['active-directory', 'homelab', 'file-server', 'hyper-v', 'sysprep', 'dns']
---

> Environment: Windows Server 2025 · Hyper-V · PowerShell Direct
>
> Series "An AD Home Lab on One Laptop," part 4 of 8 · built 2026-08-21

Through [part 2](/blog/en/adlab-02-build/), the lab had one DC. It worked, but if DC1 stopped, the whole domain stopped, and the "replication" line in my health-check script was always empty. This time there were two goals: **make the file server actually serve files, and make the DCs redundant.**

> I did this work after moving the lab to a bigger PC. The move itself is covered in [part 8](/blog/en/adlab-08-migration/).

## File server — there were no shares at all

While running the health check, I found that FS1 had no shares. The build script only set a static IP and joined the domain; it never installed the File Server role or created any shares. It was a file server in name only.

I set up permissions with **AGDLP**.

```
A  100 users
└ G  global groups  GG-IT …             (6 departments)
   └ DL domain local groups  DL-Share-IT-RW / -RO …  (12)
      └ P  permissions  Modify / ReadAndExecute
```

**Permissions are attached only on the far right, to the domain local groups.** Even as departments or file servers grow, the left side stays the same. The IT department was added to the RO group of every department share so it can support the help desk.

| Who | Share permission | NTFS permission |
|---|---|---|
| Domain Admins | Full | Full |
| DL-Share-Dept-RW | Change | Modify |
| DL-Share-Dept-RO | Read | ReadAndExecute |

Between share and NTFS permissions, **the more restrictive one wins**. So I opened share permissions wide and did the real control in NTFS. That puts everything you need to trace permissions in one place. I also turned on **Access-Based Enumeration (ABE)** so people without permission do not even see the folder in the list.

## Cleaning up computer accounts — a container is not an OU

The computer accounts for FS1 and CL1 were both in the default `CN=Computers`, even though part 2 had created `OU=Servers` and `OU=Workstations`.

`CN=Computers` is **a container, not an OU.** You cannot link Group Policy to a container. No matter how well you link a GPO to the server OU, nothing happens if the servers are not under it. It is a common cause of "the domain join worked, but policies don't apply."

```
CN=FS1,CN=Computers  →  CN=FS1,OU=Servers,OU=Computers,OU=Thoys
CN=CL1,CN=Computers  →  CN=CL1,OU=Workstations,OU=Computers,OU=Thoys
```

## The second DC — without install media

When I went to build DC2, there was no Server 2025 ISO anywhere on the new host. Instead of downloading 6GB again, I chose to **clone FS1 and wipe its identity with sysprep**. Stamping out servers from a golden image and adding roles later is a method used in real environments too.

A clone is born with **the same name, the same SID and the same domain account** as the original. So it must never touch the network before `sysprep /generalize` wipes that identity. That fixes the order:

1. **Stop the original and copy the disk** — shut FS1 down cleanly and copy the 26.7GB VHDX (55 seconds)
2. **Create the VM and disconnect the network immediately** — pull the cable first with `Disconnect-VMNetworkAdapter`
3. **Boot and remove traces of the original** — with no network, connect over PowerShell Direct (the VM bus) and remove the shares and the File Server role
4. **unattend.xml + sysprep** — set the computer name DC2, the time zone and an unattended OOBE, then run `/generalize /oobe /shutdown`
5. **Only now connect the network** — on boot, OOBE completes with no human input
6. **Static IP .12 + install the AD DS and DNS roles**
7. **Promote as an additional DC** — this step needs the domain admin password and the DSRM password, so I did it directly at the console

### Verification

- **The machine SID must differ from FS1's.** If it is the same, the domain breaks quietly. A different SID is proof that `/generalize` really ran
- **Replication healthy** — `repadmin /replsummary` shows 7 seconds of latency, 0/5 failures
- **Query DC2 directly** — all 100 users, the 6 GGs, the 12 DLs created that day, and FS1's new OU location are all visible
- **From the client** — CL1 → FS1:445 connects, 6 shares listed (with ABE applied)

## Where I got stuck — settings on the wrong layer

**Port 445 is open but the client can't connect.** The service (LanmanServer) was Running and 445 was listening, but the firewall rule `File and Printer Sharing (SMB-In)` was off. Diagnose these three separately: **is the service running → is the port listening → does the firewall let it through.**

**The DC's DNS was 1.1.1.1 and 8.8.8.8.** DC1's client DNS pointed at public resolvers first — a DC asking servers that know nothing about its own domain. I fixed it to DC1 → DC2, 127.0.0.1 and DC2 → DC1, 127.0.0.1: **each other first, itself second.** The place for public DNS is not the client settings but the DNS server's **Forwarders**.

**`SeSecurityPrivilege` error.** In Windows PowerShell, `Set-Acl` tries to write the audit settings (SACL) even when you only change permissions (DACL), so it demands an admin privilege. Switching to `(Get-Item $Path).SetAccessControl($acl)` or using `icacls` fixes it. After that, all file permissions went in through `icacls`.

**`Copy-VMFile` fails on the new VM (0x80070015).** Guest Service Interface is off by default on a newly created VM. `Enable-VMIntegrationService -Name 'Guest Service Interface'`.

**Three scripts vanished from the host.** My backup sync script ran host → OneDrive **one way only**, so files that existed only in OneDrive were never coming back. They happened to be the scripts DC2 needed. One-way sync is a backup, not a sync.

Most errors in this stage were not "the setting is missing" but **"the setting is on the wrong layer"**: public DNS in the client settings instead of the forwarder, computer accounts in a container instead of an OU. Next time: an exercise made possible by having two DCs — moving the FSMO roles.

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
