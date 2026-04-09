interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function HomePageSkeleton() {
  return (
    <div className="space-y-6 pb-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>

      <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5 space-y-4">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 space-y-3">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-28" />
          </div>
        ))}
      </div>

      <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <Skeleton className="h-4 w-16 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function InsightsPageSkeleton() {
  return (
    <div className="space-y-6 pb-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-28" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 space-y-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-44 w-full rounded-xl" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-7 w-7 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-1 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GenericPageSkeleton() {
  return (
    <div className="space-y-6 pb-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-28" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 space-y-3">
          <Skeleton className="h-4 w-32" />
          {[0, 1].map((j) => (
            <div key={j} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
