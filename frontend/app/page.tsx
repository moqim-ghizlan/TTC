"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validateKey = (value: string): boolean => {
    if (value.length < 2 || value.length > 20) {
      setError("Key must be 2-20 characters");
      return false;
    }
    if (!/^[a-zA-Z0-9]+$/.test(value)) {
      setError("Key can only contain letters and numbers");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    if (!validateKey(key)) return;

    setLoading(true);
    try {
      const response = await fetch("/api/key/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await response.json();
      if (data.valid) {
        router.push(`/${key}`);
      } else {
        setError(data.error || "Invalid key");
      }
    } catch {
      setError("Failed to validate key");
    } finally {
      setLoading(false);
    }
  };

  const generateKey = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/key/generate");
      const data = await response.json();
      if (data.key) {
        setKey(data.key);
      } else {
        setError("Failed to generate key");
      }
    } catch {
      setError("Failed to generate key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-32 items-center bg-background text-foreground relative overflow-hidden font-display transition-colors duration-300">
        <div className="absolute inset-0 bg-grid-pattern opacity-50 pointer-events-none z-0"></div>

        <div className="relative z-10 w-full max-w-lg p-4">
            <div className="bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl p-8 md:p-12 backdrop-blur-sm bg-opacity-95 flex flex-col gap-10">

                <div className="flex flex-col items-center text-center gap-3">
                    <div className="h-16 w-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-2 shadow-lg shadow-primary/25 overflow-hidden border border-white/10">
                         <img src="/icon.png" alt="TTC Logo" className="w-12 h-12 object-contain" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                        Welcome to TTC
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg font-normal leading-relaxed max-w-sm">
                        Instant real-time anonymous code sharing.
                    </p>
                </div>

                <div className="w-full flex flex-col gap-6">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                        <div className="relative flex items-center group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-slate-400 text-[24px]">key</span>
                            </div>
                            <input
                                autoFocus
                                type="text"
                                value={key}
                                onChange={(e) => {
                                    setKey(e.target.value);
                                    if (error) validateKey(e.target.value);
                                }}
                                placeholder="enter-session-key"
                                className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-black/50 text-foreground pl-12 pr-4 py-5 shadow-inner focus:border-primary focus:ring-primary focus:ring-1 text-lg md:text-xl font-mono placeholder:text-slate-400 transition-all text-center tracking-wider outline-none"
                                disabled={loading}
                            />
                        </div>
                        {error ? (
                             <p className="text-center text-xs text-red-500 font-mono">{error}</p>
                        ) : (
                            <p className="text-center text-xs text-slate-400 font-mono">2-20 alphanumeric characters</p>
                        )}
                    </form>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={generateKey}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/40 transform active:scale-[0.99] cursor-pointer"
                        >
                            <span className="material-symbols-outlined">shuffle</span>
                            <span>Generate Random Key</span>
                        </button>

                        <button
                            onClick={handleSubmit}
                            disabled={loading || !key.trim()}
                            className="w-full flex items-center justify-center gap-2 bg-transparent border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold py-3 px-6 rounded-lg transition-colors group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">code</span>
                            <span>Start Sharing</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 opacity-50">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Systems Operational</span>
            </div>
        </div>
    </div>
  );
}
