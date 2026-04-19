import bootstrap from "./bootstrap";

export default () => ({
  register() {
    console.log("[CypherScan] plugin loaded");
  },
  bootstrap,
});