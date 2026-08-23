export interface StorageProvider {
  save(key: string, data: Buffer, contentType?: string): Promise<string>;
  url(ref: string): string;
  read(ref: string): Promise<Buffer>;
}
