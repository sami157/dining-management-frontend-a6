export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 py-16">
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-4 text-sm font-medium text-zinc-600 shadow-sm">
        {label}
      </div>
    </div>
  );
}
