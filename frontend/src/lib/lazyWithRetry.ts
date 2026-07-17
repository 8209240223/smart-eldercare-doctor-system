import {
  lazy,
  type ComponentType,
  type LazyExoticComponent,
} from "react";

const CHUNK_RELOAD_KEY = "app:chunk-reload-attempt";

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

interface ChunkRecoveryOptions {
  storage?: StorageLike;
  reload?: () => void;
}

export function isChunkLoadError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Loading chunk .* failed/i.test(
    message,
  );
}

export async function importWithChunkRecovery<T>(
  importer: () => Promise<T>,
  options: ChunkRecoveryOptions = {},
): Promise<T> {
  const storage =
    options.storage ??
    (typeof window !== "undefined" ? window.sessionStorage : undefined);
  const reload =
    options.reload ??
    (() => {
      if (typeof window !== "undefined") window.location.reload();
    });

  try {
    const loadedModule = await importer();
    storage?.removeItem(CHUNK_RELOAD_KEY);
    return loadedModule;
  } catch (error) {
    if (!isChunkLoadError(error) || !storage) throw error;

    if (storage.getItem(CHUNK_RELOAD_KEY) === "1") {
      storage.removeItem(CHUNK_RELOAD_KEY);
      throw error;
    }

    storage.setItem(CHUNK_RELOAD_KEY, "1");
    reload();

    // 当前文档即将刷新，保持 Suspense 挂起，避免卸载前再次渲染失败。
    return new Promise<T>(() => undefined);
  }
}

export function lazyWithRetry<T extends ComponentType<object>>(
  importer: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(() => importWithChunkRecovery(importer));
}
