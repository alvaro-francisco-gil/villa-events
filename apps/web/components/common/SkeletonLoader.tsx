export function SkeletonLoader({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
      <SkeletonLoader className="h-5 w-3/4" />
      <SkeletonLoader className="h-4 w-1/2" />
      <SkeletonLoader className="h-4 w-1/3" />
    </div>
  );
}
