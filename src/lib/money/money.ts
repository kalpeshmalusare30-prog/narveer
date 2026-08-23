import { Prisma } from "@prisma/client";

const fmt = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatINR(
  value: Prisma.Decimal | string | number,
): string {
  return "₹" + fmt.format(Number(value.toString()));
}

export function parseAmount(input: string): Prisma.Decimal {
  const trimmed = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error("Invalid amount");
  }
  return new Prisma.Decimal(trimmed);
}
