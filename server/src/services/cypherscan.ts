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
    return null;
  }

  if (Array.isArray(data?.findings) && data.findings.length > 0) {
    strapi.log.info(
      `[CypherScan] findings detail: ${JSON.stringify(data.findings)}`
    );
  }

  return data ?? null;
}