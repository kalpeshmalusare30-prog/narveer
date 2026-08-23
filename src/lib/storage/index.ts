import { LocalStorageProvider } from "./local";
import type { StorageProvider } from "./provider";

export const storage: StorageProvider = new LocalStorageProvider();
export type { StorageProvider } from "./provider";
