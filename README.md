# CypherScan Strapi Plugin

Scan uploaded files for malware, exposed secrets, and suspicious payloads before they reach production.

## What it does

This plugin hooks into the Strapi upload lifecycle and automatically scans files after upload.

It returns:

- verdict (clean / suspicious / malicious)
- risk level
- score
- traceId

## Demo

https://youtu.be/zRk-9Es7mwA

## Installation

Install the plugin:

npm install @cypherscan/strapi

Then configure your environment variables:

CYPHERSCAN_API_KEY=cs_xxxxx  
CYPHERSCAN_BASE_URL=https://cyphernetsecurity.com

Restart your Strapi app.

## Flow

Upload → Scan → Verdict

## Why

Most upload flows trust files by default.

This plugin adds a scan step directly in the upload lifecycle to ensure files are validated before being used in your system.

## Status

Validated in an external Strapi app. Marketplace submission in progress.