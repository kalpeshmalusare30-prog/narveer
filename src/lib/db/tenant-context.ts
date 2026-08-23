import { AsyncLocalStorage } from "node:async_hooks";

export type TenantContext = {
  organizationId: string;
  userId?: string;
  isSuperAdmin?: boolean;
};

const als = new AsyncLocalStorage<TenantContext>();

export const getTenant = () => als.getStore();

export function runWithTenant<T>(
  ctx: TenantContext,
  fn: () => Promise<T> | T,
): Promise<T> {
  // Await inside the ALS scope so a lazily-executed thenable (e.g. a Prisma
  // query returned but not yet awaited by `fn`) still runs with the context
  // active. Returning the promise directly would let the context exit first.
  return als.run(ctx, async () => await fn());
}
