import { z } from "zod";

export const memberInput = z.object({
  fullName: z.string().trim().min(1, "Required"),
  mobile: z.string().trim().min(1, "Required"),
  whatsappNumber: z.string().trim().optional().nullable(),
  alternateMobile: z.string().trim().optional().nullable(),
  email: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  area: z.string().trim().optional().nullable(),
  dateOfBirth: z.string().trim().optional().nullable(),
  joiningDate: z.string().trim().optional().nullable(),
  membershipTypeId: z.string().trim().optional().nullable(),
  statusId: z.string().trim().min(1, "Required"),
  notes: z.string().trim().optional().nullable(),
});

export type MemberInput = z.infer<typeof memberInput>;
