import { cn } from "@/lib/utils";

export function PageIntro({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
        {eyebrow}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        {title}
      </h1>
      <p className="max-w-2xl text-sm leading-6 text-zinc-600">{description}</p>
    </div>
  );
}
