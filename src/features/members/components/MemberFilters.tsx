import { getTranslations } from "next-intl/server";
import { Input, Select, Button } from "@/components/ui";

type Option = { id: string; name: string };

export async function MemberFilters({
  statuses,
  types,
  current,
}: {
  statuses: Option[];
  types: Option[];
  current: { q?: string; statusId?: string; membershipTypeId?: string };
}) {
  const t = await getTranslations();
  return (
    <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-48">
        <Input
          name="q"
          defaultValue={current.q ?? ""}
          placeholder={t("members.searchPlaceholder")}
          aria-label={t("common.search")}
        />
      </div>
      <Select
        name="statusId"
        defaultValue={current.statusId ?? ""}
        aria-label={t("members.status")}
        className="w-44"
      >
        <option value="">{t("members.allStatuses")}</option>
        {statuses.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      <Select
        name="membershipTypeId"
        defaultValue={current.membershipTypeId ?? ""}
        aria-label={t("members.membershipType")}
        className="w-44"
      >
        <option value="">{t("members.allTypes")}</option>
        {types.map((ty) => (
          <option key={ty.id} value={ty.id}>
            {ty.name}
          </option>
        ))}
      </Select>
      <Button type="submit">{t("common.search")}</Button>
    </form>
  );
}
