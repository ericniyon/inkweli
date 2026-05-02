"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

type SettlementPhase =
  | "waiting"
  | "success"
  | "failed"
  | "timeout"
  | "error";

interface PaymentSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reference: string;
  /** Terminal outcomes: parent may refresh membership on `success`. */
  onSettled?: (outcome: "success" | "failed" | "timeout" | "error") => void;
}

function statusLooksSuccess(status: string): boolean {
  const s = status.trim().toUpperCase();
  return ["SUCCESS", "COMPLETED", "VALID"].includes(s);
}

function statusLooksFailure(status: string): boolean {
  const s = status.trim().toUpperCase();
  return ["FAILED", "CANCELED", "REVERSED"].includes(s);
}

function messageForStatus(status: string): string {
  const s = status.trim().toUpperCase();
  switch (s) {
    case "SUCCESS":
    case "COMPLETED":
    case "VALID":
      return "Your payment completed successfully.";
    case "FAILED":
      return "Payment failed. You can try again or contact support with your reference.";
    case "CANCELED":
      return "Payment was canceled.";
    case "REVERSED":
      return "Payment was reversed.";
    default:
      return "";
  }
}

export default function PaymentSuccessDialog({
  isOpen,
  onClose,
  reference,
  onSettled,
}: PaymentSuccessDialogProps) {
  const [phase, setPhase] = useState<SettlementPhase>("waiting");
  const [detail, setDetail] = useState<string>(
    "Approve the prompt on your phone. This screen updates when UrubutuPay reports success, cancel, or failure.",
  );
  const [lastStatus, setLastStatus] = useState<string | null>(null);

  const notifiedRef = useRef(false);
  const phaseRef = useRef<SettlementPhase>("waiting");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const fireSettledOnce = useCallback(
    (outcome: "success" | "failed" | "timeout" | "error") => {
      if (notifiedRef.current) return;
      notifiedRef.current = true;
      onSettled?.(outcome);
    },
    [onSettled]
  );

  useEffect(() => {
    notifiedRef.current = false;

    if (!isOpen || !reference.trim()) {
      setPhase("waiting");
      phaseRef.current = "waiting";
      setDetail(
        "Approve the prompt on your phone. This screen updates when UrubutuPay reports success, cancel, or failure.",
      );
      setLastStatus(null);
      return;
    }

    setPhase("waiting");
    phaseRef.current = "waiting";
    setDetail(
      "Approve the prompt on your phone. This screen updates when UrubutuPay reports success, cancel, or failure.",
    );
    setLastStatus(null);

    let es: EventSource;

    try {
      es = new EventSource(
        `/api/payments/events?transactionId=${encodeURIComponent(reference.trim())}`
      );
    } catch {
      phaseRef.current = "error";
      setPhase("error");
      setDetail("Could not connect to payment status updates.");
      fireSettledOnce("error");
      return;
    }

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);

        switch (data.type) {
          case "status_update": {
            const st = typeof data.status === "string" ? data.status : "";
            setLastStatus(st);
            const msgFor = messageForStatus(st);
            if (statusLooksSuccess(st)) {
              phaseRef.current = "success";
              setPhase("success");
              setDetail(msgFor);
              fireSettledOnce("success");
            } else if (statusLooksFailure(st)) {
              phaseRef.current = "failed";
              setPhase("failed");
              setDetail(msgFor || `Status: ${st}`);
              fireSettledOnce("failed");
            } else {
              phaseRef.current = "waiting";
              setPhase("waiting");
              const u = st.trim().toUpperCase();
              const human =
                ["PENDING", "PROCESSING"].includes(u)
                  ? "Still processing…"
                  : "Waiting for your wallet or provider…";
              setDetail(`${human}${st ? ` (${st})` : ""}`);
            }
            break;
          }
          case "error":
            phaseRef.current = "error";
            setPhase("error");
            setDetail(
              typeof data.message === "string"
                ? data.message
                : "Something went wrong while checking payment status."
            );
            fireSettledOnce("error");
            es.close();
            break;
          case "timeout":
            phaseRef.current = "timeout";
            setPhase("timeout");
            setDetail(
              typeof data.message === "string"
                ? `${data.message} Use the reference below if you contact support or check again later in your account.`
                : "We couldn’t confirm the final outcome yet. If you approved on your phone, access may still update shortly."
            );
            fireSettledOnce("timeout");
            es.close();
            break;
          case "complete":
            es.close();
            break;
          default:
            break;
        }
      } catch {
        /* ignore malformed events */
      }
    };

    return () => {
      es.close();
    };
  }, [isOpen, reference, fireSettledOnce]);

  if (!isOpen) return null;

  const waiting = phase === "waiting";

  const ringClass =
    phase === "success"
      ? "bg-emerald-100"
      : phase === "timeout"
        ? "bg-amber-100"
        : phase === "failed" || phase === "error"
          ? "bg-red-100"
          : "bg-slate-100";

  const headline =
    waiting
      ? "Checking payment status"
      : phase === "success"
        ? "Payment successful!"
        : phase === "timeout"
          ? "No final status yet"
          : phase === "error"
            ? "Could not load status"
            : "Payment not completed";

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="absolute inset-0"
        aria-hidden={waiting ? "true" : undefined}
        onClick={waiting ? undefined : onClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="p-8">
          <div
            className={`flex items-center justify-center w-16 h-16 rounded-full mb-6 mx-auto ${ringClass}`}
          >
            {waiting ? (
              <div className="w-8 h-8 border-[3px] border-slate-300 border-t-slate-900 rounded-full animate-spin" />
            ) : phase === "success" ? (
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : phase === "timeout" ? (
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>

          <h2 className="text-xl font-black text-slate-900 text-center mb-4">
            {headline}
          </h2>

          <p className="text-slate-600 text-center mb-6 leading-relaxed">{detail}</p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
            <p className="text-sm font-medium text-slate-700 mb-1">Reference number</p>
            <p className="font-mono text-lg font-bold text-slate-900 break-all">{reference}</p>
            {waiting && lastStatus ? (
              <p className="text-xs text-slate-500 mt-2 font-medium">
                Latest status:{" "}
                <span className="font-mono text-slate-700">{lastStatus}</span>
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={waiting}
            className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {waiting ? "Waiting…" : "Got it, thanks!"}
          </button>
          {waiting ? (
            <p className="text-xs text-slate-400 text-center mt-3">
              We keep checking for up to 3 minutes. You can close this window after the result appears.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
