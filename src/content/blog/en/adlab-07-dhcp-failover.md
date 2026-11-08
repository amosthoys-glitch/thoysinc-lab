---
title: "AD Home Lab, Part 7: You Only Know It's Redundant When You Turn It Off — DHCP Failover"
description: 'Pairing DHCP, which ran only on DC1, with DC2 in hot standby, then actually stopping the primary to see whether the client gets the same address from the standby. Plus why "communication interrupted" and "partner down" are different states.'
pubDate: 'Nov 07 2026'
lang: 'en'
translation: 'adlab-07-dhcp-failover'
tags: ['active-directory', 'homelab', 'dhcp', 'high-availability', 'powershell']
---

> Environment: Windows Server 2025 DHCP · DC1 (primary) · DC2 (standby) · single site
>
> Series "An AD Home Lab on One Laptop," part 7 of 8 · built 2026-08-22

Six stages went by with DHCP on DC1 alone. My design notes called it "the most urgent redundancy," yet I had never touched it.

## Why now — not because it is urgent, but because it is cheap

When a DHCP server dies, **nothing breaks immediately.** Clients only try to renew after 50% of the lease has passed, so with an 8-day lease the existing devices do not notice the server being off for a few hours. Only devices that boot fresh or connect for the first time fail to get an address.

So "most urgent" was the wrong phrase. The accurate one is **"the cheapest redundancy you can get."** DC2 already exists, and failover needs no extra license or hardware. A few lines of configuration remove a single point of failure, so there is simply no reason to wait. When you set priorities, "how risky is it" and "how cheap is it" are different axes. Mixing them up muddies the judgment.

## Setup

1. **Install the DHCP role on DC2.** DC2 was cloned from FS1, so it had no DHCP
2. **Authorize the DHCP server in AD.** An unauthorized DHCP server cannot hand out addresses in a domain environment
3. **Create the failover relationship.** The scope replicates to DC2 automatically, so there is no need to create it there

```powershell
Add-DhcpServerv4Failover -ComputerName DC1 -PartnerServer DC2 `
    -Name 'DC1-DC2-Failover' -ScopeId 192.168.100.0 `
    -ServerRole Active -ReservePercent 5 `
    -MaxClientLeadTime 01:00:00 -AutoStateTransition $true -StateSwitchInterval 01:00:00
```

```
Mode            HotStandby     DC1 = Active / DC2 = Standby
State           Normal         (both sides)
Reserve         5%             the standby's share during an interruption
MCLT            1 hour
Auto transition on · full takeover after 60 minutes
```

**Hot standby and load balance are mutually exclusive.** In hot standby, the primary handles everything normally and the standby takes over when it dies. In load balance, the two split the work by ratio. With one site and the servers side by side, hot standby is simpler and easier to trace — there is normally only one answer to "which server gave out this address?"

### Where I got stuck — `Parameter set cannot be resolved`

At first I passed `-LoadBalancePercent` (load balance only) together with `-ServerRole` and `-ReservePercent` (hot standby only). The two modes are different **parameter sets** and cannot be mixed. The error message does not say which parameter is the problem, so start by counting the syntax blocks in `Get-Help Add-DhcpServerv4Failover`. Multiple syntax blocks are the sets.

## The failover test — I actually turned it off

**Before the test, the lease databases were in sync.** Once the failover relationship exists, lease information replicates to both sides in real time, so the standby never re-issues an address that is already out.

```
DC1 leases: 4       DC2 leases: 4
  192.168.100.100     192.168.100.100
  192.168.100.101     192.168.100.101
  192.168.100.102     192.168.100.102
  192.168.100.103     192.168.100.103
Exact match
```

**Stop DC1 → client asks again.**

```
DC1 DHCPServer service stopped
DC2 state       Normal → CommunicationInterrupted   (detected automatically)
On CL1: ipconfig /release; ipconfig /renew
  IP received   192.168.100.102     (same address kept)
  Lease server  192.168.100.12      ← DC2 took over
```

The client noticed nothing. It got the same address, and the only sign that a different server answered was the `DHCP Server` value. When I started DC1's service again, both sides returned to Normal with no manual intervention.

## The state machine — "communication interrupted" is not "partner down"

| State | Meaning | What the standby does |
|---|---|---|
| Normal | Both healthy | Issues nothing (the primary handles it all) |
| CommunicationInterrupted | Lost contact with the partner | Issues only from the reserve (5%) |
| PartnerDown | Partner judged to be dead | Issues from the whole scope |

Why not take over everything at once? If you do not distinguish a brief disconnect from a real death, then when the primary comes back there is a risk that **both servers issued the same address**. So when contact is lost, the standby first uses only its reserve, and moves to full takeover only after the configured time (60 minutes here). MCLT is that safety mechanism.

If it is urgent, you can switch to PartnerDown by hand, and that is what you do in real outage response. But **first confirm the primary is really dead.** Forcing the switch while it is still alive creates a worse problem: duplicate addresses.

## Wrap-up

The habit I took from this stage is **"turn it off."** If I had configured it and only checked that the state was Normal, I would not know whether it actually fails over. Really stopping the primary and getting an address again on the client was the heart of this stage. Automatic failover that has never been exercised often does not work when you need it. Redundant internet circuits follow the same rule.

The last part goes back a little in time: moving this whole lab, all three VMs, to another PC.

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
