"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import RegisterView from "@/components/RegisterView";
import { PENDING_PLAN_STORAGE_KEY } from "@/constants";

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const paymentRef = searchParams.get("paymentRef")?.trim() ?? undefined;

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-6 py-12 animate-fade-up">
      <RegisterView
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
          router.push("/dashboard");
        }}
        onLogin={() =>
          router.push(
            paymentRef ? `/login?paymentRef=${encodeURIComponent(paymentRef)}` : "/login"
          )
        }
        forcedPaymentReference={paymentRef}
      />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-6">
          <div className="text-slate-500 font-charter text-sm">Loading…</div>
        </div>
      }
    >
      <RegisterPageInner />
    </Suspense>
  );
}
