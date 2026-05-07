# CypherScan Strapi Plugin

Scans uploaded files immediately after upload — before they are trusted by downstream systems.

The plugin helps detect:

* malware
* exposed secrets
* leaked API keys
* suspicious payloads
* unsafe embedded content

before files continue through production workflows.

---

## Marketplace

Available on the official Strapi Marketplace:

https://market.strapi.io/plugins/strapi-plugin-cypherscan

---

## Example Result

![CypherScan demo](https://i.imgur.com/856R8YT.png)

---

## What it does

The plugin hooks into the Strapi upload lifecycle and scans files immediately after upload.

Instead of relying only on:

* mime-type validation
* file extensions
* upload size limits

it adds a deeper analysis layer before files are processed elsewhere in the application.

---

## Why this matters

Many systems validate upload structure — not operational risk.

Unsafe files can still:

* move through backend workflows
* reach storage systems
* enter moderation pipelines
* trigger downstream processing
* expose secrets or embedded payloads

CypherScan shifts part of this validation earlier in the pipeline.

---

## Upload Flow

1. File is uploaded through Strapi
2. Strapi stores the file locally
3. Plugin hooks into `afterCreate`
4. File is sent to the CypherScan API
5. API returns a structured security analysis

---

## Where it hooks

The plugin hooks into the Strapi upload lifecycle (`afterCreate`).

At this stage:

* the upload already exists locally
* the file is accessible in `/public/uploads`
* downstream systems have not processed it yet

This creates an opportunity to analyze the file before it is trusted further in the workflow.

---

## Example API Call

```ts
const res = await fetch("https://cyphernetsecurity.com/api/v1/scan", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.CYPHERSCAN_API_KEY}`,
  },
  body: formData,
});
```

The API returns a structured security verdict for the uploaded file.

---

## Returned Security Data

Structured results can include:

* verdict (`clean`, `suspicious`, `malicious`)
* risk level
* score
* traceId
* findings
* exposed secret detection
* malware indicators
* summary

---

## Installation

Install the plugin:

```bash
npm install strapi-plugin-cypherscan
```

---

## Environment Variables

```env
CYPHERSCAN_API_KEY=cs_xxxxx
CYPHERSCAN_BASE_URL=https://cyphernetsecurity.com
```

Restart your Strapi application after configuration.

---

## Quick Start

1. Install plugin
2. Configure API key
3. Upload a file through Strapi
4. View structured scan results

---

## Demo

https://youtu.be/zRk-9Es7mwA

---

## API Documentation

https://cyphernetsecurity.com/docs/api

---

## Status

* Live API
* Public marketplace distribution
* Production-tested integration flow
* Active onboarding and ecosystem distribution
