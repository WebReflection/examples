if (typeof require === "undefined")
  globalThis.require = module => import(module);

(async function main() {
  const { ref: aRef } = await require("a");
  const { ref: bRef } = await require("b");

  console.assert(Object.is(aRef, bRef), "hazards detected");
}());
