"use client";

import React, { useState } from "react";
import { getPendingRegistration } from "@/components/RegisterView";
import PaymentSuccessDialog from "./PaymentSuccessDialog";

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
  /** After provider confirms success (webhook is source of truth). Parent refreshes session / UI. */
  onPaymentSuccess: () => Promise<void>;
  /** Optional: when provided, use these instead of pending registration data */
  payerNameOverride?: string;
  payerEmailOverride?: string;
  /** Logged-in upgrade: POST /api/payments/initiate then redirect to provider. */
  authenticatedCheckout?: boolean;
  /** Signed-in user id — required with authenticatedCheckout for `/api/payments/initiate`. */
  checkoutUserId?: string | null;
  /** When paying for `plan_per_article` from the reader, the story id to record on the purchase */
  checkoutArticleId?: string | null;
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

type CheckoutChannel = "MOMO" | "AIRTEL_MONEY" | "CARD";

export default function PaymentDialog({
  isOpen,
  onClose,
  plan,
  onPaymentSuccess,
  payerNameOverride,
  payerEmailOverride,
  authenticatedCheckout,
  checkoutUserId,
  checkoutArticleId,
}: PaymentDialogProps) {
  const [channel, setChannel] = useState<CheckoutChannel>("MOMO");
  const [phoneNumber, setPhoneNumber] = useState(
    () => (typeof process !== "undefined" && process.env.NEXT_PUBLIC_URUBUTOPAY_TEST_PHONE) || ""
  );
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccessDialog, setPaymentSuccessDialog] = useState<{
    isOpen: boolean;
    reference: string;
  }>({ isOpen: false, reference: "" });

  const pending = getPendingRegistration();
  const payerName = payerNameOverride ?? pending?.name ?? "";
  const payerEmail = payerEmailOverride ?? pending?.email ?? "";
  const walletChannel = channel === "MOMO" || channel === "AIRTEL_MONEY";

  const handlePay = async () => {
    if (!plan) return;
    setError(null);
    setProcessing(true);

    const phone = phoneNumber.trim().replace(/\s/g, "");
    if (!phone) {
      setError("Phone number is required (used for billing and wallet flows).");
      setProcessing(false);
      return;
    }

    try {
      const appUrl = typeof window !== "undefined" ? window.location.origin : "";

      const initiateApiUrl = appUrl
        ? `${appUrl}/api/payments/initiate`
        : "/api/payments/initiate";

      if (authenticatedCheckout && !checkoutUserId) {
        setError("Sign in is required to complete this payment.");
        setProcessing(false);
        return;
      }

      const articleRef =
        typeof checkoutArticleId === "string" ? checkoutArticleId.trim() : "";
      if (plan.id === "plan_per_article" && articleRef.length === 0) {
        setError(
          "Per-article payment must start from inside an article so it can be linked to that story.",
        );
        setProcessing(false);
        return;
      }
      const perArticleCheckout = plan.id === "plan_per_article";

      const initiateBody =
        authenticatedCheckout && checkoutUserId
          ? {
              plan_id: plan.id,
              amount: plan.price,
              user_id: checkoutUserId,
              email: payerEmail || "",
              name: payerName || "Customer",
              phone: phone || "",
              channelName: channel,
              ...(perArticleCheckout ? { article_id: articleRef } : {}),
            }
          : {
              plan_id: plan.id,
              amount: plan.price,
              user_id: checkoutUserId ?? "",
              email: payerEmail || "",
              name: payerName || "Customer",
              phone: phone || "",
              channelName: channel,
              ...(perArticleCheckout ? { article_id: articleRef } : {}),
            };

      const res = await fetch(initiateApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(initiateBody),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        try {
          localStorage.setItem("pending_plan_id", plan.id);
        } catch {
          // ignore
        }
        setError(
          authenticatedCheckout
            ? "Your session expired. Please sign in again to continue checkout."
            : "Please sign in to pay for a membership plan."
        );
        setProcessing(false);
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Payment could not be started. Please try again.");
        setProcessing(false);
        return;
      }

      const payUrl =
        typeof data.payment_url === "string" && data.payment_url.trim()
          ? data.payment_url.trim()
          : null;
      const ref =
        typeof data.payment_reference === "string" && data.payment_reference.trim()
          ? data.payment_reference.trim()
          : null;
      
      if (payUrl) {
        if (ref) setPendingPaymentRef(ref, plan.id);
        window.location.href = payUrl;
        return;
      }

      // For wallet payments (MOMO/AIRTEL_MONEY), no redirect URL means payment was initiated
      // User should complete payment on their phone
      if (channel === "MOMO" || channel === "AIRTEL_MONEY") {
        const referenceText = ref ?? "";
        if (referenceText) setPendingPaymentRef(referenceText, plan.id);
        setProcessing(false);
        // Close payment sheet first, then show success — PaymentSuccessDialog must stay mounted
        // after isOpen goes false (see render guard below).
        onClose();
        setPaymentSuccessDialog({ isOpen: true, reference: referenceText });
        return;
      }

      setError("Invalid response from payment server.");
      setProcessing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  if (!isOpen && !paymentSuccessDialog.isOpen) return null;

  const amountLabel =
    plan?.interval === "year"
      ? "RWF / year"
      : plan?.interval === "article"
        ? "RWF / article"
        : "RWF";

  return (
    <>
      <PaymentSuccessDialog
        key={
          paymentSuccessDialog.isOpen && paymentSuccessDialog.reference.trim()
            ? paymentSuccessDialog.reference.trim()
            : "payment-success-closed"
        }
        isOpen={paymentSuccessDialog.isOpen}
        onClose={() => setPaymentSuccessDialog({ isOpen: false, reference: "" })}
        reference={paymentSuccessDialog.reference}
        onSettled={(outcome) => {
          if (outcome === "success") void onPaymentSuccess();
        }}
      />

      {isOpen ? (
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
                    {c === "MOMO" ? "MoMo" : c === "AIRTEL_MONEY" ? "Airtel" : "Card"}
                  </button>
                ))}
              </div>

              <p className="text-sm text-slate-600 mb-4">
                {channel === "CARD"
                  ? "You’ll complete checkout on UrubutoPay’s hosted card page—we’ll send you back here when you’re done."
                  : channel === "AIRTEL_MONEY"
                    ? "You'll finish Airtel Money on the UrubutoPay page we open next. Use the billing phone below."
                    : "You'll finish MTN MoMo on the UrubutoPay page we open next. Use the billing phone below."}
              </p>

              <label className="block text-sm font-medium text-slate-700 mb-1">
                Billing phone{" "}
                <span className="text-red-500">*</span>
                {walletChannel ? (
                  <span className="text-slate-400 font-normal"> (charges this wallet)</span>
                ) : null}
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0781234567"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent mb-4"
              />

              <p className="text-xs text-slate-500 mb-4">
                After UrubutoPay confirms payment, your access follows the webhook — you can return via the link they provide once payment completes.
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
      ) : null}
    </>
  );
}
