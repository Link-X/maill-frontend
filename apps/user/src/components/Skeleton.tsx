import { cn } from '@maill/shared';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border/60 p-4 space-y-3">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
