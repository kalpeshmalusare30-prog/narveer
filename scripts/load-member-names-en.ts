import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// English (romanized) member names, keyed by memberCode. NTM0040–0057 supplied
// by the org; NTM0001–0039 transliterated in the same spelling conventions
// (Malusare, More (Malusare), Dnyaneshwar, Tulshiram, Raghunath, …).
const NAMES_EN: Record<string, string> = {
  NTM0001: "Dilip Namdev Malusare",
  NTM0002: "Bhavesh Prakash Malusare",
  NTM0003: "Anant Krishna Malusare",
  NTM0004: "Ramchandra Hari Malusare",
  NTM0005: "Vijay Narayan Malusare",
  NTM0006: "Santosh Eknath Malusare",
  NTM0007: "Anand Bhagoji Malusare",
  NTM0008: "Ganesh Gangaram Malusare",
  NTM0009: "Ramesh Gangaram Malusare",
  NTM0010: "Yogesh Narayan Malusare",
  NTM0011: "Dipak Ramchandra Malusare",
  NTM0012: "Vitthal Barku Malusare",
  NTM0013: "Devendra Pandurang Malusare",
  NTM0014: "Vijendra Ashok Malusare",
  NTM0015: "Ravindra Shankar Malusare",
  NTM0016: "Chandrakant Shankar Malusare",
  NTM0017: "Ganpat Tulshiram Malusare",
  NTM0018: "Shivram Kondiba Malusare",
  NTM0019: "Dnyaneshwar Gangaram Malusare",
  NTM0020: "Dnyaneshwar Tulshiram Malusare",
  NTM0021: "Sunil Bhagoji Malusare",
  NTM0022: "Pralhad Namdev Malusare",
  NTM0023: "Haresh Kisan Malusare",
  NTM0024: "Ganpat Mahipat Malusare",
  NTM0025: "Namdev Genu Malusare",
  NTM0026: "Kishor Kondiba Malusare",
  NTM0027: "Tukaram Kondiba Malusare",
  NTM0028: "Pandurang Dagdu Malusare",
  NTM0029: "Sandip Eknath Malusare",
  NTM0030: "Pandurang Manu Malusare",
  NTM0031: "Mandar Ashok Malusare",
  NTM0032: "Suresh Kashinath Malusare",
  NTM0033: "Madhukar Kashinath Malusare",
  NTM0034: "Dipak Parshuram Malusare",
  NTM0035: "Shantaram Dagdu Malusare",
  NTM0036: "Jitendra Bhalchandra Malusare",
  NTM0037: "Bhushan Lilendra More (Malusare)",
  NTM0038: "Santosh Namdev More (Malusare)",
  NTM0039: "Anil Namdev More (Malusare)",
  NTM0040: "Tanaji Tulshiram Malusare",
  NTM0041: "Sachin Ravji Malusare",
  NTM0042: "Mangesh Ramchandra Malusare",
  NTM0043: "Vinod Ramchandra Malusare",
  NTM0044: "Sudhakar Raghunath Malusare",
  NTM0045: "Suresh Balwant More (Malusare)",
  NTM0046: "Sandip Sudhakar More (Malusare)",
  NTM0047: "Dipak Sakharam Malusare",
  NTM0048: "Gopal Krishna Malusare",
  NTM0049: "Dnyaneshwar Namdev Malusare",
  NTM0050: "Sandip Maruti Malusare",
  NTM0051: "Vitthal Narayan Malusare",
  NTM0052: "Bharat Rajaram Malusare",
  NTM0053: "Gunaji Tulshiram Malusare",
  NTM0054: "Yogesh Parshuram Malusare",
  NTM0055: "Laxman Maruti Malusare",
  NTM0056: "Raju Raghunath Malusare",
  NTM0057: "Ravindra Raghunath Malusare",
};

async function main(): Promise<void> {
  let updated = 0;
  let missing = 0;
  for (const [memberCode, fullNameEn] of Object.entries(NAMES_EN)) {
    const res = await db.member.updateMany({
      where: { memberCode },
      data: { fullNameEn },
    });
    if (res.count > 0) updated += res.count;
    else {
      missing++;
      // eslint-disable-next-line no-console
      console.warn(`  (no member found for ${memberCode})`);
    }
  }
  // eslint-disable-next-line no-console
  console.log(`English names set: ${updated} members updated, ${missing} codes not found.`);
  await db.$disconnect();
}

main().catch(async (e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
