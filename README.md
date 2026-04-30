# CypherScan Strapi Plugin

Scans files right after upload — before they break in production.

Scan uploaded files for malware, exposed secrets, and payloads that often pass basic checks but fail later in production.

Early validation from real usage, logged scans, and developer feedback.

---

## Example result

![CypherScan demo](https://i.imgur.com/856R8YT.png)

---

## What it does

Hooks into the Strapi upload lifecycle and scans files immediately after upload, before they are used anywhere else.

---

## How it works (technical overview)

Strapi accepts file uploads by default.

These files can contain malware, exposed secrets, or unsafe payloads that only become problematic when they are actually used.

Most systems validate file format — not behavior.

This plugin adds a scanning layer directly into the upload lifecycle.

---

### Where it hooks

The plugin hooks into the Strapi upload lifecycle (`afterCreate`).

At this point:
- the file has been uploaded
- it exists locally in `/public/uploads`
- it has not been used yet by the application

---

### Flow

1. File is uploaded via Strapi  
2. Strapi stores the file locally  
3. Plugin triggers on `afterCreate`  
4. File is sent to CypherScan API  
5. API returns:
   - verdict (clean / suspicious / malicious)
   - risk level
   - score
   - traceId
   - findings (e.g. API keys, tokens)
   - summary

---

### Example

```ts
const res = await fetch("https://cyphernetsecurity.com/api/v1/scan", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.CYPHERSCAN_API_KEY}`,
  },
  body: formData,
});
```

This request sends the uploaded file to the scanning API and returns a structured security verdict.

---

## It returns

A structured security result:

- verdict (clean / suspicious / malicious)
- risk level
- score
- traceId
- findings (e.g. API keys, tokens)
- summary

---

## Demo

https://youtu.be/zRk-9Es7mwA

---

## Installation

Install the plugin:

```bash
npm install strapi-plugin-cypherscan
```

Then configure your environment variables:

```
CYPHERSCAN_API_KEY=cs_xxxxx
CYPHERSCAN_BASE_URL=https://cyphernetsecurity.com
```

Restart your Strapi app.

---

## Why

Most upload flows rely on basic validation (size, mime-type).

But real issues often appear later when files are actually processed.

This plugin moves validation earlier:

- before the file is trusted  
- before it's used  
- before it reaches production  

---

## Status

Validated in a real Strapi app. Marketplace submission in progress.