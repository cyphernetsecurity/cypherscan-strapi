# CypherScan Strapi Plugin

Scan uploaded files before they hit production.

→ malware  
→ exposed API keys  
→ unsafe payloads  

---

## Example

![CypherScan demo](https://i.imgur.com/856R8YT.png)

---

## Install

```bash
npm install strapi-plugin-cypherscan
```

---

## What it does

Hooks into the Strapi upload lifecycle and scans files immediately after upload.

Instead of just validating file type or size, it catches issues that only appear when files are actually used.

---

## Technical details

Full technical breakdown here:

https://github.com/cyphernetsecurity/cypherscan-strapi/blob/main/packages/strapi-plugin-cypherscan/README.md

---

## Demo

https://youtu.be/zRk-9Es7mwA