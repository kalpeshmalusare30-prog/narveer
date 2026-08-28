export type MemberNameParts = { fullName: string; fullNameEn?: string | null };

/**
 * Locale-aware member display name. Member names are data (stored in Marathi),
 * with an optional romanized English name in `fullNameEn`. In the English UI we
 * show the English name when present, otherwise fall back to the Marathi name.
 */
export function memberName(m: MemberNameParts, locale: string): string {
  return locale === "en" && m.fullNameEn?.trim() ? m.fullNameEn.trim() : m.fullName;
}
