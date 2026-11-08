---
title: 'Home Lab AD Domain Names: Where Picking .local Gets You Stuck Later'
description: 'What I learned after starting with thoyslab.local — mDNS conflicts, no public certificates, and what it costs to rename a domain.'
pubDate: 'Nov 07 2026'
lang: 'en'
translation: 'ad-domain-naming'
tags: ['active-directory', 'dns', 'homelab']
---

> Environment: Windows Server 2025 (Datacenter, Desktop Experience) / single-forest, single-domain home lab

The domain name is the first thing you choose when you build an AD home lab, and a bad choice is expensive to undo later. I started with `thoyslab.local`. Today I would do it differently.

## Why `.local` is a problem

### 1. mDNS already uses it

RFC 6762 reserves `.local` for multicast DNS. macOS Bonjour and Linux Avahi both use that namespace.

As a result, once there is a macOS or Linux client on the same network, it becomes hard to predict whether name resolution goes to unicast DNS (your domain controller) or to mDNS. A lab with only Windows clients can run for months without trouble, then get strange the moment you connect one MacBook.

### 2. You cannot get public certificates

Under CA/Browser Forum rules, public CAs have not issued certificates for internal server names since November 1, 2015. `.local` is one of them.

In a home lab you can stand up a private CA (AD CS), and that is good practice in itself. But it gets in the way later when you try to add things like:

- Endpoints exposed to the outside in a hybrid setup
- ADFS / Entra Application Proxy
- Carrying what you built in the lab straight into real-world documentation

### 3. It is not what Microsoft recommends

Microsoft has long recommended "a subdomain of a public domain you own."

## So what should you use?

If the domain you own is `thoysinc.com`:

```
ad.thoysinc.com
```

or `corp.thoysinc.com`, `internal.thoysinc.com`.

The key is to **separate the internal AD namespace from the public one**. If you use `thoysinc.com` itself as the AD domain (split-brain DNS), the domain controllers become authoritative for that zone. Then a domain-joined PC looking up `www.thoysinc.com` checks the internal zone first, finds no www record there, and the company website does not open. Our site runs on Azure Static Web Apps and mail is on Microsoft 365, so that would mean copying and maintaining every www, autodiscover and MX-related record in the internal zone by hand. That is maintenance debt.

A single-label domain (a name with no dot, like `THOYSLAB`) is even worse. Many configurations do not support it.

## If you already built it with `.local`

You have three options.

**A. Leave it.** For a home lab with only Windows clients, it actually works fine. For learning, it is enough.

**B. Rename the domain.** There is a supported procedure with `rendom.exe`, but it brings two reboots, a reboot of every member server, and fixing GPO references. And it is not supported in a forest with Exchange installed.

**C. Tear it down and rebuild.** For a home lab, this is usually the fastest. Rebuilding a DC is good practice in itself, and the second build comes out much cleaner than the first.

I chose C. The scripts for standing up the new forest are covered in the series that follows.

## Summary

| Item | `.local` | `ad.thoysinc.com` |
|---|---|---|
| mDNS conflicts | Yes | No |
| Public certificates | Not possible | Possible |
| Microsoft recommended | No | Yes |
| Split-brain DNS | Not applicable | Avoided |

Even in a home lab, it is better to follow the naming rules you would use in production. The point of a lab is to imitate the real thing.

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
