"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { accountApiURL, type Account } from "@/lib/auth";

export default function AccountPage() {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [account, setAccount] = useState<Account | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${accountApiURL}/api/auth/me`, { credentials: "include" })
      .then(async (response) => {
        if (response.ok) {
          const data = (await response.json()) as Account;
          if (!cancelled) setAccount(data);
        } else if (response.status !== 401) {
          throw new Error("Unable to check your account right now.");
        }
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Unable to connect to Packster.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch(`${accountApiURL}/api/auth/${mode}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, email, password }),
      });
      const data = (await response.json()) as Account & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to complete your request.");
      }
      setAccount(data);
      setPassword("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to connect to Packster.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setError("");
    try {
      const response = await fetch(`${accountApiURL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Unable to sign out. Please try again.");
      setAccount(null);
      setMode("login");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to connect to Packster.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-300 to-purple-200 px-4 py-12 font-sans">
      <section className="w-full max-w-md rounded-3xl bg-white/95 p-8 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">Packster account</p>
        {isLoading ? (
          <p className="mt-6 text-slate-600">Checking account...</p>
        ) : account ? (
          <>
            <h1 className="mt-2 text-2xl font-bold text-slate-800">You&apos;re signed in</h1>
            <p className="mt-4 text-slate-700">{account.displayName}</p>
            <p className="text-sm text-slate-500">{account.email}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 w-full rounded-2xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-600"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <h1 className="mt-2 text-2xl font-bold text-slate-800">
              {mode === "register" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              This is optional. You can continue creating and joining rooms without an account.
            </p>

            <div className="mt-6 flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => { setMode("register"); setError(""); }}
                aria-pressed={mode === "register"}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${mode === "register" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"}`}
              >
                Create account
              </button>
              <button
                type="button"
                onClick={() => { setMode("login"); setError(""); }}
                aria-pressed={mode === "login"}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${mode === "login" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"}`}
              >
                Sign in
              </button>
            </div>

            <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
              {mode === "register" && (
                <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                  Display name
                  <input
                    required
                    maxLength={60}
                    autoComplete="name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                  />
                </label>
              )}
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                Email
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                Password
                <input
                  required
                  type="password"
                  minLength={12}
                  maxLength={72}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                />
                {mode === "register" && <span className="text-xs font-normal text-slate-500">Use at least 12 characters.</span>}
              </label>
              {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-2xl bg-pink-500 px-5 py-3 font-semibold text-white transition hover:bg-pink-600 disabled:cursor-wait disabled:opacity-60"
              >
                {isSubmitting ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"}
              </button>
            </form>
          </>
        )}
        {error && account && <p role="alert" className="mt-4 text-sm font-medium text-rose-600">{error}</p>}
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:underline">
          Back to Packster
        </Link>
      </section>
    </main>
  );
}
