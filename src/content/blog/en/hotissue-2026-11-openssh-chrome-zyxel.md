---
title: '[Security This Week] Alpine SSH Password Bypass, a Chrome Zero-Day, Zyxel Switches — What to Lock Down First'
description: 'An OpenSSH flaw that lets one long password log in to Alpine Linux SSH was exploited within hours of disclosure. Chrome fixed its eighth zero-day of the year, and attacks on Zyxel switches bypassed an earlier patch. Check commands and fixed versions inside.'
pubDate: 'Nov 10 2026'
lang: 'en'
translation: 'hotissue-2026-11-openssh-chrome-zyxel'
tags: ['security', 'hot-issue', 'openssh', 'linux', 'chrome', 'zyxel', 'patching']
---

> Covers information published November 3 – November 10, 2026 · Sources at the end
>
> Applies to: Alpine Linux servers and containers, Chrome on company PCs, Zyxel GS1900 switches

On November 9, CISA added four entries at once to its **Known Exploited Vulnerabilities (KEV) catalog**. The one that reaches the most admins is OpenSSH. The same week also brought a Chrome zero-day and a Zyxel switch zero-day.

## 1. OpenSSH "SSHole" — any password over 256 characters logs in

### What happened

- **CVE-2026-123158** — disclosed November 5, added to KEV November 9
- On an account with no password (a password field of `*`), **any password longer than 256 characters** logs in
- Two behaviors combine. To stop username guessing, sshd still hashes the supplied password for accounts with no usable hash, borrowing another account's hash settings. The musl C library's `crypt()` rejects passwords over 256 bytes and returns `*` — which matches the `*` stored for passwordless accounts, so the login succeeds
- Threat intelligence firm Previdian saw the first attack **less than nine hours** after disclosure and confirmed root access on an Alpine honeypot. Botnets and cryptocurrency miners are using it

### Are you affected?

**glibc-based Debian, Ubuntu, RHEL and Fedora are not affected.** Setups that check passwords through PAM are also safe. You are at risk only when **all** of these are true:

- A **musl**-based Linux with sshd built **without PAM** — Alpine's default openssh-server fits. Check OpenWrt, Buildroot, Yocto and Alpine-based Docker images too
- **Password authentication is enabled** (the OpenSSH default)
- An account with `*` in the password field exists, alongside at least one account with a real password hash (`$5$` or `$6$`)

```sh
cat /etc/alpine-release                       # Alpine version
apk info -v openssh-server                    # installed openssh version
sshd -T | grep -Ei 'passwordauthentication|usepam|permitrootlogin'
awk -F: '$2=="*"{print $1}' /etc/shadow       # accounts whose password field is *
```

Root is blocked by the default `PermitRootLogin`, but the `alpine` user on official AWS and Azure Alpine images (tiny-cloud 3.18.11 – 3.24.3) can run `doas` without a password, which leads straight to root.

### Fix

1. Upgrade to **OpenSSH 10.6p2 or later** (or your distribution's fixed package). Alpine shipped fixed packages for every branch from 3.16 to edge
2. **Restart sshd.** Replacing the package leaves the running sshd on the old code
3. **Rebuild container images** on a fixed Alpine base

```sh
apk update && apk upgrade openssh-server
rc-service sshd restart
```

**If you can't patch right away**, add `PasswordAuthentication no` to `/etc/ssh/sshd_config` and restart sshd. If the server only uses key authentication, it should be off anyway.

### Check whether you were already hit

- Search the logs (`/var/log/messages`) for **"Accepted password for"** entries that name a passwordless account
- Review recently created users, `authorized_keys` changes and `doas` usage
- If you can't rule out a compromise, **treat the server as compromised** and rebuild it

## 2. Chrome — the eighth zero-day this year

- **CVE-2026-125350** — use-after-free in Chrome's XML handling, rated High
- Google says it "is aware that an exploit for CVE-2026-125350 exists in the wild." Opening a crafted web page can lead to code execution
- Fixed in **157.0.8103.50 or later** (.50/.51 on Mac)

Even after an automatic update arrives, Chrome **only applies it on restart**. Company PCs often keep Chrome open for days, so check the relaunch notification and forced-relaunch deadline in Group Policy or Intune. Follow up with updates for other Chromium-based browsers such as Edge as they ship.

## 3. Zyxel GS1900 switches — attacks that bypassed the patch

- **CVE-2026-107441** — out-of-bounds write in the web management interface. An unauthenticated attacker can run commands on the switch
- Attacks **bypassed the patch** for a flaw fixed in June (CVE-2026-7273). GreyNoise counted **996 devices** taken over in 48 countries; the attackers collected configurations, root password hashes and network details
- Zyxel released fixed firmware on October 22 and published its advisory on November 3. Ten GS1900-series models are affected

**Having applied the June patch is not enough.** Update to the latest firmware again, and make sure the management interface is not reachable from the internet or from regular user networks. If a switch was exposed, change the admin password and check that its configuration hasn't been altered.

## Also added to KEV

- **IBM Aspera Faspex (CVE-2026-123218)** — an authenticated user can gain administrator rights, CVSS 9.8. Upgrade to **5.0.19 PL1 (Fix Pack 1)**; plain 5.0.19 is still vulnerable
- **FreeSWITCH (CVE-2026-116779)** and **GPUStack (CVE-2026-102895)** — if you run them, check the vendor advisories for fixed versions

## This week's checklist

- [ ] Alpine servers and containers: openssh 10.6p2 or later, **restart sshd**, rebuild images
- [ ] Until patched: `PasswordAuthentication no`, search logs for "Accepted password for"
- [ ] Chrome 157.0.8103.50 or later, check the forced-relaunch deadline
- [ ] Zyxel GS1900: firmware from October 22 or later, restrict management access
- [ ] IBM Aspera Faspex: 5.0.19 PL1
- [ ] Today (November 10) is November's Patch Tuesday — a separate write-up follows tomorrow

## Sources

- [CISA, Adds Four Known Exploited Vulnerabilities to Catalog (2026-11-09)](https://www.cisa.gov/news-events/alerts/2026/11/09/cisa-adds-four-known-exploited-vulnerabilities-catalog)
- [Help Net Security, OpenSSH flaw exploited in the wild just hours after disclosure (CVE-2026-123158)](https://www.helpnetsecurity.com/2026/11/06/openssh-sshole-cve-2026-123158-exploitation/)
- [eSentire, OpenSSH SSHole Authentication Bypass Vulnerability (CVE-2026-123158)](https://www.esentire.com/security-advisories/openssh-sshole-authentication-bypass-vulnerability-cve-2026-123158)
- [Debian Security Tracker, CVE-2026-123158](https://security-tracker.debian.org/tracker/CVE-2026-123158)
- [BleepingComputer, Google patches eighth Chrome zero-day exploited in attacks this year](https://www.bleepingcomputer.com/news/security/google-patches-eighth-chrome-zero-day-exploited-in-attacks-this-year/)
- [BleepingComputer, Zyxel fixes zero-day exploited to hack nearly 1,000 network switches](https://www.bleepingcomputer.com/news/security/zyxel-fixes-zero-day-exploited-to-hack-nearly-1-000-network-switches/)
- [IBM Support, Security Bulletin: IBM Aspera Faspex (CVE-2026-123218)](https://www.ibm.com/support/pages/node/7295921)
