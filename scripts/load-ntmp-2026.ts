import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// "सभासद वर्गणी 2026 बाकी" — pending-vargani members from the provided sheet.
const MEMBERS = [
  "विजय नारायण मालुसरे",
  "संतोष एकनाथ मालुसरे",
  "गणेश गंगाराम मालुसरे",
  "रवींद्र शंकर मालुसरे",
  "चंद्रकांत शंकर मालुसरे",
  "ज्ञानेश्वर गंगाराम मालुसरे",
  "ज्ञानेश्वर तुळशिराम मालुसरे",
  "पांडुरंग मनु मालुसरे",
  "मंदार अशोक मालुसरे",
  "सुरेश काशिनाथ मालुसरे",
  "मधुकर काशिनाथ मालुसरे",
  "दिपक परशुराम मालुसरे",
  "संदिप मारुती मालुसरे",
  "भरत राजाराम मालुसरे",
  "योगेश परशुराम मालुसरे",
];

const FY_LABEL = "2026-27";

async function nextMemberCode(orgId: string): Promise<string> {
  const org = await db.organization.update({
    where: { id: orgId },
    data: { memberCodeSeq: { increment: 1 } },
    select: { memberCodePrefix: true, memberCodeSeq: true },
  });
  return `${org.memberCodePrefix}${String(org.memberCodeSeq).padStart(4, "0")}`;
}

async function main() {
  const org = await db.organization.findUnique({ where: { shortName: "NTMP" } });
  if (!org) throw new Error("NTMP organization not found (run the seed first)");

  const status = await db.memberStatus.findFirst({
    where: { organizationId: org.id, name: "Active" },
  });
  if (!status) throw new Error("Active member status not found");
  const type = await db.membershipType.findFirst({
    where: { organizationId: org.id, name: "General" },
  });

  const fy =
    (await db.financialYear.findFirst({
      where: { organizationId: org.id, label: FY_LABEL },
    })) ??
    (await db.financialYear.create({
      data: {
        organizationId: org.id,
        label: FY_LABEL,
        feeAmount: org.defaultMembershipFee,
        startDate: new Date(Date.UTC(2026, 3, 1)),
        endDate: new Date(Date.UTC(2027, 2, 31)),
        isActive: true,
      },
    }));

  let created = 0;
  let feesAssigned = 0;
  for (const name of MEMBERS) {
    let member = await db.member.findFirst({
      where: { organizationId: org.id, fullName: name },
    });
    if (!member) {
      member = await db.member.create({
        data: {
          organizationId: org.id,
          memberCode: await nextMemberCode(org.id),
          fullName: name,
          statusId: status.id,
          membershipTypeId: type?.id ?? null,
        },
      });
      created++;
    }
    const existingFee = await db.annualFee.findFirst({
      where: { organizationId: org.id, memberId: member.id, financialYearId: fy.id },
    });
    if (!existingFee) {
      await db.annualFee.create({
        data: {
          organizationId: org.id,
          memberId: member.id,
          financialYearId: fy.id,
          feeAmount: fy.feeAmount,
        },
      });
      feesAssigned++;
    }
  }
  // eslint-disable-next-line no-console
  console.log(
    `NTMP ${FY_LABEL}: members created=${created}, vargani assigned=${feesAssigned}, total in sheet=${MEMBERS.length}`,
  );
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
