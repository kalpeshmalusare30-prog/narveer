/**
 * Convert a rupee amount to Marathi words for printed receipts —
 * e.g. "1200" → "एक हजार दोनशे रुपये फक्त".
 * Supports 0 … 99,99,99,999 (Indian grouping: कोटी / लाख / हजार / शे).
 */

// 0–99 have distinct Marathi words.
const ONES = [
  "शून्य", "एक", "दोन", "तीन", "चार", "पाच", "सहा", "सात", "आठ", "नऊ",
  "दहा", "अकरा", "बारा", "तेरा", "चौदा", "पंधरा", "सोळा", "सतरा", "अठरा", "एकोणीस",
  "वीस", "एकवीस", "बावीस", "तेवीस", "चोवीस", "पंचवीस", "सव्वीस", "सत्तावीस", "अठ्ठावीस", "एकोणतीस",
  "तीस", "एकतीस", "बत्तीस", "तेहतीस", "चौतीस", "पस्तीस", "छत्तीस", "सदतीस", "अडतीस", "एकोणचाळीस",
  "चाळीस", "एक्केचाळीस", "बेचाळीस", "त्रेचाळीस", "चव्वेचाळीस", "पंचेचाळीस", "सेहेचाळीस", "सत्तेचाळीस", "अठ्ठेचाळीस", "एकोणपन्नास",
  "पन्नास", "एक्कावन्न", "बावन्न", "त्रेपन्न", "चोपन्न", "पंचावन्न", "छप्पन्न", "सत्तावन्न", "अठ्ठावन्न", "एकोणसाठ",
  "साठ", "एकसष्ट", "बासष्ट", "त्रेसष्ट", "चौसष्ट", "पासष्ट", "सहासष्ट", "सदुसष्ट", "अडुसष्ट", "एकोणसत्तर",
  "सत्तर", "एक्काहत्तर", "बाहत्तर", "त्र्याहत्तर", "चौऱ्याहत्तर", "पंच्याहत्तर", "शहात्तर", "सत्याहत्तर", "अठ्ठ्याहत्तर", "एकोणऐंशी",
  "ऐंशी", "एक्क्याऐंशी", "ब्याऐंशी", "त्र्याऐंशी", "चौऱ्याऐंशी", "पंच्याऐंशी", "शहाऐंशी", "सत्त्याऐंशी", "अठ्ठ्याऐंशी", "एकोणनव्वद",
  "नव्वद", "एक्क्याण्णव", "ब्याण्णव", "त्र्याण्णव", "चौऱ्याण्णव", "पंच्याण्णव", "शहाण्णव", "सत्त्याण्णव", "अठ्ठ्याण्णव", "नव्व्याण्णव",
];

/** 0–999 in words ("" for 0 when used as a group). */
function threeDigits(n: number): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h === 1 && rest === 0) return "शंभर";
  if (h > 0) parts.push(h === 1 ? "एकशे" : `${ONES[h]}शे`);
  if (rest > 0) parts.push(ONES[rest]);
  return parts.join(" ");
}

/** Whole-number rupees to Marathi words (no suffix). */
export function numberToMarathiWords(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "";
  n = Math.floor(n);
  if (n === 0) return ONES[0];
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const below = n % 1000;
  const parts: string[] = [];
  if (crore > 0) parts.push(`${numberToMarathiWords(crore)} कोटी`);
  if (lakh > 0) parts.push(`${threeDigits(lakh)} लाख`);
  if (thousand > 0) parts.push(`${threeDigits(thousand)} हजार`);
  if (below > 0) parts.push(threeDigits(below));
  return parts.join(" ");
}

/** "1200" / "1200.50" → "एक हजार दोनशे रुपये फक्त" (paise noted when present). */
export function amountInMarathiWords(amount: string | number): string {
  const value = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(value) || value < 0) return "";
  const rupees = Math.floor(value);
  const paise = Math.round((value - rupees) * 100);
  let out = `${numberToMarathiWords(rupees)} रुपये`;
  if (paise > 0) out += ` ${numberToMarathiWords(paise)} पैसे`;
  return `${out} फक्त`;
}
