const pluginId = "cypherscan";

export default {
  register(app: any) {
    app.registerPlugin({
      id: pluginId,
      name: "CypherScan",
    });
  },

  bootstrap() {},

  async registerTrads() {
    return [];
  },
};