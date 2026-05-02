"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import RegisterView from "@/components/RegisterView";
import { PENDING_PLAN_STORAGE_KEY } from "@/constants";

function normalizeInternalPath(input: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (typeof window !== "undefined" && parsed.origin !== window.location.origin) return null;
    const full = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    if (!full.startsWith("/") || full.startsWith("//")) return null;
    return full;
  } catch {
    return null;
  }
}

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const paymentRef = searchParams.get("paymentRef")?.trim() ?? undefined;
  const callbackUrlParam = normalizeInternalPath(searchParams.get("callbackUrl"));

  const loginHref =
    paymentRef && callbackUrlParam
      ? `/login?paymentRef=${encodeURIComponent(paymentRef)}&callbackUrl=${encodeURIComponent(callbackUrlParam)}`
      : paymentRef
        ? `/login?paymentRef=${encodeURIComponent(paymentRef)}`
        : callbackUrlParam
          ? `/login?callbackUrl=${encodeURIComponent(callbackUrlParam)}`
          : "/login";

  const oauthCallbackUrl = callbackUrlParam ?? "/dashboard";

  return (
    <div className="w-full flex-1 flex flex-col items-stretch justify-center px-4 sm:px-6 lg:px-10 py-8 lg:py-12 animate-fade-up min-h-[calc(100vh-140px)]">
      <RegisterView
        showOAuth={!paymentRef}
        oauthCallbackUrl={oauthCallbackUrl}
        onRegister={(user) => {
          setUser(user);
          try {
            const pendingPlan =
              typeof window !== "undefined"
                ? localStorage.getItem(PENDING_PLAN_STORAGE_KEY)?.trim()
                : "";
            if (pendingPlan) {
              localStorage.removeItem(PENDING_PLAN_STORAGE_KEY);
              router.push(`/membership?plan=${encodeURIComponent(pendingPlan)}`);
              return;
            }
          } catch {
            // ignore
          }
          if (callbackUrlParam) {
            router.push(callbackUrlParam);
            return;
          }
          router.push("/dashboard");
        }}
        onLogin={() => router.push(loginHref)}
        forcedPaymentReference={paymentRef}
      />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4">
          <div className="w-10 h-10 border-2 border-stone-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterPageInner />
    </Suspense>
  );
}
