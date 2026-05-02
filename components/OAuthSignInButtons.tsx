"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

type Props = {
  callbackUrl: string;
  className?: string;
  /** Social buttons first; divider invites email/password below. */
  variant?: "primary" | "secondary";
};

export default function OAuthSignInButtons({
  callbackUrl,
  className,
  variant = "primary",
}: Props) {
  const [providers, setProviders] = useState<string[]>([]);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data === "object") {
          setProviders(Object.keys(data as Record<string, unknown>));
        }
      })
      .catch(() => {});
  }, []);

  const hasGoogle = providers.includes("google");
  const hasApple = providers.includes("apple");
  if (!hasGoogle && !hasApple) return null;

  const baseBtn =
    "w-full flex items-center justify-center gap-2 rounded-2xl border border-stone-200/90 bg-white py-[0.9rem] text-medium-meta font-black text-slate-800 hover:bg-stone-50 hover:border-stone-300 transition-colors shadow-sm shadow-stone-200/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-55 disabled:pointer-events-none";

  return (
    <div className={className}>
      {variant === "secondary" && (
        <div className="relative flex items-center justify-center mb-6">
          <span className="relative z-[1] px-3 bg-[#FDFCFB] text-medium-small font-bold uppercase tracking-wider text-slate-400">
            Or continue with
          </span>
          <div className="absolute inset-x-0 top-1/2 h-px bg-stone-200/90" aria-hidden />
        </div>
      )}
      <div className="space-y-3">
        {hasGoogle && (
          <button
            type="button"
            disabled={pending !== null}
            className={baseBtn}
            onClick={() => {
              setPending("google");
              void signIn("google", { callbackUrl });
            }}
          >
            {pending === "google" ? (
              <Loader2 className="w-[18px] h-[18px] animate-spin shrink-0" aria-hidden />
            ) : (
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </button>
        )}
        {hasApple && (
          <button
            type="button"
            disabled={pending !== null}
            className={`${baseBtn} bg-black text-white border-black hover:bg-zinc-900 hover:border-zinc-900`}
            onClick={() => {
              setPending("apple");
              void signIn("apple", { callbackUrl });
            }}
          >
            {pending === "apple" ? (
              <Loader2 className="w-[18px] h-[18px] animate-spin shrink-0 text-white" aria-hidden />
            ) : (
              <svg className="w-[18px] h-[18px] shrink-0 text-white" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="currentColor"
                  d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                />
              </svg>
            )}
            Continue with Apple
          </button>
        )}
      </div>
      {variant === "primary" && (
        <div className="relative flex items-center justify-center mt-8">
          <span className="relative z-[1] px-3 bg-[#FDFCFB] text-medium-small font-bold uppercase tracking-wider text-slate-400">
            Or use email and password
          </span>
          <div className="absolute inset-x-0 top-1/2 h-px bg-stone-200/90" aria-hidden />
        </div>
      )}
    </div>
  );
}
