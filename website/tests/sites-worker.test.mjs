import assert from "node:assert/strict";
import test from "node:test";

import worker from "../worker/index.js";

function createEnvironment() {
  const requestedPaths = [];
  const env = {
    ASSETS: {
      async fetch(request) {
        const pathname = new URL(request.url).pathname;
        requestedPaths.push(pathname);
        if (pathname === "/index.html") return new Response("app", { status: 200 });
        if (pathname === "/assets/app.js") return new Response("js", { status: 200 });
        return new Response("missing", { status: 404 });
      },
    },
  };
  return { env, requestedPaths };
}

test("serves an existing static asset", async () => {
  const { env, requestedPaths } = createEnvironment();
  const response = await worker.fetch(
    new Request("https://ethnoverse.test/assets/app.js"),
    env,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(requestedPaths, ["/assets/app.js"]);
});

test("falls back to the app shell for a client-side route", async () => {
  const { env, requestedPaths } = createEnvironment();
  const response = await worker.fetch(
    new Request("https://ethnoverse.test/communities/kolhi"),
    env,
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "app");
  assert.deepEqual(requestedPaths, ["/communities/kolhi", "/index.html"]);
});

test("preserves a missing-file response instead of serving HTML", async () => {
  const { env, requestedPaths } = createEnvironment();
  const response = await worker.fetch(
    new Request("https://ethnoverse.test/missing.png"),
    env,
  );

  assert.equal(response.status, 404);
  assert.deepEqual(requestedPaths, ["/missing.png"]);
});
