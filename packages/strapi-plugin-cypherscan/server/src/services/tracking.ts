import type { Core } from "@strapi/strapi";

const ENDPOINT =
  process.env.CYPHERSCAN_TRACKING_URL ||
  "https://cyphernetsecurity.com/api/plugin/usage";

export async function trackRemote(
  strapi: Core.Strapi,
  event: string,
  meta: Record<string, unknown> = {}
): Promise<void> {
  try {
    await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        source: "strapi_plugin",
        plugin: "strapi",
        pluginVersion: "0.1.8",
        ...meta,
      }),
    });
  } catch {
    strapi.log.warn("[CypherScan] remote tracking failed");
  }
}