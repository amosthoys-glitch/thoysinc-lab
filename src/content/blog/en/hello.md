---
title: 'Why Another Blog'
description: 'Why start a tech blog when search traffic is drying up — and what this blog will not publish.'
pubDate: 'Aug 22 2026'
lang: 'en'
translation: 'hello'
tags: ['meta']
---

Now that AI summaries sit on top of search results, a post like "How to configure DNS on Windows Server" gets consumed without a click. A blog that tidies up documentation and copies it out has no reason to exist anymore.

I'm starting one anyway, for three reasons.

## 1. Notes I will need again

I run into a problem I solved three years ago, three years later. The note I left at the time is never enough. A single line like "it was a GPO inheritance issue" restores nothing.

Writing in public changes that. When you assume someone else will read it, you write down the prerequisites, the versions, and the attempts that failed. That is everything the me of three years from now needs.

## 2. There is almost nothing in Korean

Search in Korean for Entra Connect sync errors, AD schema extensions or certificate autoenrollment failures, and almost nothing comes back. The English material is plentiful, but not everyone troubleshoots in English.

The market is small. In exchange, there is no competition. That is why posts here are written in Korean first, with English versions alongside.

## 3. What AI can't answer

A model summarizes documentation. It can't tell you:

- what broke when that setting was turned on in a real environment
- ordering dependencies the documentation doesn't mention
- where the vendor documentation is wrong
- the raw text of the actual logs

So this blog covers **only what I have run into myself** — with a reproducible environment, the real output, and the paths that failed.

## What I won't write

- Translations or summaries of official documentation
- Scripts I haven't verified
- "10 tips" style list posts

## Format

- The environment (OS build, product versions) is stated at the top of each post
- PowerShell scripts are posted ready to paste and run
- If you point out a mistake, I fix the post and record an `updatedDate`

Here we go.
