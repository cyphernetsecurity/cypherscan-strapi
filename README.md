# CypherScan Strapi Plugin

Scan uploaded files for malware, exposed secrets, and risks before they reach production.

## What it does

- Hooks into Strapi upload lifecycle
- Automatically scans files after upload
- Detects:
  - Malware
  - Exposed API keys / secrets
  - Suspicious payloads
- Returns:
  - verdict (clean / suspicious / malicious)
  - risk level
  - traceId for audit

## Demo

https://youtu.be/zRk-9Es7mwA

## Installation

Currently tested using the Strapi Plugin SDK workflow (local linking).

NPM package coming next.

## Why

Most apps scan nothing before files hit production.

CypherScan adds a security layer directly inside Strapi.
