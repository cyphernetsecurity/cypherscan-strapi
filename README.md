# CypherScan Strapi Plugin

Scans files right after upload — before they break in production.

Scan uploaded files for malware, exposed secrets, and payloads that often pass basic checks but break later in production.

> Early validation from real usage, logged scans, and developer feedback.

---

## Example result

![CypherScan demo](https://i.imgur.com/856R8YT.png)

---

## What it does

Hooks into the Strapi upload lifecycle and scans files immediately after upload, before they are used anywhere else.

---

## It returns

- verdict (clean / suspicious / malicious)
- risk level
- score
- traceId
- findings
- summary

---

## Demo

https://youtu.be/zRk-9Es7mwA

---

## Installation

Install the plugin:

npm install strapi-plugin-cypherscan

Then configure your environment variables:

CYPHERSCAN_API_KEY=cs_xxxxx  
CYPHERSCAN_BASE_URL=https://cyphernetsecurity.com  

Restart your Strapi app.

---

## Flow

Upload → Scan → Verdict

---

## Why

Most upload flows rely on basic validation (size, mime-type).

But real issues often appear later when files are actually processed.

This plugin moves validation earlier:

before the file is trusted  
before it's used  
before it reaches production  

---

## Status

Validated in a real Strapi app. Marketplace submission in progress.