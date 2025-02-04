import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { detectSecrets, redactSecrets } from "../utils/secretDetector";
import type { DetectedSecret } from "../types";

interface CodeEditorProps {
  onShare: (code: string, redactedCode: string) => void;
}

export function CodeEditor({ onShare }: CodeEditorProps) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [secrets, setSecrets] = useState<DetectedSecret[]>([]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    const detectedSecrets = detectSecrets(newCode);
    setSecrets(detectedSecrets);
  };

  const handleShare = async () => {
    const redactedCode = redactSecrets(code, secrets);

    try {
      const response = await fetch("http://127.0.0.1:8000/create_paste", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: redactedCode }),
      });

      if (!response.ok) {
        throw new Error("Failed to create paste");
      }

      const data = await response.json();
      alert(`Your secure link: ${data.link}`);
    } catch (error) {
      console.error("Error sharing code:", error);
      alert("Failed to share the code. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Snippet Title"
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="relative">
        <textarea
          value={code}
          onChange={handleCodeChange}
          placeholder="Paste your code here..."
          className="w-full h-96 p-4 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50"
        />

        {secrets.length > 0 && (
          <div className="absolute top-0 right-0 m-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 text-yellow-700 mb-2">
              <AlertTriangle size={20} />
              <span className="font-medium">Sensitive Data Detected</span>
            </div>
            <ul className="text-sm space-y-1">
              {secrets.map((secret, index) => (
                <li key={index} className="text-gray-600">
                  {secret.type} found on line {secret.line}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleShare}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Share Securely
        </button>
      </div>
    </div>
  );
}
