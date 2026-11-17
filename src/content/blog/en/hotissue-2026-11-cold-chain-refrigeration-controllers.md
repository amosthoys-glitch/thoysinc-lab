---
title: '[Advisory] Are Your Grocery Refrigeration Controllers Open to the Internet? — CISA and FBI Joint Guidance'
description: 'CISA, the FBI and three other agencies warned about attacks on temperature controllers in grocery stores, cold storage and refrigerated transport. Attackers can change settings remotely and force units into nonstop heating and defrost. Eight things store IT should check now.'
pubDate: 'Nov 16 2026'
lang: 'en'
translation: 'hotissue-2026-11-cold-chain-refrigeration-controllers'
tags: ['security', 'hot-issue', 'ot', 'retail', 'grocery', 'refrigeration']
---

> Scope: CISA joint guidance of November 5, 2026 · Sources are at the end
>
> Affects: temperature controllers and refrigeration monitoring systems in grocery stores, cold storage and refrigerated transport

<p><small>This post contains affiliate links; the blog may earn a commission on purchases at no extra cost to you.</small></p>

**Short version:** If a refrigeration or freezer controller is **reachable straight from the internet**, close it off now. Put these devices on an **OT-only VLAN separate from the store's business network**, **change default passwords**, and **update the firmware**. The warning is that attackers can change settings remotely and force units into **nonstop heating and defrost cycles**.

## What happened

On **November 5**, CISA, the FBI, the Department of Health and Human Services (HHS), the Department of Agriculture (USDA) and the Department of Transportation (DoT) released joint guidance about malicious activity targeting **electronic temperature controllers and commercial refrigeration controllers in retail grocery and cold storage facilities**. These devices handle remote temperature monitoring, temperature logging, defrost cycle management and energy optimization, and they also ride along in refrigerated trucks.

The guidance names **authentication bypass, code injection and weak configurations** as the ways in. By going after controllers that are unpatched or reachable from the internet, attackers can change settings remotely and **keep units stuck in heating and defrost**.

The possible results:

- **Inventory loss** — refrigerated and frozen food spoils
- **Harm to consumers** who eat food that was stored unsafely
- Shorter equipment life and **fire hazards**
- **Losing sight of the actual temperature** — what the guidance calls a "denial-of-view condition"

## Eight things store IT should check now (in the guidance's order)

1. **Remove internet exposure** — don't leave controller panels directly on the internet. If you need remote access, put it behind an up-to-date firewall or edge device
2. **Isolate OT devices** — keep operational technology like refrigeration on **its own VLAN, separate from the business network**
3. **Lock down credentials** — change default passwords, enforce strong password policies, and use phishing-resistant multifactor authentication (MFA) where you can
4. **Patch** — keep firmware current, and have a process to find and replace end-of-life devices
5. **Restrict access** — allow only approved devices and IP addresses (an allowlist)
6. **Back up** — keep configuration backups offline and offsite, and test that they actually restore
7. **Monitor and report** — turn on logging and review it regularly. Where OT devices have no logs or odd formats, capture the network traffic between them
8. **Review setpoint ranges** — set sensible limits on temperature setpoints and alert when something goes outside them

## A note from me

Grocery refrigeration is temperature-sensitive, and without monitoring the product losses can be enormous. That's why, when I worked in supermarkets, the refrigeration manager was always checking the units throughout the day.

If a small store has no monitoring system of its own, a <a href="https://www.amazon.com/s?k=wireless+freezer+temperature+monitor+alarm&tag=thoysinc-20" target="_blank" rel="sponsored noopener">wireless freezer temperature alarm</a> that alerts your phone when the temperature drifts is one option. Those devices sit on the network too, so change their default passwords.

I wrote about how store IT works in [A Month to Open a Store — and IT Stands Behind the Construction Crew](/blog/en/store-opening-pos-pricing/).

## Sources

- [CISA, U.S. Government Partners Urge Hardening of Industrial Refrigeration and Cold Chain Monitoring Systems (2026-11-05)](https://www.cisa.gov/resources-tools/resources/us-government-partners-urge-hardening-industrial-refrigeration-and-cold-chain-monitoring-systems)
