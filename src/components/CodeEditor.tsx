import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { detectSecrets, redactSecrets } from "../utils/secretDetector";
import { supabase } from "../lib/supabase";
import { nanoid } from "nanoid";
import type { DetectedSecret } from "../types";

interface CodeEditorProps {
  onShare: (code: string, redactedCode: string, shareUrl: string) => void;
}

export function CodeEditor({ onShare }: CodeEditorProps) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [secrets, setSecrets] = useState<DetectedSecret[]>([]);
  const [isSharing, setIsSharing] = useState(false);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    const detectedSecrets = detectSecrets(newCode);
    setSecrets(detectedSecrets);
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const redactedCode = redactSecrets(code, secrets);
      const shareId = nanoid(10);

      const { error } = await supabase.from("code_snippets").insert({
        share_id: shareId,
        original_content: code,
        redacted_content: redactedCode,
        title: title || "Untitled Snippet",
        language,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // expires 7 days from now
      });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      // Generating URL
      const shareUrl = `${window.location.origin}/share/${shareId}`;
      onShare(code, redactedCode, shareUrl);
    } catch (error) {
      console.error("Error sharing code:", error);
      alert("Failed to share code. Please try again.");
    } finally {
      setIsSharing(false);
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
          disabled={isSharing || !code.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSharing ? "Sharing..." : "Share Securely"}
        </button>
      </div>
    </div>
  );
}
