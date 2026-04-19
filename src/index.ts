import path from "node:path";
import { promises as fs } from "node:fs";
import type { Core } from "@strapi/strapi";

type UploadFile = {
  id?: number | string;
  documentId?: string;
  name?: string;
  mime?: string;
  size?: number;
  url?: string;
  [key: string]: unknown;
};

type CypherScanResult = {
  ok?: boolean;
  blocked?: boolean;
  verdict?: string;
  riskLevel?: string;
  score?: number;
  traceId?: string;
  findings?: unknown[];
};

type ParsedResponse = {
  json: any | null;
  text: string;
};

function getLocalUploadPath(file: UploadFile): string {
  const rawUrl = typeof file?.url === "string" ? file.url : "";

  if (!rawUrl) {
    throw new Error("Missing file.url on upload event");
  }

  const cleanUrl = rawUrl.split("?")[0];

  if (!cleanUrl.startsWith("/uploads/")) {
    throw new Error(`Unsupported upload URL for local provider: ${cleanUrl}`);
  }

  return path.join(process.cwd(), "public", cleanUrl.replace(/^\/+/, ""));
}

async function parseResponse(res: Response): Promise<ParsedResponse> {
  const text = await res.text();

  try {
    return {
      json: JSON.parse(text),
      text,
    };
  } catch {
    return {
      json: null,
      text,
    };
  }
}

function getMimeType(file: UploadFile): string {
  if (typeof file?.mime === "string" && file.mime) {
    return file.mime;
  }

  return "application/octet-stream";
}

function getFileName(file: UploadFile, localPath: string): string {
  if (typeof file?.name === "string" && file.name) {
    return file.name;
  }

  return path.basename(localPath);
}

function normalizeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

async function getFreshUploadFile(
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

async function scanWithCypherScan(
  strapi: Core.Strapi,
  file: UploadFile
): Promise<CypherScanResult | null> {
  strapi.log.info("[CypherScan] ===== NEW FILE =====");
  strapi.log.info(`[CypherScan] id: ${String(file?.id ?? "n/a")}`);
  strapi.log.info(`[CypherScan] documentId: ${String(file?.documentId ?? "n/a")}`);
  strapi.log.info(`[CypherScan] name: ${String(file?.name ?? "n/a")}`);
  strapi.log.info(`[CypherScan] mime: ${String(file?.mime ?? "n/a")}`);
  strapi.log.info(`[CypherScan] size: ${String(file?.size ?? "n/a")}`);
  strapi.log.info(`[CypherScan] url: ${String(file?.url ?? "n/a")}`);

  const apiKey = process.env.CYPHERSCAN_API_KEY;

  if (!apiKey) {
    strapi.log.error("[CypherScan] Missing CYPHERSCAN_API_KEY in .env");
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

  const res = await fetch("https://cyphernetsecurity.com/api/v1/scan", {
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

async function persistScanResult(
  strapi: Core.Strapi,
  file: UploadFile,
  result: CypherScanResult | null,
  errorMessage?: string
): Promise<void> {
  const findings = Array.isArray(result?.findings) ? result?.findings : [];

  await strapi.db
    .query("api::cypherscan-scan-result.cypherscan-scan-result")
    .create({
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

async function handleScanResult(
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

async function handleScanError(
  strapi: Core.Strapi,
  file: UploadFile,
  error: unknown
): Promise<void> {
  const message = error instanceof Error ? error.stack || error.message : String(error);

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

async function processUploadedFile(
  strapi: Core.Strapi,
  file: UploadFile
): Promise<void> {
  const freshFile = await getFreshUploadFile(strapi, file?.id);

  if (!freshFile) {
    throw new Error(
      `Could not reload upload file from DB for id=${String(file?.id ?? "n/a")}`
    );
  }

  strapi.log.info("[CypherScan] reloaded file from DB");
  strapi.log.info(`[CypherScan] id: ${String(freshFile?.id ?? "n/a")}`);
  strapi.log.info(
    `[CypherScan] documentId: ${String(freshFile?.documentId ?? "n/a")}`
  );
  strapi.log.info(`[CypherScan] name: ${String(freshFile?.name ?? "n/a")}`);
  strapi.log.info(`[CypherScan] mime: ${String(freshFile?.mime ?? "n/a")}`);
  strapi.log.info(`[CypherScan] size: ${String(freshFile?.size ?? "n/a")}`);
  strapi.log.info(`[CypherScan] url: ${String(freshFile?.url ?? "n/a")}`);

  const result = await scanWithCypherScan(strapi, freshFile);
  await handleScanResult(strapi, freshFile, result);
}

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    strapi.log.info("[CypherScan] app register");
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    strapi.log.info("[CypherScan] app bootstrap running");

    strapi.db.lifecycles.subscribe({
      models: ["plugin::upload.file"],

      afterCreate(event: any) {
        const file = event.result as UploadFile;

        strapi.log.info("[CypherScan] file uploaded");
        strapi.log.info(`[CypherScan] id: ${String(file?.id ?? "n/a")}`);
        strapi.log.info(
          `[CypherScan] documentId: ${String(file?.documentId ?? "n/a")}`
        );
        strapi.log.info(`[CypherScan] name: ${String(file?.name ?? "n/a")}`);
        strapi.log.info(`[CypherScan] mime: ${String(file?.mime ?? "n/a")}`);
        strapi.log.info(`[CypherScan] size: ${String(file?.size ?? "n/a")}`);
        strapi.log.info(`[CypherScan] url: ${String(file?.url ?? "n/a")}`);
        strapi.log.info("[CypherScan] scheduling async scan...");

        setTimeout(() => {
          strapi.log.info("[CypherScan] async scan callback started");

          void processUploadedFile(strapi, file).catch(async (err) => {
            await handleScanError(strapi, file, err);
          });
        }, 250);
      },
    });
  },
};