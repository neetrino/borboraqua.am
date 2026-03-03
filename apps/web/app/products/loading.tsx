export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Hero / filters bar */}
      <div className="h-10 bg-gray-100 rounded-xl w-64 mb-6" />

      {/* Filters row */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 bg-gray-100 rounded-full w-24" />
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-square bg-gray-100 rounded-2xl" />
            <div className="h-3 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
