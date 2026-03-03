export default function ProfileLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="md:w-64 flex-shrink-0 space-y-3">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full" />
            <div className="h-4 bg-gray-100 rounded w-32" />
            <div className="h-3 bg-gray-100 rounded w-24" />
          </div>
          {/* Nav items */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-9 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="h-6 bg-gray-100 rounded w-1/3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-10 bg-gray-100 rounded-xl" />
                </div>
              ))}
            </div>
            <div className="h-11 bg-gray-100 rounded-xl w-36 mt-2" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="h-6 bg-gray-100 rounded w-1/4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
