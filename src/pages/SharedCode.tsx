import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { CodeSnippet } from "../types";
import { Clock, Code2 } from "lucide-react";

export function SharedCode() {
  const { shareId } = useParams<{ shareId: string }>();
  const [snippet, setSnippet] = useState<CodeSnippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSnippet() {
      try {
        const { data, error } = await supabase
          .from("code_snippets")
          .select("*")
          .eq("share_id", shareId)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Snippet not found");

        setSnippet({
          id: data.id,
          content: data.original_content,
          redactedContent: data.redacted_content,
          title: data.title,
          language: data.language,
          createdAt: new Date(data.created_at),
          expiresAt: new Date(data.expires_at),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load snippet");
      } finally {
        setLoading(false);
      }
    }

    if (shareId) {
      fetchSnippet();
    }
  }, [shareId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !snippet) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {error || "Snippet not found"}
        </h2>
        <p className="text-gray-600">
          The code snippet you're looking for might have expired or doesn't
          exist.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Code2 className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                {snippet.title || "Untitled Snippet"}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>
                Expires {new Date(snippet.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          {snippet.language && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {snippet.language}
              </span>
            </div>
          )}
        </div>
        <div className="p-6">
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
            <code>{snippet.redactedContent}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
