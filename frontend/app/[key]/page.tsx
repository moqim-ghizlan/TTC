"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";

export default function SharedPage() {
  const params = useParams();
  const key = params.key as string;
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const lastTypedAt = useRef<number>(0);
  const contentRef = useRef<string>("");

  // Keep ref in sync for interval
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const saveContent = useCallback(async (newContent: string) => {
    setSaving(true);
    setSaved(false);
    try {
      const response = await fetch(`/api/code/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
      if (response.ok) {
        setSaved(true);
        // setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  }, [key]);

  // Initial Fetch
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/code/${key}`);
        if (response.ok) {
          const data = await response.json();
          const serverContent = data.content || "";
          setContent(serverContent);
          contentRef.current = serverContent;
        }
      } catch {
        setError("Failed to load content");
      }
    };
    fetchContent();
  }, [key]);

  // Polling Logic
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      // Don't pull if user has typed recently (prevent overwriting active work)
      if (Date.now() - lastTypedAt.current < 2000) return;

      try {
        const response = await fetch(`/api/code/${key}`);
        if (response.ok) {
          const data = await response.json();
          const serverContent = data.content || "";

          if (serverContent !== contentRef.current) {
            setContent(serverContent);
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [key]);

  // Auto-save debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only save if we strictly have content and it WAS typed recently (avoid saving stale state on load)
      if (Date.now() - lastTypedAt.current < 1500 && Date.now() - lastTypedAt.current > 100) {
         saveContent(content);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [content, saveContent]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    lastTypedAt.current = Date.now();
    setContent(e.target.value);
    setSaved(false);
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground font-display overflow-hidden relative transition-colors duration-300">
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none z-0"></div>

      <header className="relative z-10 flex items-center justify-between px-6 py-4 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-white text-xl">terminal</span>
            </div>
            <div>
                 <h1 className="text-xl font-bold tracking-tight">
                    TTC
                </h1>
                <p className="text-xs text-slate-500 font-mono">
                    Session: <span className="text-primary font-bold">{key}</span>
                </p>
            </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-slate-800">
              {saving ? (
                <>
                    <span className="material-symbols-outlined text-primary text-sm animate-spin">sync</span>
                    <span className="text-xs font-mono text-slate-500">Syncing...</span>
                </>
              ) : saved ? (
                <>
                    <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                    <span className="text-xs font-mono text-slate-500">Saved</span>
                </>
              ) : error ? (
                 <span className="text-xs font-mono text-red-500">{error}</span>
              ) : (
                <>
                    <span className="material-symbols-outlined text-slate-400 text-sm">cloud_queue</span>
                    <span className="text-xs font-mono text-slate-500">Ready</span>
                </>
              )}
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 p-4 md:p-6 flex flex-col">
        <div className="flex-1 w-full max-w-5xl mx-auto bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col">
            <div className="h-8 bg-slate-50 dark:bg-[#0d1218] border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <textarea
            autoFocus
            value={content}
            onChange={handleChange}
            className="flex-1 w-full p-6 font-mono text-sm md:text-base bg-surface-light dark:bg-surface-dark text-foreground focus:outline-none resize-none leading-relaxed"
            placeholder="// Start typing your code here..."
            spellCheck={false}
            />
        </div>
      </main>

      <div className="fixed bottom-4 right-4 z-20">
          <button
            onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                // nice to have toast here
            }}
            className="group flex items-center gap-2 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            title="Copy URL"
          >
             <span className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors">link</span>
          </button>
      </div>
    </div>
  );
}
