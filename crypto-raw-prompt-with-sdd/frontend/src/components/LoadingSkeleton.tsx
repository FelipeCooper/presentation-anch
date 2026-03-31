function SkeletonPulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading portfolio summary" role="status">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg bg-white p-5 shadow">
          <SkeletonPulse className="h-4 w-24 mb-3" />
          <SkeletonPulse className="h-8 w-32" />
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function HoldingsTableSkeleton() {
  return (
    <div className="rounded-lg bg-white shadow" aria-label="Loading holdings table" role="status">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Asset', 'Quantity', 'Avg. Price', 'Current Price', 'Value', 'Alloc.', 'P&L', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {Array.from({ length: 3 }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3"><SkeletonPulse className="h-5 w-28" /><SkeletonPulse className="h-3 w-12 mt-1" /></td>
                <td className="px-4 py-3"><SkeletonPulse className="h-5 w-16 ml-auto" /></td>
                <td className="px-4 py-3"><SkeletonPulse className="h-5 w-20 ml-auto" /></td>
                <td className="px-4 py-3"><SkeletonPulse className="h-5 w-20 ml-auto" /></td>
                <td className="px-4 py-3"><SkeletonPulse className="h-5 w-24 ml-auto" /></td>
                <td className="px-4 py-3"><SkeletonPulse className="h-5 w-12 ml-auto" /></td>
                <td className="px-4 py-3"><SkeletonPulse className="h-5 w-20 ml-auto" /></td>
                <td className="px-4 py-3"><SkeletonPulse className="h-5 w-20 ml-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function AllocationChartSkeleton() {
  return (
    <div className="rounded-lg bg-white p-5 shadow" aria-label="Loading allocation chart" role="status">
      <SkeletonPulse className="h-6 w-24 mb-4" />
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse rounded-full bg-gray-200 h-48 w-48" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <SummaryCardsSkeleton />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HoldingsTableSkeleton />
        </div>
        <AllocationChartSkeleton />
      </div>
    </div>
  );
}
