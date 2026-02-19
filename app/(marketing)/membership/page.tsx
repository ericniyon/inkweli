"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { SUBSCRIPTION_PLANS } from "@/constants";
import MembershipView from "@/components/MembershipView";
import PaymentDialog, { type PlanForPayment } from "@/components/PaymentDialog";
import {
  getPendingRegistration,
  clearPendingRegistration,
} from "@/components/RegisterView";

export default function MembershipPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanForPayment | null>(null);

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

  const handleGetStarted = (planId?: string) => {
    const pending = getPendingRegistration();
    if (pending && planId) {
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
      if (plan) {
        setSelectedPlan({
          id: plan.id,
          name: plan.name,
          price: plan.price,
          currency: plan.currency,
          interval: plan.interval,
          features: plan.features,
        });
        setPaymentDialogOpen(true);
      }
      return;
    }
    router.push("/register");
  };

  return (
    <div className="min-h-[calc(100vh-140px)] animate-fade-up">
      <MembershipView onGetStarted={handleGetStarted} />
      <PaymentDialog
        isOpen={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        onPaymentSuccess={completeRegistrationAfterPayment}
      />
    </div>
  );
}
