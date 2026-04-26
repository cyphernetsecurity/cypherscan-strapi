import { promises as fs } from "node:fs";
import type { Core } from "@strapi/strapi";
import {
  getLocalUploadPath,
  type UploadFile,
} from "../utils/get-local-upload-path";
import { parseResponse } from "../utils/parse-response";

export type CypherScanResult = {
  ok?: boolean;
  blocked?: boolean;
  verdict?: string;
  riskLevel?: string;
  score?: number;
  traceId?: string;
  findings?: unknown[];
};

function getMimeType(file: UploadFile): string {
  if (typeof file?.mime === "string" && file.mime) {
    return file.mime;
  }

  return "application/octet-stream";
}

function getFileName(file: UploadFile, fallbackPath: string): string {
  if (typeof file?.name === "string" && file.name) {
    return file.name;
  }

  const normalized = fallbackPath.replace(/\\/g, "/");
  const lastSlash = normalized.lastIndexOf("/");

  if (lastSlash === -1) {
    return normalized;
  }

  return normalized.slice(lastSlash + 1);
}

function summarizeScanResult(data: CypherScanResult | null): string {
  const verdict = String(data?.verdict ?? "unknown").toLowerCase();
  const riskLevel = String(data?.riskLevel ?? "unknown").toLowerCase();
  const score =
    typeof data?.score === "number" ? String(data.score) : "n/a";
  const findingsCount = Array.isArray(data?.findings) ? data.findings.length : 0;

  if (data?.blocked || verdict === "malicious" || riskLevel === "high") {
    return [
      "🚨 High risk — this file should not be deployed.",
      `Verdict: ${verdict}`,
      `Risk: ${riskLevel}`,
      `Score: ${score}`,
      `Findings: ${findingsCount}`,
      "Action: review or remove this file before it reaches production.",
    ].join(" ");
  }

  if (verdict === "suspicious" || riskLevel === "medium") {
    return [
      "⚠️ Potential risk detected — this file needs review before production.",
      `Verdict: ${verdict}`,
      `Risk: ${riskLevel}`,
      `Score: ${score}`,
      `Findings: ${findingsCount}`,
      "Action: inspect the findings and confirm the file is safe before use.",
    ].join(" ");
  }

  if (verdict === "clean" || riskLevel === "low") {
    return [
      "✅ No obvious risk detected.",
      `Verdict: ${verdict}`,
      `Risk: ${riskLevel}`,
      `Score: ${score}`,
      `Findings: ${findingsCount}`,
      "Action: safe to continue, but keep scanning files before production.",
    ].join(" ");
  }

  return [
    "ℹ️ Scan completed.",
    `Verdict: ${verdict}`,
    `Risk: ${riskLevel}`,
    `Score: ${score}`,
    `Findings: ${findingsCount}`,
    "Action: review the scan result before using this file in production.",
  ].join(" ");
}

function logPluginEvent(
  strapi: Core.Strapi,
  eventName: string,
  meta: Record<string, unknown> = {}
) {
  strapi.log.info(
    `[CypherScan:event] ${eventName} ${JSON.stringify({
      source: "strapi_plugin",
      ...meta,
    })}`
  );
}

export async function getFreshUploadFile(
  strapi: Core.Strapi,
  fileId: number | string | undefined
): Promise<UploadFile | null> {
  if (fileId === undefined || fileId === null) {
    return null;
  }

  const freshFile = await strapi.db.query("plugin::upload.file").findOne({
    where: { id: fileId },
  });

  if (!freshFile) {
    return null;
  }

  strapi.log.info(
    `[CypherScan] fresh DB keys: ${Object.keys(freshFile).join(", ")}`
  );

  return freshFile as UploadFile;
}

export async function scanWithCypherScan(
  strapi: Core.Strapi,
  file: UploadFile
): Promise<CypherScanResult | null> {
  logPluginEvent(strapi, "plugin_scan_started", {
    fileId: file?.id ?? null,
    fileName: file?.name ?? null,
    mime: file?.mime ?? null,
    size: file?.size ?? null,
  });

  strapi.log.info("[CypherScan] ===== NEW FILE =====");
  strapi.log.info(`[CypherScan] id: ${String(file?.id ?? "n/a")}`);
  strapi.log.info(
    `[CypherScan] documentId: ${String(file?.documentId ?? "n/a")}`
  );
  strapi.log.info(`[CypherScan] name: ${String(file?.name ?? "n/a")}`);
  strapi.log.info(`[CypherScan] mime: ${String(file?.mime ?? "n/a")}`);
  strapi.log.info(`[CypherScan] size: ${String(file?.size ?? "n/a")}`);
  strapi.log.info(`[CypherScan] url: ${String(file?.url ?? "n/a")}`);

  const apiKey = process.env.CYPHERSCAN_API_KEY;
  const baseUrl =
    process.env.CYPHERSCAN_BASE_URL || "https://cyphernetsecurity.com";

  if (!apiKey) {
    strapi.log.error(
      "[CypherScan] Missing CYPHERSCAN_API_KEY — get one at https://cyphernetsecurity.com"
    );

    logPluginEvent(strapi, "plugin_scan_failed", {
      reason: "missing_api_key",
    });

    return null;
  }

  const localPath = getLocalUploadPath(file);
  strapi.log.info(`[CypherScan] local path: ${localPath}`);

  const fileBuffer = await fs.readFile(localPath);
  strapi.log.info(`[CypherScan] file buffer size: ${fileBuffer.length}`);

  const mimeType = getMimeType(file);
  const fileName = getFileName(file, localPath);

  const form = new FormData();
  form.append("file", new Blob([fileBuffer], { type: mimeType }), fileName);

  strapi.log.info(`[CypherScan] scanning local file: ${localPath}`);

  const res = await fetch(`${baseUrl}/api/v1/scan`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "x-cypherscan-source": "strapi_plugin",
      "x-cypherscan-plugin": "strapi",
    },
    body: form,
  });

  const { json, text } = await parseResponse(res);
  const data = json as CypherScanResult | null;

  strapi.log.info("[CypherScan] ===== RESULT =====");
  strapi.log.info(`[CypherScan] status: ${res.status}`);
  strapi.log.info(`[CypherScan] ok: ${String(data?.ok ?? "n/a")}`);
  strapi.log.info(`[CypherScan] verdict: ${String(data?.verdict ?? "n/a")}`);
  strapi.log.info(`[CypherScan] risk: ${String(data?.riskLevel ?? "n/a")}`);
  strapi.log.info(`[CypherScan] score: ${String(data?.score ?? "n/a")}`);
  strapi.log.info(`[CypherScan] traceId: ${String(data?.traceId ?? "n/a")}`);
  strapi.log.info(
    `[CypherScan] findings: ${
      Array.isArray(data?.findings) ? data.findings.length : 0
    }`
  );

  if (!res.ok) {
    strapi.log.error(`[CypherScan] scan failed response: ${text}`);

    logPluginEvent(strapi, "plugin_scan_failed", {
      status: res.status,
      reason: "scan_api_error",
    });

    return null;
  }

  strapi.log.info(`[CypherScan] summary: ${summarizeScanResult(data)}`);

  logPluginEvent(strapi, "plugin_scan_completed", {
    status: res.status,
    verdict: data?.verdict ?? null,
    riskLevel: data?.riskLevel ?? null,
    score: data?.score ?? null,
    blocked: data?.blocked ?? null,
    traceId: data?.traceId ?? null,
    findingsCount: Array.isArray(data?.findings) ? data.findings.length : 0,
  });

  if (Array.isArray(data?.findings) && data.findings.length > 0) {
    strapi.log.info(
      `[CypherScan] findings detail: ${JSON.stringify(data.findings)}`
    );
  }

  return data ?? null;
}