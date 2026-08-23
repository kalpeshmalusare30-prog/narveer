import { config } from "dotenv";
config();

import ExcelJS from "exceljs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const FILE = "C:/Users/Kalpesh/Downloads/सभासद वर्गणी.xlsx";
const VARGANI_SHEET = "सभासद वर्गणी 2026";
const THAKBAKI_SHEET = "थकबाकी";

function cellStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object") {
    const o = v as { text?: string; result?: unknown };
    return String(o.text ?? o.result ?? "").trim();
  }
  return String(v).trim();
}
const norm = (s: string) => s.replace(/\s+/g, " ").trim();
function isJunkName(n: string): boolean {
  if (!n) return true;
  if (/\d/.test(n)) return true;
  if (/[_&]/.test(n)) return true;
  return /(वर्गणी|खर्च|जमा|बाकी|पावती|अन्नदान|किलो|भाजी|गुलाब|एकुण|टीप|प्रसाद|देणगी|फंड|अहवाल|note|total)/i.test(
    n,
  );
}
// aggressive normalisation to detect "same person, different spelling"
const canon = (s: string) =>
  norm(s)
    .replace(/[()]/g, "")
    .replace(/मालुसरे|मालूसरे/g, "मालुसरे")
    .replace(/\s+/g, "")
    .trim();

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE);

  const vargani: string[] = [];
  const seenV = new Set<string>();
  wb.getWorksheet(VARGANI_SHEET)?.eachRow((row, n) => {
    if (n < 4) return;
    const a = (row.values as unknown[]).slice(1);
    const name = norm(cellStr(a[1]));
    if (!name || isJunkName(name) || seenV.has(name)) return;
    seenV.add(name);
    vargani.push(name);
  });

  const thak: string[] = [];
  const seenT = new Set<string>();
  wb.getWorksheet(THAKBAKI_SHEET)?.eachRow((row, n) => {
    if (n < 4) return;
    const a = (row.values as unknown[]).slice(1);
    const anu = cellStr(a[0]);
    const name = norm(cellStr(a[1]));
    if (!name || isJunkName(name) || !/^\d+$/.test(anu)) return;
    if (seenT.has(name)) {
      console.log(`  [thakbaki DUP row] ${name}`);
      return;
    }
    seenT.add(name);
    thak.push(name);
  });

  console.log(`\n=== vargani names: ${vargani.length} ===`);
  console.log(`=== thakbaki names: ${thak.length} ===`);

  const allNames = new Set<string>([...vargani, ...thak]);
  console.log(`=== union (what loader created): ${allNames.size} ===\n`);

  // names only in thakbaki (added as extra members)
  const vSet = new Set(vargani);
  const onlyThak = thak.filter((n) => !vSet.has(n));
  console.log(`--- names in thakbaki but NOT in vargani (${onlyThak.length}) ---`);
  onlyThak.forEach((n) => console.log(`   ${n}`));

  // near-duplicates across the union by aggressive canon
  console.log(`\n--- near-duplicate groups (same canonical form, different raw text) ---`);
  const byCanon = new Map<string, string[]>();
  for (const n of allNames) {
    const c = canon(n);
    if (!byCanon.has(c)) byCanon.set(c, []);
    byCanon.get(c)!.push(n);
  }
  let dupGroups = 0;
  for (const [c, names] of byCanon) {
    if (names.length > 1) {
      dupGroups++;
      console.log(`   [${c}] => ${names.map((x) => `"${x}"`).join("  |  ")}`);
    }
  }
  if (!dupGroups) console.log("   (none)");

  // DB view
  const org = await db.organization.findUnique({ where: { shortName: "NTMP" } });
  if (org) {
    const members = await db.member.findMany({
      where: { organizationId: org.id },
      select: { memberCode: true, fullName: true },
      orderBy: { memberCode: "asc" },
    });
    console.log(`\n=== DB members: ${members.length} ===`);
    const dbByCanon = new Map<string, string[]>();
    for (const m of members) {
      const c = canon(m.fullName);
      if (!dbByCanon.has(c)) dbByCanon.set(c, []);
      dbByCanon.get(c)!.push(`${m.memberCode} ${m.fullName}`);
    }
    console.log(`--- DB near-duplicate groups ---`);
    let dbDup = 0;
    for (const [, names] of dbByCanon) {
      if (names.length > 1) {
        dbDup++;
        console.log(`   ${names.join("   |   ")}`);
      }
    }
    if (!dbDup) console.log("   (none)");
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
