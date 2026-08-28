"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { setAttendanceAction } from "@/features/events/actions";
import { Card, Button, Badge } from "@/components/ui";
import { memberName } from "@/features/members/name";

type Member = {
  id: string;
  fullName: string;
  fullNameEn: string | null;
  memberCode: string;
};

type AttendanceStatus = "Present" | "Absent" | "Excused";

type Attendance = {
  memberId: string;
  status: string;
};

const STATUS_TONE: Record<AttendanceStatus, "green" | "red" | "amber"> = {
  Present: "green",
  Absent: "red",
  Excused: "amber",
};

export function AttendancePanel({
  eventId,
  members,
  attendances,
}: {
  eventId: string;
  members: Member[];
  attendances: Attendance[];
}) {
  const t = useTranslations("events");
  const locale = useLocale();
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const statusByMember = new Map(attendances.map((a) => [a.memberId, a.status]));
  const presentCount = attendances.filter((a) => a.status === "Present").length;

  function mark(memberId: string, status: AttendanceStatus) {
    setPendingId(memberId);
    startTransition(async () => {
      try {
        await setAttendanceAction(eventId, memberId, status);
        router.refresh();
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">
          {t("attendance")}
        </h2>
        <span className="text-sm text-slate-500">
          {t("presentCount")}: {presentCount} / {t("totalMembers")}:{" "}
          {members.length}
        </span>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {members.map((m) => {
          const status = statusByMember.get(m.id) as AttendanceStatus | undefined;
          const busy = pendingId === m.id;
          return (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {memberName(m, locale)}
                </span>
                <span className="font-mono text-xs text-slate-400">
                  {m.memberCode}
                </span>
                {status && (
                  <Badge tone={STATUS_TONE[status]}>{t(status.toLowerCase())}</Badge>
                )}
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant={status === "Present" ? "primary" : "secondary"}
                  size="sm"
                  disabled={busy}
                  onClick={() => mark(m.id, "Present")}
                >
                  {t("present")}
                </Button>
                <Button
                  variant={status === "Absent" ? "danger" : "secondary"}
                  size="sm"
                  disabled={busy}
                  onClick={() => mark(m.id, "Absent")}
                >
                  {t("absent")}
                </Button>
                <Button
                  variant={status === "Excused" ? "primary" : "secondary"}
                  size="sm"
                  disabled={busy}
                  onClick={() => mark(m.id, "Excused")}
                >
                  {t("excused")}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
