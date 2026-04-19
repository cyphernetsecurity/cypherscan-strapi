import type { Core } from "@strapi/strapi";

export default ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.log.info("[CypherScan] plugin destroy");
};