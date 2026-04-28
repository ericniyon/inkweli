"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { SUBSCRIPTION_PLANS, type SubscriptionPlanConfig } from "@/constants";
import MembershipView from "@/components/MembershipView";
import PaymentDialog, { type PlanForPayment } from "@/components/PaymentDialog";
import {
  getPendingRegistration,
  clearPendingRegistration,
} from "@/components/RegisterView";

export default function MembershipPage() {
  const router = useRouter();
  const { user, setUser, isGuest } = useAuth();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanForPayment | null>(null);
  const [mode, setMode] = useState<"register" | "upgrade" | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlanConfig[]>(SUBSCRIPTION_PLANS);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/subscription-plans")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!Array.isArray(data) || cancelled) return;
        const fallbackById = new Map(
          SUBSCRIPTION_PLANS.map((plan) => [plan.id, plan])
        );
        const normalizedFromDb = data
          .filter((item) => item && typeof item.id === "string")
          .map((item) => {
            const fallback = fallbackById.get(item.id);
            const features = Array.isArray(item.features)
              ? item.features
                  .map((f: unknown) => (typeof f === "string" ? f.trim() : ""))
                  .filter(Boolean)
              : [];
            return {
              id: item.id.trim(),
              tier:
                typeof item.tier === "string" && item.tier.trim()
                  ? item.tier.trim()
                  : fallback?.tier ?? "NONE",
              name:
                typeof item.name === "string" && item.name.trim()
                  ? item.name.trim()
                  : fallback?.name ?? "Package",
              price:
                typeof item.price === "number" && Number.isFinite(item.price)
                  ? item.price
                  : fallback?.price ?? 0,
              interval:
                typeof item.interval === "string" && item.interval.trim()
                  ? item.interval.trim()
                  : fallback?.interval ?? "article",
              features: features.length > 0 ? features : fallback?.features ?? [],
              color: fallback?.color ?? "slate",
              currency: "RWF" as const,
              paymentUrl: fallback?.paymentUrl ?? "#",
            } satisfies SubscriptionPlanConfig;
          });

        if (normalizedFromDb.length > 0) {
          setPlans(normalizedFromDb);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const completeRegistrationAfterPayment = useCallback(async () => {
    const pending = getPendingRegistration();
    if (!pending || !selectedPlan) throw new Error("Missing registration or plan.");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: pending.name,
        email: pending.email,
        password: pending.password,
        planId: selectedPlan.id,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Registration failed.");
    clearPendingRegistration();
    setUser(data);
    router.push("/dashboard");
  }, [selectedPlan, setUser, router]);

  const upgradeAfterPayment = useCallback(async () => {
    if (!selectedPlan) throw new Error("Missing plan.");
    const res = await fetch("/api/membership/upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: selectedPlan.id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Upgrade failed.");
    setUser(data);
    router.push("/dashboard");
  }, [selectedPlan, setUser, router]);

  const handleGetStarted = (planId?: string) => {
    const pending = getPendingRegistration();
    if (pending && planId) {
      const plan = plans.find((p) => p.id === planId);
      if (plan) {
        setSelectedPlan({
          id: plan.id,
          name: plan.name,
          price: plan.price,
          currency: plan.currency,
          interval: plan.interval,
          features: plan.features,
        });
        setMode("register");
        setPaymentDialogOpen(true);
      }
      return;
    }

    if (!planId) {
      if (isGuest) router.push("/register");
      else router.push("/dashboard");
      return;
    }

    // Logged-in user upgrading or renewing
    if (!isGuest) {
      const plan = plans.find((p) => p.id === planId);
      if (plan) {
        setSelectedPlan({
          id: plan.id,
          name: plan.name,
          price: plan.price,
          currency: plan.currency,
          interval: plan.interval,
          features: plan.features,
        });
        setMode("upgrade");
        setPaymentDialogOpen(true);
      }
      return;
    }

    // Not logged in and no pending registration: send to register flow
    router.push("/register");
  };

  const [hasPendingRegistration, setHasPendingRegistration] = useState(false);
  useEffect(() => {
    setHasPendingRegistration(!!getPendingRegistration());
  }, []);

  return (
    <div className="min-h-[calc(100vh-140px)] animate-fade-up">
      <MembershipView
        onGetStarted={handleGetStarted}
        hasPendingRegistration={hasPendingRegistration}
        currentTier={user.tier}
        isLoggedIn={!isGuest}
        plans={plans}
      />
      <PaymentDialog
        isOpen={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false);
          setSelectedPlan(null);
          setMode(null);
        }}
        plan={selectedPlan}
        onPaymentSuccess={mode === "upgrade" ? upgradeAfterPayment : completeRegistrationAfterPayment}
        payerNameOverride={!isGuest ? user.name : undefined}
        payerEmailOverride={!isGuest ? user.email : undefined}
      />
    </div>
  );
}
