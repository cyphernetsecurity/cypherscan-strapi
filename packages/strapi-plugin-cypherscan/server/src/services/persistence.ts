import type { Core } from "@strapi/strapi";
import { normalizeNumber, normalizeString } from "../utils/normalize";
import type { UploadFile } from "../utils/get-local-upload-path";
import type { CypherScanResult } from "./cypherscan";

const SCAN_RESULT_UID =
  "plugin::cypherscan.cypherscan-scan-result";

function summarize(result: CypherScanResult | null): string {
  const verdict = String(result?.verdict ?? "unknown").toLowerCase();
  const risk = String(result?.riskLevel ?? "unknown").toLowerCase();
  const findings = Array.isArray(result?.findings) ? result.findings.length : 0;

  if (!result) {
    return "❌ Scan failed — no result returned.";
  }

  if (result.blocked || verdict === "malicious" || risk === "high") {
    return `🚨 High risk detected (${findings} findings). Do NOT use this file in production.`;
  }

  if (verdict === "suspicious" || risk === "medium") {
    return `⚠️ Potential risk (${findings} findings). Review before using in production.`;
  }

  if (verdict === "clean" || risk === "low") {
    return `✅ File looks clean (${findings} findings).`;
  }

  return `ℹ️ Scan completed (${findings} findings).`;
}

function track(strapi: Core.Strapi, event: string, meta: Record<string, unknown>) {
  strapi.log.info(
    `[CypherScan:event] ${event} ${JSON.stringify({
      source: "strapi_plugin",
      ...meta,
    })}`
  );
}

export async function persistScanResult(
  strapi: Core.Strapi,
  file: UploadFile,
  result: CypherScanResult | null,
  errorMessage?: string
): Promise<void> {
  const findings = Array.isArray(result?.findings) ? result.findings : [];

  await strapi.db.query(SCAN_RESULT_UID).create({
    data: {
      uploadFileId:
        typeof file?.id === "number"
          ? file.id
          : typeof file?.id === "string" && !Number.isNaN(Number(file.id))
            ? Number(file.id)
            : null,
      uploadDocumentId: normalizeString(file?.documentId),
      fileName: normalizeString(file?.name),
      fileUrl: normalizeString(file?.url),
      mime: normalizeString(file?.mime),
      size: normalizeNumber(file?.size),
      verdict: normalizeString(result?.verdict),
      riskLevel: normalizeString(result?.riskLevel),
      score: normalizeNumber(result?.score),
      traceId: normalizeString(result?.traceId),
      findingsCount: findings.length,
      findingsJson: findings.length > 0 ? findings : [],
      scannedAt: new Date().toISOString(),
      status: errorMessage ? "error" : "scanned",
      error: errorMessage ?? null,
    },
  });
}

export async function handleScanResult(
  strapi: Core.Strapi,
  file: UploadFile,
  result: CypherScanResult | null
): Promise<void> {
  const summary = summarize(result);

  strapi.log.info(
    `[CypherScan] Persisting result id=${String(file?.id ?? "n/a")} verdict=${String(
      result?.verdict ?? "n/a"
    )} risk=${String(result?.riskLevel ?? "n/a")}`
  );

  strapi.log.info(`[CypherScan] 👉 ${summary}`);

  await persistScanResult(strapi, file, result);

  track(strapi, "plugin_scan_completed", {
    fileId: file?.id ?? null,
    verdict: result?.verdict ?? null,
    riskLevel: result?.riskLevel ?? null,
    findings: Array.isArray(result?.findings)
      ? result.findings.length
      : 0,
  });

  strapi.log.info(
    `[CypherScan] Result persisted for file id=${String(file?.id ?? "n/a")}`
  );
}

export async function handleScanError(
  strapi: Core.Strapi,
  file: UploadFile,
  error: unknown
): Promise<void> {
  const message =
    error instanceof Error ? error.stack || error.message : String(error);

  strapi.log.error(`[CypherScan] ERROR: ${message}`);

  track(strapi, "plugin_scan_failed", {
    fileId: file?.id ?? null,
    error: message,
  });

  try {
    await persistScanResult(strapi, file, null, message);
  } catch (persistError) {
    strapi.log.error(
      `[CypherScan] Failed to persist error: ${String(persistError)}`
    );
  }
}