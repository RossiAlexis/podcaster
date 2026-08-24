function SkeletonBar({ className }: { className: string }) {
  return <div className={`rounded bg-slate-200 ${className}`} />;
}

export function EpisodeListSkeleton() {
  return (
    <section
      aria-label="Loading episodes"
      aria-live="polite"
      className="animate-pulse"
      role="status"
    >
      <span className="sr-only">Loading episodes…</span>
      <div className="mb-6 rounded-lg border border-slate-200 bg-surface p-5 shadow-card">
        <SkeletonBar className="h-8 w-40" />
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-surface shadow-card">
        <div className="grid grid-cols-[1fr_8rem_6rem] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <SkeletonBar className="h-5 w-16" />
          <SkeletonBar className="h-5 w-12" />
          <SkeletonBar className="h-5 w-16" />
        </div>
        {Array.from({ length: 6 }, (_, index) => (
          <div
            className="grid grid-cols-[1fr_8rem_6rem] gap-4 border-b border-slate-100 px-4 py-4 last:border-b-0"
            key={index}
          >
            <SkeletonBar className="h-5 w-3/4" />
            <SkeletonBar className="h-5 w-20" />
            <SkeletonBar className="h-5 w-12" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function PodcastDetailSkeleton() {
  return (
    <main
      aria-label="Loading podcast"
      aria-live="polite"
      className="mx-auto grid max-w-7xl gap-7 px-4 py-8 sm:px-6 lg:grid-cols-[18rem_1fr]"
      role="status"
    >
      <span className="sr-only">Loading podcast…</span>
      <aside
        aria-hidden="true"
        className="h-fit animate-pulse rounded-lg border border-slate-200 bg-surface p-5 shadow-card"
      >
        <div className="mx-auto aspect-square w-full max-w-64 rounded-md bg-slate-200" />
        <div className="my-5 space-y-3 border-y border-slate-200 py-4">
          <SkeletonBar className="h-5 w-4/5" />
          <SkeletonBar className="h-4 w-1/2" />
          <SkeletonBar className="h-3 w-1/3" />
        </div>
        <SkeletonBar className="h-4 w-24" />
        <div className="mt-3 space-y-2">
          <SkeletonBar className="h-3 w-full" />
          <SkeletonBar className="h-3 w-full" />
          <SkeletonBar className="h-3 w-3/4" />
        </div>
      </aside>
      <div aria-hidden="true">
        <EpisodeListSkeleton />
      </div>
    </main>
  );
}
