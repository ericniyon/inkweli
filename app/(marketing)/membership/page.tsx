"use client";

import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { SUBSCRIPTION_PLANS, PENDING_PLAN_STORAGE_KEY, type SubscriptionPlanConfig } from "@/constants";
import MembershipView from "@/components/MembershipView";
import PaymentDialog, { type PlanForPayment } from "@/components/PaymentDialog";
import PaymentStatusTracker from "@/components/PaymentStatusTracker";

function MembershipPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser, isGuest, hydrated } = useAuth();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanForPayment | null>(null);
  const [mode, setMode] = useState<"register" | "upgrade" | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlanConfig[]>(SUBSCRIPTION_PLANS);
  const autoOpenedRef = useRef<string | null>(null);

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

  const refreshUserFromSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.id && data?.email && data?.name) {
        setUser(data);
      }
    } catch {
      // ignore
    }
  }, [setUser]);

  const upgradeAfterPayment = useCallback(async () => {
    await refreshUserFromSession();
    router.push("/dashboard");
  }, [refreshUserFromSession, router]);

  const completeRegistrationAfterPayment = useCallback(async () => {
    await refreshUserFromSession();
    router.push("/dashboard");
  }, [refreshUserFromSession, router]);

  const handleGetStarted = useCallback(
    (planId?: string) => {
      if (!planId) {
        router.push(isGuest ? "/login" : "/dashboard");
        return;
      }

      const planCfg = plans.find((p) => p.id === planId);
      if (!planCfg) return;

      if (planCfg.id === "plan_per_article") {
        router.push(isGuest ? `/login?callbackUrl=${encodeURIComponent("/")}` : "/");
        return;
      }

      if (isGuest) {
        try {
          localStorage.setItem(PENDING_PLAN_STORAGE_KEY, planId);
        } catch {
          // ignore
        }
        const dest = `/membership?plan=${encodeURIComponent(planId)}`;
        router.push(`/login?callbackUrl=${encodeURIComponent(dest)}`);
        return;
      }

      const asPlan: PlanForPayment = {
        id: planCfg.id,
        name: planCfg.name,
        price: planCfg.price,
        currency: planCfg.currency,
        interval: planCfg.interval,
        features: planCfg.features,
      };
      setSelectedPlan(asPlan);
      setMode("upgrade");
      setPaymentDialogOpen(true);
    },
    [isGuest, plans, router]
  );

  useEffect(() => {
    if (!hydrated || isGuest || plans.length === 0) return;
    const pid = searchParams.get("plan")?.trim();
    if (!pid) return;

    try {
      localStorage.removeItem(PENDING_PLAN_STORAGE_KEY);
    } catch {
      // ignore
    }

    const planCfg = plans.find((p) => p.id === pid);
    if (!planCfg) {
      router.replace("/membership", { scroll: false });
      autoOpenedRef.current = null;
      return;
    }

    if (pid === "plan_per_article") {
      router.replace("/membership", { scroll: false });
      autoOpenedRef.current = null;
      return;
    }

    if (autoOpenedRef.current === pid) return;
    autoOpenedRef.current = pid;

    const asPlan: PlanForPayment = {
      id: planCfg.id,
      name: planCfg.name,
      price: planCfg.price,
      currency: planCfg.currency,
      interval: planCfg.interval,
      features: planCfg.features,
    };
    setSelectedPlan(asPlan);
    setMode("upgrade");
    setPaymentDialogOpen(true);
  }, [hydrated, isGuest, plans, router, searchParams]);

  const handlePaymentComplete = useCallback(async (status: any) => {
    // Refresh user data to get updated tier
    await refreshUserFromSession();
    
    // If payment was successful, redirect to dashboard
    if (status.isSuccess) {
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
  }, [refreshUserFromSession, router]);

  const onPaymentSuccess = mode === "upgrade" ? upgradeAfterPayment : completeRegistrationAfterPayment;

  return (
    <div className="min-h-[calc(100vh-140px)] animate-fade-up">
      <MembershipView
        onGetStarted={handleGetStarted}
        hasPendingRegistration={false}
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
        onPaymentSuccess={onPaymentSuccess}
        payerNameOverride={!isGuest ? user.name : undefined}
        payerEmailOverride={!isGuest ? user.email : undefined}
        authenticatedCheckout={mode === "upgrade"}
        checkoutUserId={!isGuest && user.id !== "guest" ? user.id : null}
      />
      <PaymentStatusTracker
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
}

export default function MembershipPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-6">
          <div className="text-slate-500 font-charter text-sm">Loading…</div>
        </div>
      }
    >
      <MembershipPageInner />
    </Suspense>
  );
}
