"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useAuth } from "@/lib/auth-context";

function VerifyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const token = searchParams.get("token")?.trim() ?? "";
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    if (!token) {
      setMessage("This sign-in link is invalid or incomplete.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const signed = await signIn("credentials", {
          magicLinkToken: token,
          redirect: false,
        });
        if (cancelled) return;
        if (signed?.error) {
          setMessage("This sign-in link has expired or was already used. Request a new one from the login page.");
          return;
        }
        const me = await fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null));
        if (!me?.id) {
          setMessage("Could not load your profile. Try signing in again.");
          return;
        }
        const planId =
          typeof window !== "undefined" ? localStorage.getItem("pending_plan_id")?.trim() : "";
        const callbackUrlRaw = searchParams.get("callbackUrl")?.trim() ?? "";

        const userPayload = me as Parameters<typeof setUser>[0];
        setUser(userPayload);

        if (planId) {
          localStorage.removeItem("pending_plan_id");
          router.replace(`/membership?plan=${encodeURIComponent(planId)}`);
          return;
        }
        if (
          callbackUrlRaw &&
          callbackUrlRaw.startsWith("/") &&
          !callbackUrlRaw.startsWith("//")
        ) {
          router.replace(callbackUrlRaw);
          return;
        }

        router.replace(me.role === "ADMIN" ? "/admin" : "/dashboard");
      } catch {
        if (!cancelled) setMessage("Something went wrong. Please try again from the login page.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router, setUser, searchParams]);

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-6 py-12 animate-fade-up">
      <p className="font-charter text-slate-600 text-center max-w-md">{message}</p>
      {!token && (
        <a href="/login" className="mt-6 text-indigo-600 font-bold hover:underline text-sm">
          Back to sign in
        </a>
      )}
    </div>
  );
}

export default function LoginVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-6">
          <div className="text-slate-500 font-charter text-sm">Loading…</div>
        </div>
      }
    >
      <VerifyInner />
    </Suspense>
  );
}
