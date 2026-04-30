"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  getPendingRegistration,
  clearPendingRegistration,
} from "@/components/RegisterView";
import {
  getPendingPaymentRef,
  clearPendingPaymentRef,
} from "@/components/PaymentDialog";

async function waitUntil(
  predicate: () => boolean,
  timeoutMs: number,
  cancelled: () => boolean
): Promise<boolean> {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (cancelled()) return false;
    if (predicate()) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return predicate();
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser, isGuest, hydrated } = useAuth();
  const guestRef = useRef(isGuest);
  const hydratedRef = useRef(hydrated);

  useEffect(() => {
    guestRef.current = isGuest;
  }, [isGuest]);

  useEffect(() => {
    hydratedRef.current = hydrated;
  }, [hydrated]);

  const reference =
    searchParams.get("reference") ?? searchParams.get("transaction_id") ?? null;

  const [status, setStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(!!reference);
  const postValidDone = useRef(false);

  useEffect(() => {
    if (!reference) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const runAfterValidated = async () => {
      if (postValidDone.current || cancelled) return;
      postValidDone.current = true;

      const pending = getPendingRegistration();
      const pendingPayment = getPendingPaymentRef();

      if (pending && pendingPayment && pendingPayment.reference === reference) {
        try {
          const regRes = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: pending.name,
              email: pending.email,
              password: pending.password,
              planId: pendingPayment.planId,
            }),
          });
          const userData = await regRes.json().catch(() => ({}));
          if (regRes.ok && userData.id) {
            clearPendingRegistration();
            clearPendingPaymentRef();
            setUser(userData);
            router.push("/dashboard");
            return;
          }
        } catch {
          postValidDone.current = false;
        }
      }

      const ready = await waitUntil(
        () => hydratedRef.current,
        12000,
        () => cancelled
      );
      if (cancelled || !ready) return;

      if (guestRef.current) {
        router.replace(`/register?paymentRef=${encodeURIComponent(reference)}`);
        return;
      }

      try {
        const claimRes = await fetch("/api/urubutopay/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ paymentReference: reference }),
        });
        const userData = await claimRes.json().catch(() => ({}));
        if (claimRes.ok && userData.id) {
          setUser(userData);
        }
      } catch {
        // non-fatal
      }
    };

    const poll = async () => {
      try {
        const [txRes, subRes] = await Promise.all([
          fetch(`/api/urubutopay/transaction?reference=${encodeURIComponent(reference)}`),
          fetch(`/api/subscriptions/status?reference=${encodeURIComponent(reference)}`),
        ]);
        const data = await txRes.json().catch(() => ({}));
        const subData = await subRes.json().catch(() => ({}));
        if (cancelled) return;
        const s = data.status ?? null;
        const subStatus =
          typeof subData.subscription_status === "string"
            ? subData.subscription_status
            : "";
        const label =
          subStatus === "PENDING"
            ? `${s ?? "…"} / subscription: processing`
            : subStatus === "ACTIVE"
              ? `${s ?? "VALID"}`
              : s;
        setStatus(label);

        if (s === "VALID") {
          if (intervalId) clearInterval(intervalId);
          setChecking(false);
          await runAfterValidated();
          return;
        }

        if (s === "FAILED" || s === "CANCELED" || subStatus === "FAILED") {
          if (intervalId) clearInterval(intervalId);
          setChecking(false);
        }
      } catch {
        if (!cancelled) setChecking(false);
      }
    };

    void poll();
    intervalId = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [reference, router, setUser]);

  const showGuestRedirect =
    !checking && !!reference && hydrated && status === "VALID" && isGuest;

  return (
    <div className="min-h-[calc(100vh-140px)] animate-fade-in bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="font-charter text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">
          Thank you for your payment
        </h1>
        <p className="font-charter text-slate-600 text-base mb-6">
          {checking
            ? "Confirming your payment…"
            : showGuestRedirect
              ? "Next: create your account so we can link this payment."
              : "We have received your payment. Your access updates once the payment is linked to your account."}
        </p>
        {reference && (
          <p className="text-sm text-slate-400 mb-8">
            Reference: <span className="font-mono break-all">{reference}</span>
            {status && (
              <span className="ml-2 text-slate-500">({status})</span>
            )}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center py-3 px-5 rounded-xl bg-slate-900 text-white font-charter font-bold text-sm hover:bg-slate-800 transition"
          >
            Go to dashboard
          </Link>
          <Link
            href="/membership"
            className="inline-flex items-center justify-center py-3 px-5 rounded-xl border border-slate-200 text-slate-700 font-charter font-bold text-sm hover:bg-slate-50 transition"
          >
            Back to membership
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MembershipSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4">
        <div className="text-slate-500 font-charter">Loading…</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
