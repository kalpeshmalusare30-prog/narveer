-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "photoDataUri" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "emailConfigured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailFromAddress" TEXT,
ADD COLUMN     "emailProvider" TEXT,
ADD COLUMN     "paymentGatewayConfigured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentGatewayKeyId" TEXT,
ADD COLUMN     "paymentGatewayProvider" TEXT,
ADD COLUMN     "smsConfigured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smsProvider" TEXT,
ADD COLUMN     "smsSenderId" TEXT,
ADD COLUMN     "upiId" TEXT,
ADD COLUMN     "upiPayeeName" TEXT;

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Event',
    "eventDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAttendance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Present',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "memberId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'Donation',
    "purpose" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "donationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentModeId" TEXT,
    "referenceNumber" TEXT,
    "receiptNumber" TEXT,
    "notes" TEXT,
    "isVoided" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberDocument" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "dataUri" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberRelation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "relatedMemberId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_organizationId_idx" ON "Event"("organizationId");

-- CreateIndex
CREATE INDEX "Event_organizationId_eventDate_idx" ON "Event"("organizationId", "eventDate");

-- CreateIndex
CREATE INDEX "EventAttendance_organizationId_idx" ON "EventAttendance"("organizationId");

-- CreateIndex
CREATE INDEX "EventAttendance_eventId_idx" ON "EventAttendance"("eventId");

-- CreateIndex
CREATE INDEX "EventAttendance_memberId_idx" ON "EventAttendance"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "EventAttendance_eventId_memberId_key" ON "EventAttendance"("eventId", "memberId");

-- CreateIndex
CREATE INDEX "Donation_organizationId_idx" ON "Donation"("organizationId");

-- CreateIndex
CREATE INDEX "Donation_memberId_idx" ON "Donation"("memberId");

-- CreateIndex
CREATE INDEX "MemberDocument_organizationId_idx" ON "MemberDocument"("organizationId");

-- CreateIndex
CREATE INDEX "MemberDocument_memberId_idx" ON "MemberDocument"("memberId");

-- CreateIndex
CREATE INDEX "MemberRelation_organizationId_idx" ON "MemberRelation"("organizationId");

-- CreateIndex
CREATE INDEX "MemberRelation_memberId_idx" ON "MemberRelation"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberRelation_memberId_relatedMemberId_relationType_key" ON "MemberRelation"("memberId", "relatedMemberId", "relationType");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAttendance" ADD CONSTRAINT "EventAttendance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAttendance" ADD CONSTRAINT "EventAttendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAttendance" ADD CONSTRAINT "EventAttendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_paymentModeId_fkey" FOREIGN KEY ("paymentModeId") REFERENCES "PaymentMode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberDocument" ADD CONSTRAINT "MemberDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberDocument" ADD CONSTRAINT "MemberDocument_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberRelation" ADD CONSTRAINT "MemberRelation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberRelation" ADD CONSTRAINT "MemberRelation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberRelation" ADD CONSTRAINT "MemberRelation_relatedMemberId_fkey" FOREIGN KEY ("relatedMemberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
