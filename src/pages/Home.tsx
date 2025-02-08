import React, { useState } from "react";
import { CodeEditor } from "../components/CodeEditor";

export function Home() {
  const [sharedCode, setSharedCode] = useState<{
    original: string;
    redacted: string;
    shareUrl?: string;
  } | null>(null);

  const handleShare = (
    original: string,
    redacted: string,
    shareUrl: string
  ) => {
    setSharedCode({ original, redacted, shareUrl });
  };

  return (
    <>
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
          {sharedCode.shareUrl && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-center gap-3">
              <input
                type="text"
                readOnly
                value={sharedCode.shareUrl}
                className="flex-1 bg-white px-3 py-2 rounded border border-blue-200 text-sm"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={() =>
                  navigator.clipboard.writeText(sharedCode.shareUrl!)
                }
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
          )}

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
    </>
  );
}
