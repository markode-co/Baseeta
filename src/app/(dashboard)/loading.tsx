export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Topbar skeleton */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4">
        <div className="h-5 w-40 bg-slate-100 rounded-lg animate-pulse" />
        <div className="flex-1" />
        <div className="h-9 w-9 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-9 w-28 bg-slate-100 rounded-lg animate-pulse" />
      </div>
      {/* Content skeleton */}
      <div className="flex-1 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
          <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
