import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em]">
          ERROR 404
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          The page you are looking for does not exist
        </p>
      </div>

      <Link
        href="/"
        className="rounded-full ring-1 px-4 py-2 text-sm font-medium text-primary"
      >
        Back to home
      </Link>
    </main>
  );
}
