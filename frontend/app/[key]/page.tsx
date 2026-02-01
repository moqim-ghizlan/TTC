"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";

export default function SharedPage() {
  const params = useParams();
  const key = params.key as string;
  const [content, setContent] = useState("");
  const [lineCount, setLineCount] = useState(1);
  const [copying, setCopying] = useState(false);

  // Ref for polling management
  const lastTypedAt = useRef<number>(0);
  const contentRef = useRef<string>("");

  // Keep ref in sync for interval
  useEffect(() => {
    contentRef.current = content;
    setLineCount(content.split("\n").length);
  }, [content]);

  // Save Function (Backend)
  const saveContent = useCallback(async (newContent: string) => {
    try {
      await fetch(`/api/code/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
    } catch (err) {
      console.error("Failed to save", err);
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
        console.error("Failed to load initial content");
      }
    };
    fetchContent();
  }, [key]);

  // 100ms Polling Logic
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      // Don't pull if user has typed in the last 2 seconds (prevent overwriting active work)
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
    }, 100); // 0.1s Polling

    return () => clearInterval(pollInterval);
  }, [key]);

  // Auto-save debounce (0.5s for faster save feeling)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only save if we strictly have content and it WAS typed recently
      if (Date.now() - lastTypedAt.current < 1500 && Date.now() - lastTypedAt.current > 100) {
         saveContent(content);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [content, saveContent]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    lastTypedAt.current = Date.now();
    setContent(e.target.value);
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(window.location.href);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
  };

  return (
    <div className="flex h-screen flex-col bg-[#101922] text-[#abb2bf] font-mono overflow-hidden">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-[#283039] bg-[#1c2127] px-4 py-2 z-10 h-14">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-white">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg overflow-hidden">
                        <img src="/logo.png?v=3" alt="TTC Logo" className="w-6 h-6 object-contain" />
                    </div>
                </div>

                {/* URL Bar */}
                <div className="hidden md:flex items-center bg-[#101922] rounded-md border border-[#283039] h-9 overflow-hidden group focus-within:border-[#3b4754] transition-colors max-w-md">
                    <div className="flex items-center px-3 border-r border-[#283039] bg-[#151b23] h-full text-[#4d5b6b]">
                        <span className="material-symbols-outlined text-sm">lock</span>
                    </div>
                    <div className="px-3 text-sm text-[#4d5b6b] truncate">
                        <span className="text-white select-all">{key}</span>
                    </div>
                    <button
                        onClick={copyToClipboard}
                        className="flex items-center justify-center px-3 h-full hover:bg-[#283039] border-l border-[#283039] text-[#4d5b6b] hover:text-white transition-colors cursor-pointer"
                        title="Copy URL"
                    >
                         <span className="material-symbols-outlined text-sm">
                             {copying ? "check" : "content_copy"}
                         </span>
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#151b23]/50 border border-[#283039]">
                    <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6c7d8f]">Live Sync 0.1s</span>
                 </div>
            </div>
        </header>

        {/* Main Editor Area */}
        <main className="flex-1 flex overflow-hidden relative">
            {/* Sidebar Line Numbers */}
            <div className="w-12 md:w-16 flex-shrink-0 bg-[#151b23] border-r border-[#283039] flex flex-col items-end py-4 pr-3 md:pr-4 text-[#4d5b6b] text-sm leading-7 select-none overflow-hidden">
                {Array.from({ length: Math.max(lineCount, 25) }).map((_, i) => (
                    <div key={i} className="font-mono">{i + 1}</div>
                ))}
            </div>

            {/* Editing Area */}
            <div className="flex-1 relative bg-[#101922]">
                <textarea
                    autoFocus
                    value={content}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                        if (e.key === "Tab") {
                            e.preventDefault();
                            const target = e.target as HTMLTextAreaElement;
                            const start = target.selectionStart;
                            const end = target.selectionEnd;
                            const newValue = content.substring(0, start) + "    " + content.substring(end);

                            setContent(newValue);
                            lastTypedAt.current = Date.now();

                            // Move cursor after the inserted spaces (setTimeout needed for React state update)
                            requestAnimationFrame(() => {
                                target.selectionStart = target.selectionEnd = start + 4;
                            });
                        }

                        const pairs: Record<string, string> = {
                            "(": ")",
                            "{": "}",
                            "[": "]",
                            '"': '"',
                            "'": "'",
                            "`": "`",
                        };

                        if (pairs[e.key]) {
                            e.preventDefault();
                            const target = e.target as HTMLTextAreaElement;
                            const start = target.selectionStart;
                            const end = target.selectionEnd;
                            const closing = pairs[e.key];
                            const newValue = content.substring(0, start) + e.key + closing + content.substring(end);

                            setContent(newValue);
                            lastTypedAt.current = Date.now();

                            requestAnimationFrame(() => {
                                target.selectionStart = target.selectionEnd = start + 1;
                            });
                        }
                    }}
                    className="w-full h-full p-4 bg-transparent border-none text-gray-300 resize-none focus:ring-0 focus:outline-none font-mono text-sm leading-7 custom-scrollbar"
                    spellCheck="false"
                    placeholder="// Start typing..."
                    style={{ lineHeight: '1.75rem' }}
                />
            </div>
        </main>

        {/* Footer */}
        <footer className="h-8 bg-[#151b23] border-t border-[#283039] flex items-center justify-between px-4 text-xs text-[#9dabb9] select-none">
             <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors">
                     <span className="material-symbols-outlined text-sm">code_blocks</span>
                     <span>JavaScript</span>
                 </div>
                 <div className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors">
                     <span className="material-symbols-outlined text-sm">check_circle</span>
                     <span>Prettier</span>
                 </div>
             </div>

             <div className="flex items-center gap-4">
                 <span>Ln {content.split('\n').length}, Col {content.length}</span>
                 <div className="flex items-center gap-1">
                     <span className="material-symbols-outlined text-sm">group</span>
                     <span>1 User</span>
                 </div>
                 <div className="flex items-center gap-1 text-white">
                     <span>UTF-8</span>
                 </div>
             </div>
        </footer>

        <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar {
                width: 10px;
                height: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: #101922;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #283039;
                border-radius: 5px;
                border: 2px solid #101922;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #3b4754;
            }
        `}</style>
    </div>
  );
}
