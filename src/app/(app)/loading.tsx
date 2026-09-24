// Shown the instant a tab is clicked (it's prefetched with the link), while the page's data loads.
// Deliberately plain: a heading line and a few card shapes, so any tab can use it.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="h-8 w-56 rounded-lg bg-secondary motion-safe:animate-pulse" />
      <div className="h-4 w-40 rounded bg-secondary motion-safe:animate-pulse" />
      <div className="mt-2 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="h-48 rounded-2xl bg-secondary motion-safe:animate-pulse" />
        <div className="h-48 rounded-2xl bg-secondary motion-safe:animate-pulse" />
        <div className="h-72 rounded-2xl bg-secondary motion-safe:animate-pulse" />
        <div className="h-72 rounded-2xl bg-secondary motion-safe:animate-pulse" />
      </div>
    </div>
  );
}
