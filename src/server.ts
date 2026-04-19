import path from "node:path";
import { promises as fs } from "node:fs";

type StrapiLike = {
  db: {
    lifecycles: {
      subscribe: (config: {
        models: string[];
        afterCreate: (event: any) => void | Promise<void>;
      }) => void;
    };
  };
};

function getLocalUploadPath(file: any): string {
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

async function parseResponse(res: Response): Promise<{ json: any | null; text: string }> {
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

async function scanWithCypherScan(file: any) {
  console.log("\n[CypherScan] ===== NEW FILE =====");
  console.log("[CypherScan] name:", file?.name);
  console.log("[CypherScan] mime:", file?.mime);
  console.log("[CypherScan] size:", file?.size);
  console.log("[CypherScan] url:", file?.url);

  const apiKey = process.env.CYPHERSCAN_API_KEY;

  console.log("[CypherScan] api key present:", !!apiKey);

  if (!apiKey) {
    console.error("[CypherScan] Missing CYPHERSCAN_API_KEY in .env");
    return;
  }

  const localPath = getLocalUploadPath(file);
  console.log("[CypherScan] local path:", localPath);

  const fileBuffer = await fs.readFile(localPath);
  console.log("[CypherScan] file buffer size:", fileBuffer.length);

  const mimeType =
    typeof file?.mime === "string" && file.mime
      ? file.mime
      : "application/octet-stream";

  const fileName =
    typeof file?.name === "string" && file.name
      ? file.name
      : path.basename(localPath);

  const form = new FormData();
  form.append("file", new Blob([fileBuffer], { type: mimeType }), fileName);

  console.log("[CypherScan] scanning local file:", localPath);

  const res = await fetch("https://cyphernetsecurity.com/api/v1/scan", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
    },
    body: form,
  });

  const { json, text } = await parseResponse(res);
  const data = json as any;

  console.log("\n[CypherScan] ===== RESULT =====");
  console.log("[CypherScan] status:", res.status);
  console.log("[CypherScan] ok:", data?.ok);
  console.log("[CypherScan] verdict:", data?.verdict);
  console.log("[CypherScan] risk:", data?.riskLevel);
  console.log("[CypherScan] score:", data?.score);
  console.log("[CypherScan] traceId:", data?.traceId);
  console.log(
    "[CypherScan] findings:",
    Array.isArray(data?.findings) ? data.findings.length : 0
  );

  if (!res.ok) {
    console.error("[CypherScan] scan failed response:", text);
    return;
  }

  if (Array.isArray(data?.findings) && data.findings.length > 0) {
    console.log("[CypherScan] findings detail:", data.findings);
  }
}

export default {
  register() {
    console.log("[CypherScan] app register");
  },

  async bootstrap({ strapi }: { strapi: StrapiLike }) {
    console.log("[CypherScan] app bootstrap running");

    strapi.db.lifecycles.subscribe({
      models: ["plugin::upload.file"],

      afterCreate(event: any) {
        const file = event.result;

        console.log("[CypherScan] file uploaded");
        console.log("[CypherScan] name:", file?.name);
        console.log("[CypherScan] mime:", file?.mime);
        console.log("[CypherScan] size:", file?.size);
        console.log("[CypherScan] url:", file?.url);
        console.log("[CypherScan] scheduling async scan...");

        setTimeout(() => {
          console.log("[CypherScan] async scan callback started");

          void scanWithCypherScan(file).catch((err) => {
            console.error("[CypherScan] ERROR:", err);
          });
        }, 250);
      },
    });
  },
};