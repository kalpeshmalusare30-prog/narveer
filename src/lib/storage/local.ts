import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import type { StorageProvider } from "./provider";

export class LocalStorageProvider implements StorageProvider {
  constructor(
    private baseDir = process.env.STORAGE_LOCAL_DIR ?? "./uploads",
  ) {}

  async save(key: string, data: Buffer): Promise<string> {
    const full = path.join(this.baseDir, key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
    return key;
  }

  url(ref: string): string {
    return `/api/files/${ref}`;
  }

  read(ref: string): Promise<Buffer> {
    return readFile(path.join(this.baseDir, ref));
  }
}
