"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

export default function SharedPage() {
  const params = useParams();
  const key = params.key as string;
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const saveContent = useCallback(async (newContent: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/code/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  }, [key]);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/code/${key}`);
        if (response.ok) {
          const data = await response.json();
          setContent(data.content || "");
        } else {
          setError("Failed to load content");
        }
      } catch {
        setError("Failed to load content");
      }
    };
    fetchContent();
  }, [key]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (content) {
        saveContent(content);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [content, saveContent]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setSaved(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-bold text-black dark:text-zinc-50">
          TTC - {key}
        </h1>
        <div className="flex items-center gap-4">
          {saving && <span className="text-zinc-500">Saving...</span>}
          {saved && !saving && <span className="text-green-500">Saved</span>}
          {error && <span className="text-red-500">{error}</span>}
        </div>
      </header>
      <main className="flex-1 p-4">
        <textarea
          value={content}
          onChange={handleChange}
          className="w-full h-[calc(100vh-120px)] p-4 font-mono text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Start typing your code here..."
        />
      </main>
    </div>
  );
}
