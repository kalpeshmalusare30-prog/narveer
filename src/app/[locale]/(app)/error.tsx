"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  const forbidden = error.message?.includes("FORBIDDEN");
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
        {forbidden
          ? "You don't have permission to view this."
          : "Something went wrong."}
      </h2>
      {!forbidden && (
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
