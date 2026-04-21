import bootstrap from "./bootstrap";
import destroy from "./destroy";
import register from "./register";
import cypherscanScanResultSchema from "./content-types/cypherscan-scan-result/schema.json";

export default {
  register,
  bootstrap,
  destroy,
  contentTypes: {
    "cypherscan-scan-result": {
      schema: cypherscanScanResultSchema,
    },
  },
};