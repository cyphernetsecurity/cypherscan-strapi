import type { Core } from "@strapi/strapi";
import {
  getFreshUploadFile,
  scanWithCypherScan,
} from "./services/cypherscan";
import { handleScanError, handleScanResult } from "./services/persistence";
import type { UploadFile } from "./utils/get-local-upload-path";

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

export default ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.log.info("[CypherScan] PLUGIN BOOTSTRAP LOADED");
  strapi.log.info("[CypherScan] plugin bootstrap");

  strapi.db.lifecycles.subscribe({
    models: ["plugin::upload.file"],

    afterCreate(event: any) {
      const file = event?.result as UploadFile;

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
};