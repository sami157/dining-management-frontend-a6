import { Spinner } from "../ui/spinner";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="rounded-xl flex-col items-center justify-center text-sm font-bold text-zinc-600">
        <div className="flex items-center mb-2 justify-center">
          <Spinner />
        </div>
        <div>
          {label}
        </div>
      </div>
    </div>
  );
}
