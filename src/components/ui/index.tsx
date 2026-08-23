import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/* ------------------------------------------------------------------ Button */

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:ring-indigo-500",
  secondary:
    "bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50 focus-visible:ring-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700",
  danger:
    "bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-500",
  ghost:
    "text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400 dark:text-slate-300 dark:hover:bg-slate-800",
};
const BTN_SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${BTN_VARIANT[variant]} ${BTN_SIZE[size]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------- Inputs */

const FIELD_BASE =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${FIELD_BASE} ${className}`} {...props} />;
}

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${FIELD_BASE} ${className}`} {...props} />;
}

export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${FIELD_BASE} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  /** @deprecated association is implicit */
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        className={`text-sm font-medium text-slate-700 dark:text-slate-200 ${
          required ? "after:ml-0.5 after:text-rose-500 after:content-['*']" : ""
        }`}
      >
        {label}
      </span>
      {children}
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

/* -------------------------------------------------------------------- Cards */

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = "slate",
  sub,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: "indigo" | "emerald" | "rose" | "amber" | "slate";
  sub?: ReactNode;
}) {
  const tones: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-700",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-semibold tabular text-slate-900 dark:text-slate-50">
            {value}
          </div>
          {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
        </div>
        {icon && (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Headers */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------- Alerts */

export function Alert({
  kind = "error",
  children,
}: {
  kind?: "error" | "success" | "info" | "warning";
  children: ReactNode;
}) {
  const styles: Record<string, string> = {
    error: "bg-rose-50 text-rose-700 border-rose-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
  };
  return (
    <div
      role="alert"
      className={`rounded-lg border px-3.5 py-2.5 text-sm ${styles[kind]}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------- Badges */

type Tone = "green" | "slate" | "red" | "amber" | "indigo" | "sky";
const TONES: Record<Tone, string> = {
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  red: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
};

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  Paid: "green",
  Partial: "amber",
  Pending: "red",
  Waived: "slate",
  Exempted: "slate",
  Cancelled: "slate",
  Active: "green",
  Inactive: "slate",
  Suspended: "amber",
  Sent: "sky",
  Delivered: "green",
  Read: "green",
  Failed: "red",
  Voided: "red",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "slate"}>{status}</Badge>;
}

/* -------------------------------------------------------------------- Table */

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}
export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-900/40">
      {children}
    </thead>
  );
}
export function TR({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={`border-b border-slate-100 last:border-0 hover:bg-slate-50/60 dark:border-slate-700/60 dark:hover:bg-slate-700/30 ${className}`}
    >
      {children}
    </tr>
  );
}
export function TH({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-semibold ${className}`}>{children}</th>;
}
export function TD({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

/* -------------------------------------------------------------- Empty/Load */

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-800/40">
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-700">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {title}
      </p>
      {hint && <p className="mt-1 max-w-sm text-sm text-slate-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 ${className}`}
      aria-label="loading"
    />
  );
}
