"use client";

import { useEffect, useState } from "react";

export type Account = {
  id: string;
  displayName: string;
  email: string;
};

export const accountApiURL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");

export function useAccount() {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3000);
    let active = true;

    fetch(`${accountApiURL}/api/auth/me`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.ok && active) {
          setAccount((await response.json()) as Account);
        } else if (response.status !== 401) {
          throw new Error("Unable to check your account.");
        }
      })
      .catch(() => {
        if (active) setAccount(null);
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return { account, isLoading };
}
