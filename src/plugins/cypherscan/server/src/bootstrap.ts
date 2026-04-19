export default async ({ strapi }: { strapi: any }) => {
  console.log("[CypherScan] bootstrap running");

  strapi.db.lifecycles.subscribe({
    models: ["plugin::upload.file"],

    async afterCreate(event: any) {
      const file = event.result;

      console.log("[CypherScan] file uploaded");
      console.log("[CypherScan] name:", file?.name);
      console.log("[CypherScan] mime:", file?.mime);
      console.log("[CypherScan] size:", file?.size);
      console.log("[CypherScan] url:", file?.url);
    },
  });
};