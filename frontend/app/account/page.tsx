"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { accountApiURL, type Account } from "@/lib/auth";

export default function AccountPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [returnTo, setReturnTo] = useState("/account");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const requestedReturnTo = query.get("returnTo");
    if (requestedReturnTo?.startsWith("/") && !requestedReturnTo.startsWith("//")) {
      setReturnTo(requestedReturnTo);
    }
    if (query.get("error") === "google_signin_unavailable") {
      setError("Google sign-in is not configured on the server yet.");
    } else if (query.get("error")) {
      setError("Google sign-in could not be completed. Please try again.");
    }

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

  const handleGoogleSignIn = () => {
    const query = new URLSearchParams({ returnTo });
    window.location.assign(`${accountApiURL}/api/auth/google?${query.toString()}`);
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
            <h1 className="mt-2 text-2xl font-bold text-slate-800">Sign in to take action</h1>
            <p className="mt-2 text-sm text-slate-600">
              Join a room and look around without an account. Your first Google sign-in creates your account so you can create rooms or change packing lists.
            </p>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="mt-6 w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Continue with Google
            </button>
          </>
        )}
        {error && <p role="alert" className="mt-4 text-sm font-medium text-rose-600">{error}</p>}
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:underline">
          Back to Packster
        </Link>
      </section>
    </main>
  );
}
