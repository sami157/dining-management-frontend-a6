'use client'

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
        <main className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Application error
          </p>
          <h1 className="title-font mt-4 text-4xl tracking-tight">
            Something went wrong
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            An unexpected error interrupted this page. Try the action again or return to the home page.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Try again
            </button>
            <Link
              href="/"
              className="rounded-full border border-border px-5 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Go home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
