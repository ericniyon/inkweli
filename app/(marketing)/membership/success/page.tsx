"use client";

import { Suspense, useEffect, useState } from "react";
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

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser } = useAuth();
  const reference =
    searchParams.get("reference") ?? searchParams.get("transaction_id") ?? null;

  const [status, setStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(!!reference);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!reference || completed) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/urubutopay/transaction?reference=${encodeURIComponent(reference)}`
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        const s = data.status ?? null;
        setStatus(s);

        if (s === "VALID") {
          setCompleted(true);
          setChecking(false);

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
              // continue to show success UI
            }
          }
        }

        if (s === "FAILED" || s === "CANCELED") {
          setChecking(false);
          return;
        }
      } catch {
        if (!cancelled) setChecking(false);
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [reference, completed, setUser, router]);

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
            : "We have received your payment. Your access will be updated shortly. If you have an account, log in to see your benefits."}
        </p>
        {reference && (
          <p className="text-sm text-slate-400 mb-8">
            Reference: <span className="font-mono">{reference}</span>
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
