---
title: '[Outage] Microsoft 365 Exchange Online Outage — What Admins Should Check Now'
description: 'On the afternoon of November 12 (U.S. Eastern), Microsoft 365 went down centered on Exchange Online, taking Outlook and Teams with it. What Microsoft says caused it, where recovery stands, where to check status when the admin center won''t load, and what to verify afterward.'
pubDate: 'Nov 12 2026'
lang: 'en'
translation: 'hotissue-2026-11-m365-exchange-outage'
tags: ['microsoft-365', 'exchange-online', 'outage', 'hot-issue', 'outlook', 'teams']
---

> Scope: November 12, 2026 · Microsoft's official status page (updated 23:06 UTC) and news reports · This is an ongoing incident and details may change
>
> For: administrators of Microsoft 365 Business and Enterprise tenants

## What happened

- Starting **shortly before 1 p.m. ET** on November 12, reports that Outlook was down poured in. CNBC said Downdetector logged **about 130,000** reports
- Microsoft said the problem was **primarily with Exchange Online**. It was first reported for mailboxes in the Americas, and later broadened to say connectivity could be affected **for users in any region**
- **Teams** had a separate problem in North America; Microsoft later said its mitigation had "successfully restored service health and functionality"
- Microsoft's official status page (status.cloud.microsoft) shows, as of 23:06 UTC, **"Users may be unable to connect to multiple Microsoft 365 services"** with a status of **Service degradation**

## Cause and recovery, according to Microsoft

- The first explanation was "elevated load across multiple regions"
- Microsoft then clarified that **traffic had not increased**: a number of servers became **unexpectedly unavailable**, putting the load on the rest. It believes a component that processes server health caused servers to fail automated health checks, and said it had not identified a recent change linked to the start of the impact
- Around 4 p.m. ET, Microsoft said an **alternative health check method** had brought a subset of servers back into service, and it was applying the fix more broadly. It also paused deployments, moved traffic away from affected infrastructure, and restarted servers
- As of this writing, **full recovery has not been announced**

## What admins should do now

1. **Check status on the public page.** In an outage like this, the admin center itself may not load — which is exactly why Microsoft posts the information at **status.cloud.microsoft**. If the admin center opens, check **Health → Service health** for the incident number and updates
2. **Leave user PCs alone.** The cause is on the server side. Rebuilding Outlook profiles or reinstalling Office won't fix it and only creates cleanup work later. One clear message to users — "This is a Microsoft outage; it will reconnect on its own once fixed" — works better
3. **Route urgent communication elsewhere.** While mail is down, point people to phone or another messaging channel for anything urgent

## After recovery

- **Mail flow:** use **Message trace** in the Exchange admin center to see whether mail from the outage window was delivered late and whether anything bounced (NDRs). If a partner says "your email bounced," suspect this window first
- **User follow-up:** for users still having trouble after recovery, have them fully close and reopen Outlook first, and only then look at individual cases
- **Post-incident report:** after major incidents, an incident report often appears in Service health in the admin center. The cause and prevention steps are useful for your own report to management

I'll update this post when the outage is fully resolved or Microsoft shares more about the cause.

## Sources

- [Microsoft service health status (status.cloud.microsoft, updated 2026-11-12 23:06 UTC)](https://status.cloud.microsoft/)
- [CNBC, Widespread Microsoft outage takes down Outlook and other 365 services (2026-11-12)](https://www.cnbc.com/2026/11/12/microsoft-outage-outlook-aws-google.html)
- [ABC News, Outlook outage: Microsoft reports 'issues' with Teams and email (2026-11-12)](https://abcnews.com/US/outlook-down-microsoft-outage-reported-mail/story?id=138088203)
