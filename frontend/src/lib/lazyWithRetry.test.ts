import assert from "node:assert/strict";
import test from "node:test";
import {
  importWithChunkRecovery,
  isChunkLoadError,
} from "./lazyWithRetry.ts";

function createStorage(initialValue?: string) {
  const values = new Map<string, string>();
  if (initialValue) values.set("app:chunk-reload-attempt", initialValue);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

test("recognizes stale dynamic import failures", () => {
  assert.equal(
    isChunkLoadError(
      new TypeError(
        "Failed to fetch dynamically imported module: /assets/NurseDashboard-old.js",
      ),
    ),
    true,
  );
  assert.equal(isChunkLoadError(new Error("普通业务错误")), false);
});

test("reloads once when a stale deployment chunk cannot be loaded", async () => {
  const storage = createStorage();
  let reloadCount = 0;

  void importWithChunkRecovery(
    async () => {
      throw new TypeError("Failed to fetch dynamically imported module");
    },
    {
      storage,
      reload: () => {
        reloadCount += 1;
      },
    },
  );

  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(reloadCount, 1);
  assert.equal(storage.getItem("app:chunk-reload-attempt"), "1");
});

test("surfaces the error after the one automatic reload is exhausted", async () => {
  const storage = createStorage("1");
  let reloadCount = 0;
  const error = new TypeError("Failed to fetch dynamically imported module");

  await assert.rejects(
    importWithChunkRecovery(async () => Promise.reject(error), {
      storage,
      reload: () => {
        reloadCount += 1;
      },
    }),
    error,
  );

  assert.equal(reloadCount, 0);
  assert.equal(storage.getItem("app:chunk-reload-attempt"), null);
});

test("clears the reload marker after a successful import", async () => {
  const storage = createStorage("1");
  const loaded = await importWithChunkRecovery(
    async () => ({ default: "loaded" }),
    { storage, reload: () => undefined },
  );

  assert.equal(loaded.default, "loaded");
  assert.equal(storage.getItem("app:chunk-reload-attempt"), null);
});
