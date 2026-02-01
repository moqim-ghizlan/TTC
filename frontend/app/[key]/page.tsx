"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { rust } from '@codemirror/lang-rust';
import { php } from '@codemirror/lang-php';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { markdown } from '@codemirror/lang-markdown';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';

export default function SharedPage() {
  const params = useParams();
  const key = params.key as string;
  const [content, setContent] = useState("");
  const [lineCount, setLineCount] = useState(1);
  const [copying, setCopying] = useState(false);
  const [copyingCode, setCopyingCode] = useState(false);
  const [language, setLanguage] = useState("Plain Text");
  const [lastUpdate, setLastUpdate] = useState<string>("Never");

  // Ref for polling management
  const lastTypedAt = useRef<number>(0);
  const contentRef = useRef<string>("");
  // const prismRef = useRef<any>(null); // Removed Prism-related ref
  // const [prismLoaded, setPrismLoaded] = useState(false); // Removed Prism-related state

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
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('ttc-language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/code/${key}`);
        if (response.ok) {
          const data = await response.json();
          const serverContent = data.content || "";
          setContent(serverContent);
          contentRef.current = serverContent;

          // Set last update from server
          if (data.updatedAt) {
            const date = new Date(data.updatedAt);
            const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            setLastUpdate(timeStr);
          }
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

          // Update last modified time from server
          if (data.updatedAt) {
            const date = new Date(data.updatedAt);
            const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            setLastUpdate(timeStr);
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

    // Update last modified time
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setLastUpdate(timeStr);
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(window.location.href);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
  };

  const copyCodeToClipboard = () => {
      navigator.clipboard.writeText(content);
      setCopyingCode(true);
      setTimeout(() => setCopyingCode(false), 2000);
  };

  // Get CodeMirror language extension based on detected language
  const getCodeMirrorExtension = (lang: string) => {
    switch (lang) {
      case "JavaScript":
      case "TypeScript":
        return javascript({ typescript: lang === "TypeScript" });
      case "Python":
        return python();
      case "Java":
        return java();
      case "C++":
        return cpp();
      case "Rust":
        return rust();
      case "PHP":
        return php();
      case "HTML":
        return html();
      case "CSS":
        return css();
      case "JSON":
        return json();
      case "Markdown":
        return markdown();
      default:
        return [];
    }
  };

  // Auto-detect language based on content
  const detectLanguage = (code: string): string => {
    if (!code || code.length < 10) return 'Plain Text'; // Default to Plain Text if too short

    const lowerCode = code.toLowerCase();
    const firstLine = code.split('\n')[0].toLowerCase();

    // Python patterns
    if (/\bdef\s+\w+\s*\(|import\s+\w+|from\s+\w+\s+import|class\s+\w+:|print\s*\(|__name__/.test(code)) {
      return 'Python';
    }

    // TypeScript patterns (check before JavaScript)
    if (/:\s*(string|number|boolean|any|void|interface|type\s+\w+\s*=)|<\w+>|\bas\s+\w+/.test(code)) {
      return 'TypeScript';
    }

    // JavaScript patterns
    if (/\b(const|let|var|function|=>|console\.log|require\(|export\s+(default|const)|async\s+function)\b/.test(code)) {
      return 'JavaScript';
    }

    // Java patterns
    if (/\bpublic\s+(class|static|void)|System\.out\.println|private\s+\w+\s+\w+|extends\s+\w+|implements\s+\w+/.test(code)) {
      return 'Java';
    }

    // C++ patterns
    if (/#include\s*<|std::|cout\s*<<|cin\s*>>|namespace\s+\w+|int\s+main\s*\(/.test(code)) {
      return 'C++';
    }

    // Go patterns
    if (/^package\s+\w+|func\s+\w+\s*\(|import\s+\(|fmt\.Print/.test(code)) {
      return 'Go';
    }

    // Rust patterns
    if (/\bfn\s+\w+|let\s+mut\s+|println!|impl\s+\w+|use\s+std::/.test(code)) {
      return 'Rust';
    }

    // PHP patterns
    if (/^<\?php|<\?=|\$\w+\s*=|function\s+\w+\s*\(.*\)\s*{|echo\s+/.test(code)) {
      return 'PHP';
    }

    // Ruby patterns
    if (/\bdef\s+\w+|puts\s+|require\s+['"]|end\b|attr_accessor/.test(code)) {
      return 'Ruby';
    }

    // HTML patterns
    if (firstLine.includes('<!doctype') || /^<html|<head>|<body>|<div|<script>/.test(lowerCode.trim())) {
      return 'HTML';
    }

    // CSS patterns
    if (/\{[\s\S]*:[^:]+;[\s\S]*\}|@media|@import|\.[\w-]+\s*\{/.test(code)) {
      return 'CSS';
    }

    // JSON patterns
    if (/^\s*\{[\s\S]*"[\w-]+"[\s\S]*:/.test(code) || /^\s*\[[\s\S]*\{/.test(code)) {
      return 'JSON';
    }

    // Markdown patterns
    if (/^#{1,6}\s+|^\*\*|^-\s+|\[.*\]\(.*\)|^```/.test(code)) {
      return 'Markdown';
    }

    return 'Plain Text'; // Default to Plain Text if no match
  };

  // Auto-detect language when content changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.length > 20) {
        const detected = detectLanguage(content);
        if (detected !== language) {
          setLanguage(detected);
          localStorage.setItem('ttc-language', detected);
        }
      }
    }, 1000); // Wait 1s after typing stops

    return () => clearTimeout(timer);
  }, [content]);

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

                {/* Copy Code Button */}
                <button
                    onClick={copyCodeToClipboard}
                    className="hidden md:flex items-center gap-2 px-4 h-9 rounded-md bg-[#101922] border border-[#283039] hover:bg-[#283039] hover:border-[#3b4754] text-[#4d5b6b] hover:text-white transition-colors cursor-pointer"
                    title="Copy Code"
                >
                    <span className="material-symbols-outlined text-sm">
                        {copyingCode ? "check" : "code"}
                    </span>
                    <span className="text-xs font-medium">Copy Code</span>
                </button>
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
            <div className="flex-1 relative bg-[#101922] overflow-hidden">
                <CodeMirror
                    value={content}
                    height="100%"
                    theme={oneDark}
                    extensions={[getCodeMirrorExtension(language)]}
                    onChange={(value) => {
                        lastTypedAt.current = Date.now();
                        setContent(value);

                        // Update last modified time
                        const now = new Date();
                        const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                        setLastUpdate(timeStr);
                    }}
                    basicSetup={{
                        lineNumbers: false, // We have custom line numbers
                        foldGutter: false,
                        highlightActiveLineGutter: false,
                    }}
                    style={{
                        fontSize: '14px',
                        height: '100%',
                    }}
                />
            </div>
        </main>

        {/* Footer */}
        <footer className="h-8 bg-[#151b23] border-t border-[#283039] flex items-center justify-between px-4 text-xs text-[#9dabb9] select-none">
             <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1">
                     <span className="material-symbols-outlined text-sm">code_blocks</span>
                     <span>{language}</span>
                 </div>
             </div>

             <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1">
                     <span className="material-symbols-outlined text-sm">schedule</span>
                     <span>{lastUpdate}</span>
                 </div>
                 <span>Ln {content.split('\n').length}, Col {content.length}</span>
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
