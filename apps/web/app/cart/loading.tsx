export default function CartLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Title */}
      <div className="h-8 bg-gray-100 rounded-lg w-40 mb-8" />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart items */}
        <div className="flex-1 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100">
              <div className="w-24 h-24 bg-gray-100 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-5 bg-gray-100 rounded w-1/4" />
                <div className="flex justify-between items-center mt-2">
                  <div className="h-8 bg-gray-100 rounded-lg w-28" />
                  <div className="h-8 bg-gray-100 rounded-lg w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:w-80 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="h-5 bg-gray-100 rounded w-1/2" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              ))}
            </div>
            <div className="h-12 bg-gray-100 rounded-xl w-full mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
