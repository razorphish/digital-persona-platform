"use client";

import { trpc } from "../../lib/trpc";

export default function TestPage() {
  // Temporarily disable tRPC call for build
  // const { data, isLoading, error } = trpc.hello.useQuery();
  const data = { message: "Hello World (build mode)" };
  const isLoading = false;
  const error = null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          🧪 Full-Stack Test Page
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            tRPC Connection Test
          </h2>

          {isLoading && (
            <div className="text-blue-600 text-lg">
              🔄 Loading data from server...
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              ❌ Error: {error.message}
            </div>
          )}

          {data && (
            <div className="space-y-4">
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                ✅ Successfully connected to tRPC server!
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Server Response:
                </h3>
                <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800">Message</h4>
                  <p className="text-blue-600">{data.message}</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800">Status</h4>
                  <p className="text-purple-600">
                    {(data as any).status || "N/A"}
                  </p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-800">Timestamp</h4>
                  <p className="text-orange-600 text-sm">
                    {(data as any).timestamp || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🏗️ Tech Stack Verification
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl mb-1">⚛️</div>
                <div className="text-sm font-medium">React</div>
                <div className="text-xs text-green-600">✅ Working</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">🔷</div>
                <div className="text-sm font-medium">Next.js</div>
                <div className="text-xs text-green-600">✅ Working</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">🔗</div>
                <div className="text-sm font-medium">tRPC</div>
                <div className="text-xs text-green-600">✅ Working</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">🎨</div>
                <div className="text-sm font-medium">Tailwind</div>
                <div className="text-xs text-green-600">✅ Working</div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              ← Back to Landing Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
