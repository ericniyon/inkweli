"use client";

import React, { useState } from "react";
import { getPendingRegistration } from "@/components/RegisterView";

export interface PlanForPayment {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
}

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanForPayment | null;
  /** Called when payment is completed successfully. Parent should create account and/or update tier and redirect. */
  onPaymentSuccess: () => Promise<void>;
  /** Optional: when provided, use these instead of pending registration data */
  payerNameOverride?: string;
  payerEmailOverride?: string;
}

const PENDING_REF_KEY = "inkwell_pending_payment_reference";
const PENDING_PLAN_KEY = "inkwell_pending_plan_id";

export function setPendingPaymentRef(ref: string, planId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_REF_KEY, ref);
  sessionStorage.setItem(PENDING_PLAN_KEY, planId);
}

export function clearPendingPaymentRef() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_REF_KEY);
  sessionStorage.removeItem(PENDING_PLAN_KEY);
}

export function getPendingPaymentRef(): { reference: string; planId: string } | null {
  if (typeof window === "undefined") return null;
  const ref = sessionStorage.getItem(PENDING_REF_KEY);
  const planId = sessionStorage.getItem(PENDING_PLAN_KEY);
  if (ref && planId) return { reference: ref, planId };
  return null;
}

type Channel = "MOMO" | "AIRTEL_MONEY" | "CARD";

export default function PaymentDialog({
  isOpen,
  onClose,
  plan,
  onPaymentSuccess,
  payerNameOverride,
  payerEmailOverride,
}: PaymentDialogProps) {
  const [channel, setChannel] = useState<Channel>("MOMO");
  const [phoneNumber, setPhoneNumber] = useState(
    () => (typeof process !== "undefined" && process.env.NEXT_PUBLIC_URUBUTOPAY_TEST_PHONE) || ""
  );
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitingConfirmation, setWaitingConfirmation] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const pending = getPendingRegistration();
  const payerName = payerNameOverride ?? pending?.name ?? "";
  const payerEmail = payerEmailOverride ?? pending?.email ?? "";

  const pollStatus = async (ref: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/urubutopay/transaction?reference=${encodeURIComponent(ref)}`);
      const data = await res.json().catch(() => ({}));
      return data.status ?? null;
    } catch {
      return null;
    }
  };

  const handlePay = async () => {
    if (!plan) return;
    setError(null);
    setProcessing(true);

    const phone = phoneNumber.trim().replace(/\s/g, "");
    if (!phone) {
      setError("Phone number is required");
      setProcessing(false);
      return;
    }

    try {
      const appUrl = typeof window !== "undefined" ? window.location.origin : "";
      const returnUrl = `${appUrl}/membership/success`;

      const res = await fetch("/api/urubutopay/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          channelName: channel,
          phoneNumber: phone,
          payerName: payerName || "Customer",
          payerEmail: payerEmail || undefined,
          returnUrl,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Payment could not be started. Please try again.");
        setProcessing(false);
        return;
      }

      const ref = data.transactionId;
      if (!ref) {
        setError("Invalid response from payment server.");
        setProcessing(false);
        return;
      }

      setPendingPaymentRef(ref, plan.id);
      setTransactionId(ref);

      if (data.cardProcessingUrl) {
        window.location.href = data.cardProcessingUrl;
        return;
      }

      setWaitingConfirmation(true);
      setProcessing(false);

      const maxAttempts = 60;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const status = await pollStatus(ref);
        if (status === "VALID") {
          clearPendingPaymentRef();
          await onPaymentSuccess();
          onClose();
          return;
        }
        if (status === "FAILED" || status === "CANCELED") {
          setError("Payment was not completed. Please try again.");
          setWaitingConfirmation(false);
          return;
        }
      }

      setError("Confirmation is taking longer than expected. Check your phone or try again later.");
      setWaitingConfirmation(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed. Please try again.");
      setProcessing(false);
      setWaitingConfirmation(false);
    }
  };

  if (!isOpen) return null;

  const amountLabel =
    plan?.interval === "year"
      ? "RWF / year"
      : plan?.interval === "article"
        ? "RWF / article"
        : "RWF";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="absolute inset-0"
        aria-hidden
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Complete payment
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {plan && (
            <>
              <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100">
                <p className="text-sm font-bold text-slate-900">{plan.name}</p>
                <p className="text-2xl font-black text-slate-900 mt-2">
                  {new Intl.NumberFormat("en-RW").format(plan.price)}{" "}
                  <span className="text-sm font-bold text-slate-500">{amountLabel}</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.slice(0, 3).map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {!waitingConfirmation ? (
                <>
                  <p className="text-sm font-medium text-slate-700 mb-2">Payment method</p>
                  <div className="flex gap-2 mb-4">
                    {(["MOMO", "AIRTEL_MONEY", "CARD"] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setChannel(c)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
                          channel === c
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {c === "MOMO" ? "MTN MoMo" : c === "AIRTEL_MONEY" ? "Airtel Money" : "Card"}
                      </button>
                    ))}
                  </div>

                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0781234567"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent mb-4"
                  />
                </>
              ) : (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-sm font-bold text-amber-800">Confirm on your phone</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Dial <span className="font-mono font-bold">182*7*1#</span> or use the UrubutoPay app to approve the payment.
                  </p>
                  {transactionId && (
                    <p className="text-xs text-slate-500 mt-2">Ref: {transactionId}</p>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-500 mb-4">
                By completing payment, your account will be created and you will get access according to your chosen package.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={processing}
                  className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                {!waitingConfirmation && (
                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={processing}
                    className="flex-1 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing…
                      </>
                    ) : (
                      <>Pay {new Intl.NumberFormat("en-RW").format(plan.price)} RWF</>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
