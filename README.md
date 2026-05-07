# CypherScan Strapi Plugin

Scan uploaded files before they move deeper into production workflows.

Detect:

* malware
* exposed API keys
* leaked tokens
* suspicious payloads
* unsafe embedded content

Built for:

* CMS platforms
* client portals
* intake systems
* user-generated content
* upload-heavy applications

---

## Marketplace

Available on the official Strapi Marketplace:

https://market.strapi.io/plugins/strapi-plugin-cypherscan

---

## Example

![CypherScan demo](https://i.imgur.com/856R8YT.png)

---

## Install

```bash
npm install strapi-plugin-cypherscan
```

---

## Quick Start

1. Install the plugin
2. Add your CypherScan API key
3. Upload a file through Strapi
4. CypherScan automatically analyzes the upload

---

## What it does

The plugin hooks directly into the Strapi upload lifecycle and scans files immediately after upload.

Most systems validate:

* file type
* mime type
* extension
* size

But many operational risks only appear once files are actually trusted or processed.

CypherScan adds a security analysis layer before files continue through downstream workflows.

---

## What gets detected

Structured scan results can include:

* malware detection
* exposed API keys
* leaked credentials
* suspicious embedded content
* unsafe payload indicators
* risk scoring
* security verdicts

---

## Technical Details

Full technical breakdown:

https://github.com/cyphernetsecurity/cypherscan-strapi/blob/main/packages/strapi-plugin-cypherscan/README.md

---

## Demo

https://youtu.be/zRk-9Es7mwA

---

## API

CypherScan also exposes a standalone API for direct backend integrations:

https://cyphernetsecurity.com/docs/api
