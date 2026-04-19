import type { Core } from "@strapi/strapi";
import { normalizeNumber, normalizeString } from "../utils/normalize";
import type { UploadFile } from "../utils/get-local-upload-path";
import type { CypherScanResult } from "./cypherscan";

const SCAN_RESULT_UID =
  "plugin::cypherscan.cypherscan-scan-result";

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
  if (!result) {
    strapi.log.warn(
      `[CypherScan] No result returned for file id=${String(file?.id ?? "n/a")}`
    );

    await persistScanResult(
      strapi,
      file,
      null,
      "No result returned from CypherScan"
    );

    return;
  }

  strapi.log.info(
    `[CypherScan] Persisting result id=${String(file?.id ?? "n/a")} verdict=${String(
      result.verdict ?? "n/a"
    )} risk=${String(result.riskLevel ?? "n/a")} score=${String(
      result.score ?? "n/a"
    )} traceId=${String(result.traceId ?? "n/a")}`
  );

  await persistScanResult(strapi, file, result);

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

  try {
    await persistScanResult(strapi, file, null, message);
    strapi.log.info(
      `[CypherScan] Error persisted for file id=${String(file?.id ?? "n/a")}`
    );
  } catch (persistError) {
    const persistMessage =
      persistError instanceof Error
        ? persistError.stack || persistError.message
        : String(persistError);

    strapi.log.error(`[CypherScan] Failed to persist error: ${persistMessage}`);
  }
}