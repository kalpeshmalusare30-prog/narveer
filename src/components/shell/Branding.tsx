export function Branding({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string | null;
}) {
  return (
    <div className="flex items-center gap-2">
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className="h-9 w-9 rounded object-contain"
          data-testid="org-logo"
        />
      )}
      <span className="text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
        {name}
      </span>
    </div>
  );
}
