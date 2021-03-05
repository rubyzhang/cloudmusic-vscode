import * as LRU from "lru-cache";
import * as NodeCache from "node-cache";
import * as cacache from "cacache";
import {
  LYRIC_CACHE_DIR,
  MUSIC_CACHE_DIR,
  MUSIC_CACHE_SIZE,
} from "../constant";
import type { LruCacheValue, LyricData } from "../constant";
import { Uri, workspace } from "vscode";

export const apiCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 600,
  useClones: false,
  deleteOnExpire: true,
  enableLegacyCallbacks: false,
  maxKeys: -1,
});

export class MusicCache {
  static readonly lruCache = new LRU({
    max: MUSIC_CACHE_SIZE,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    length: (n: LruCacheValue, _key: string) => n.size,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dispose: (key: string, n: LruCacheValue) => {
      void cacache.rm.entry(MUSIC_CACHE_DIR.fsPath, key);
      void cacache.rm.content(MUSIC_CACHE_DIR.fsPath, n.integrity);
    },
    noDisposeOnSet: true,
  });

  static async init(): Promise<void> {
    try {
      const res = await cacache.ls(MUSIC_CACHE_DIR.fsPath);
      for (const item in res) {
        const { key, integrity, size } = res[item];
        this.lruCache.set(key, { integrity, size });
      }
    } catch {}
  }

  static verify(): void {
    void cacache.verify(MUSIC_CACHE_DIR.fsPath);
  }

  static async get(key: string): Promise<string | void> {
    try {
      const { path } = await cacache.get.info(MUSIC_CACHE_DIR.fsPath, key);
      this.lruCache.get(key);
      return path;
    } catch {}
    return;
  }

  static async put(key: string, path: Uri, md5?: string): Promise<void> {
    try {
      await cacache.put(
        MUSIC_CACHE_DIR.fsPath,
        key,
        await workspace.fs.readFile(path),
        md5
          ? {
              integrity: `md5-${Buffer.from(md5, "hex").toString("base64")}`,
              algorithms: ["md5"],
            }
          : undefined
      );
      const { integrity, size } = await cacache.get.info(
        MUSIC_CACHE_DIR.fsPath,
        key
      );
      this.lruCache.set(key, { integrity, size });
    } catch {}
  }
}

export class LyricCache {
  static async clear(): Promise<void> {
    await workspace.fs.delete(LYRIC_CACHE_DIR, {
      recursive: true,
      useTrash: false,
    });
    await workspace.fs.createDirectory(LYRIC_CACHE_DIR);
  }

  static async get(key: string): Promise<LyricData | void> {
    try {
      const path = Uri.joinPath(LYRIC_CACHE_DIR, key);
      const data = JSON.parse(
        (await workspace.fs.readFile(path)).toString()
      ) as LyricData;
      // 7 * 24 * 60 * 60 * 1000
      if (Date.now() - data.ctime < 604800000) return data;
      else void workspace.fs.delete(path, { recursive: true, useTrash: false });
    } catch {}
    return;
  }

  static put(key: string, data: LyricData): void {
    try {
      void workspace.fs.writeFile(
        Uri.joinPath(LYRIC_CACHE_DIR, key),
        Buffer.from(JSON.stringify(data), "utf8")
      );
    } catch {}
  }
}
