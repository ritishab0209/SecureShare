import React, { useState } from "react";
import { Shield } from "lucide-react";
import { CodeEditor } from "./components/CodeEditor";

function App() {
  const [sharedCode, setSharedCode] = useState<{
    original: string;
    redacted: string;
  } | null>(null);

  const handleShare = (original: string, redacted: string) => {
    setSharedCode({ original, redacted });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">SecureShare</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Share Code Snippets Securely
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Automatically detect and redact sensitive information before sharing
          </p>
        </div>

        {!sharedCode ? (
          <CodeEditor onShare={handleShare} />
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Shared Code (Redacted Version)
              </h3>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                <code>{sharedCode.redacted}</code>
              </pre>
            </div>

            <div className="text-center">
              <button
                onClick={() => setSharedCode(null)}
                className="px-4 py-2 text-blue-600 hover:text-blue-700"
              >
                Share Another Snippet
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
