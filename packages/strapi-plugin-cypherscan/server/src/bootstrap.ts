import type { Core } from "@strapi/strapi";
import {
  getFreshUploadFile,
  scanWithCypherScan,
} from "./services/cypherscan";
import { handleScanError, handleScanResult } from "./services/persistence";
import type { UploadFile } from "./utils/get-local-upload-path";

function track(strapi: Core.Strapi, event: string, meta: Record<string, unknown>) {
  strapi.log.info(
    `[CypherScan:event] ${event} ${JSON.stringify({
      source: "strapi_plugin",
      ...meta,
    })}`
  );
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

  track(strapi, "plugin_scan_started", {
    fileId: freshFile?.id ?? null,
    name: freshFile?.name ?? null,
  });

  const result = await scanWithCypherScan(strapi, freshFile);
  await handleScanResult(strapi, freshFile, result);
}

export default ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.log.info("[CypherScan] plugin bootstrap");

  track(strapi, "plugin_loaded", {});

  strapi.db.lifecycles.subscribe({
    models: ["plugin::upload.file"],

    afterCreate(event: any) {
      const file = event?.result as UploadFile;

      strapi.log.info("[CypherScan] file uploaded");
      strapi.log.info(`[CypherScan] id: ${String(file?.id ?? "n/a")}`);

      setTimeout(() => {
        void processUploadedFile(strapi, file).catch(async (err) => {
          await handleScanError(strapi, file, err);
        });
      }, 250);
    },
  });
};