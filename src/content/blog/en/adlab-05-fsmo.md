---
title: 'AD Home Lab, Part 5: Moving FSMO Roles, and How Long DNS Takes to Follow'
description: 'Moving the five roles to DC2 and back. The transfer was one line, but before clients noticed there were four layers of delay: cache, a record gap, AD replication and zone polling. Plus transfer vs. seize.'
pubDate: 'Nov 07 2026'
lang: 'en'
translation: 'adlab-05-fsmo'
tags: ['active-directory', 'homelab', 'fsmo', 'dns', 'replication']
---

> Environment: Windows Server 2025 · single domain · two DCs (DC1 and DC2, both GCs)
>
> Series "An AD Home Lab on One Laptop," part 5 of 8 · built 2026-08-22

Once [part 4](/blog/en/adlab-04-fileserver-dc2/) gave me two DCs, a new exercise became possible for the first time: moving the FSMO roles to another DC. The transfer itself was one line. The trouble came after.

## The five roles

AD is mostly multi-master: create a user on any DC and it replicates to the rest. But **five operations must never happen on two DCs at once**, so one DC owns each of them. Those are the FSMO roles.

| Role | Scope | What breaks right away without it |
|---|---|---|
| Schema master | Forest | Schema changes (e.g. installing Exchange) |
| Domain naming master | Forest | Adding or removing domains |
| PDC emulator | Domain | Immediate password changes, account lockout, time source, default target for GPO editing |
| RID master | Domain | New accounts cannot be created once the RID pool runs out |
| Infrastructure master | Domain | Cross-domain group member references go stale |

Of the five, **only the PDC emulator is different.** You would not notice the other four missing for days — nobody changes the schema daily. The PDC is the path that password changes and lockouts flow through in real time, so a failure shows up to users immediately. That is the answer to "which FSMO role matters most."

## The transfer

Following a common real-world layout, I moved the two forest roles (schema and naming) to DC2, then the PDC emulator as well.

```powershell
Move-ADDirectoryServerOperationMasterRole -Identity DC2 `
    -OperationMasterRole SchemaMaster, DomainNamingMaster, PDCEmulator
```

**I asked both DCs.** FSMO ownership is replicated data too, so asking only one side can show a stale value. Using `-Server`, I queried DC1 and DC2 separately and confirmed the two answers matched.

## Four layers of delay

Right after moving the PDC to DC2, CL1 and FS1 still answered **DC1 as the PDC**. In AD it was already DC2, but the clients were saying something else. Peeling it back one layer at a time, there were four layers of delay.

### Layer 1 · Client cache

Clients cache the DC they found, because finding one fresh every time would slow down logons. `/force` made them ignore the cache and look again.

### Layer 2 · A record gap — `Status = 1355 ERROR_NO_SUCH_DOMAIN`

Forced to look again, the client now said the domain did not exist. The `_ldap._tcp.pdc._msdcs.thoyslab.local` record was **missing entirely**. DC1, no longer the PDC, had removed its registration, and DC2 had not added its own yet. I re-registered it on the new PDC with `nltest /dsregdns`. Left alone, Netlogon registers it by itself within 60 minutes, but until then everything that finds the PDC through DNS fails.

### Layer 3 · AD replication

`nltest /dsregdns` reported success, yet querying DC1 still showed nothing. The record existed **only in DC2's copy**. The `_msdcs` zone is AD-integrated (forest-wide), so records are stored as AD objects and must ride AD replication to reach other DCs. I pulled replication with `repadmin /syncall /AdeP`.

### Layer 4 · Zone polling

With replication done, AD had the new record, but that DC's **DNS service was still giving the old answer**. A DNS server periodically re-reads AD-integrated zones into memory (about every 3 minutes by default). `dnscmd /zoneupdatefromds` forced an immediate reload and the value changed. "AD has it, but DNS doesn't know" is a real state.

## The full procedure

```powershell
# 1. Move the role
Move-ADDirectoryServerOperationMasterRole -Identity DC2 -OperationMasterRole PDCEmulator
# 2. Re-register DNS on the new role holder
nltest /dsregdns
# 3. Force AD replication (the records are AD objects)
repadmin /syncall /AdeP
# 4. If the other DC's DNS service still has the old value, reload now
dnscmd /zoneupdatefromds _msdcs.thoyslab.local
# 5. Check while ignoring the client cache
nltest /dsgetdc:thoyslab.local /pdc /force
```

Steps 2–4 resolve themselves if you wait: Netlogon 60 minutes, DNS polling 3 minutes, client cache 15 minutes. The value of this procedure is less about saving time than about **knowing that a "the role moved, so why doesn't it work?" window exists.** Without knowing that, you mistake normal behavior for an outage and go fix the wrong thing.

Verification ended like this: on both CL1 and FS1, `nltest /pdc /force` → `\\DC2.thoyslab.local`, secure channel healthy. Then I moved the three roles back to DC1 with the same procedure to return to the baseline.

## Transfer vs. seize

|  | Transfer | Seize |
|---|---|---|
| Precondition | Both DCs are alive | The old role holder is permanently dead |
| Process | The two DCs agree and hand over | Taken unilaterally |
| Afterward | Nothing | Remove the old DC from AD with `ntdsutil` metadata cleanup |
| Risk | None | Turn the old DC back on and two DCs hold the same role — the domain breaks |

I did not do a seize this time. It cannot be undone, and afterward DC2 would have had to be thrown away. If you want to practice it, take a checkpoint first and roll back when you are done.

```powershell
Checkpoint-VM -Name DC1, DC2 -SnapshotName 'Before FSMO seize exercise'
# ... exercise ...
Restore-VMSnapshot -VMName DC1 -Name 'Before FSMO seize exercise' -Confirm:$false
Restore-VMSnapshot -VMName DC2 -Name 'Before FSMO seize exercise' -Confirm:$false
```

Once again I hit the same trap: **the command printed success, but only half the result was actually there.** Without the habit of querying the resulting state directly instead of trusting the output, I would not even have known which of the four layers it stopped at. Next time: Group Policy, finally linked to the OUs that had sat empty since part 1.

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
