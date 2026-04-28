import bootstrap from "./bootstrap";
import destroy from "./destroy";
import register from "./register";
import cypherscanScanResultSchema from "./content-types/cypherscan-scan-result/schema.json";

export default () => ({
  register,
  bootstrap,
  destroy,

  routes: [
    {
      method: "GET",
      path: "/test-connection",
      handler: async (ctx: any) => {
        const apiKey = process.env.CYPHERSCAN_API_KEY;
        const baseUrl =
          process.env.CYPHERSCAN_BASE_URL || "https://cyphernetsecurity.com";

        if (!apiKey) {
          ctx.send({
            ok: false,
            error: "Missing API key",
          });
          return;
        }

        try {
          const res = await fetch(`${baseUrl}/api/v1/scan`, {
            method: "POST",
            headers: {
              "x-api-key": apiKey,
              "x-cypherscan-source": "strapi_plugin",
            },
            body: new FormData(), // test volontairement vide
          });

          const isConnectionOk = res.ok || res.status === 404;

          ctx.send({
            ok: isConnectionOk,
            status: res.status,
            note: res.status === 404 ? "Endpoint reachable (empty body test)" : undefined,
          });
        } catch (err: any) {
          ctx.send({
            ok: false,
            error: "Connection failed",
            details: err?.message || err,
          });
        }
      },
      config: {
        auth: false,
      },
    },
  ],

  contentTypes: {
    "cypherscan-scan-result": {
      schema: cypherscanScanResultSchema,
    },
  },
});