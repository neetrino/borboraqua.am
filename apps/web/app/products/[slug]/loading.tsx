export default function ProductLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
      {/* Mobile skeleton */}
      <div className="flex flex-col lg:hidden gap-6">
        <div className="w-full aspect-square bg-gray-100 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-7 bg-gray-100 rounded-lg w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="h-9 bg-gray-100 rounded-lg w-1/3 mt-2" />
          <div className="flex gap-2 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-9 h-9 bg-gray-100 rounded-full" />
            ))}
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-14 h-9 bg-gray-100 rounded-lg" />
            ))}
          </div>
          <div className="h-14 bg-gray-100 rounded-xl w-full mt-2" />
        </div>
      </div>

      {/* Desktop skeleton */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-8 xl:gap-12 items-start">
        {/* Left: image area */}
        <div className="flex flex-row gap-4">
          {/* Thumbnails */}
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-[72px] h-[72px] bg-gray-100 rounded-xl" />
            ))}
          </div>
          {/* Main image */}
          <div className="flex-1 aspect-square bg-gray-100 rounded-2xl" />
        </div>

        {/* Right: product info */}
        <div className="space-y-5 pt-2">
          <div className="h-8 bg-gray-100 rounded-lg w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="h-10 bg-gray-100 rounded-lg w-1/3" />

          {/* Color swatches */}
          <div className="space-y-2 pt-2">
            <div className="h-3 bg-gray-100 rounded w-16" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-9 h-9 bg-gray-100 rounded-full" />
              ))}
            </div>
          </div>

          {/* Size buttons */}
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded w-12" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-14 h-9 bg-gray-100 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Quantity + Add to cart */}
          <div className="flex gap-3 pt-2">
            <div className="w-28 h-12 bg-gray-100 rounded-xl" />
            <div className="flex-1 h-12 bg-gray-100 rounded-xl" />
          </div>

          {/* Description lines */}
          <div className="space-y-2 pt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-3 bg-gray-100 rounded" style={{ width: `${90 - i * 10}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
