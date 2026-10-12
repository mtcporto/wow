const assert = require("node:assert/strict");
const base = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/$/, "");
(async () => {
  for (const path of [
    "/",
    "/pets",
    "/explore?spec=250",
    "/index.html",
    "/pets.html",
    "/explore.html?spec=250",
  ]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), /main-content/, path);
  }
  for (const path of [
    "/.env",
    "/.env.local",
    "/.git/config",
    "/server/blizzard.cjs",
  ])
    assert([403, 404].includes((await fetch(base + path)).status), path);
  for (const path of [
    "/data/pets.json",
    "/data/spell-icons.json",
    "/legacy/talent-tree.js",
  ])
    assert.equal((await fetch(base + path)).status, 200, path);
  const api = base + "/api/blizzard";
  const result = await fetch(
    api + "?path=/data/wow/playable-class/index&locale=pt_BR",
  );
  assert.equal(result.status, 200);
  const classes = await result.json();
  assert.equal(classes.classes.length, 13);
  assert(!JSON.stringify(classes).includes("access_token"));
  for (const query of [
    "path=https://evil.test",
    "path=/profile/user/wow",
    "path=/data/wow/pet/1&locale=en_US&locale=pt_BR",
  ])
    assert.equal((await fetch(api + "?" + query)).status, 400, query);
  assert.equal((await fetch(api, { method: "POST" })).status, 405);
  console.log(
    "HTTP verification passed: Next pages, legacy URLs, public catalogues, private-file isolation, live Blizzard classes and API validation.",
  );
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
