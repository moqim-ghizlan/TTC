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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-8 p-8 bg-white dark:bg-black rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
          Welcome to TTC
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-center">
          Share your code with friends and co-workers
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xs">
          <input
            type="text"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              if (error) validateKey(e.target.value);
            }}
            placeholder="Enter a key (2-20 chars, letters/numbers)"
            className="p-3 border border-zinc-300 dark:border-zinc-700 rounded bg-zinc-50 dark:bg-zinc-900 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !key.trim()}
            className="p-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-zinc-400 transition-colors"
          >
            {loading ? "Loading..." : "Start Sharing"}
          </button>
        </form>

        <button
          onClick={generateKey}
          disabled={loading}
          className="text-blue-600 dark:text-blue-400 hover:underline disabled:text-zinc-400"
        >
          Generate a random key
        </button>
      </main>
    </div>
  );
}
