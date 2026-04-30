"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import LoginView from "@/components/LoginView";
import { PENDING_PLAN_STORAGE_KEY } from "@/constants";

const ERROR_MESSAGE = "Sign-in failed. Please try again.";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  const paymentRefRaw = searchParams.get("paymentRef")?.trim() ?? "";

  const returnTo = searchParams.get("returnTo");
  const callbackUrlParam = searchParams.get("callbackUrl");
  const defaultPath =
    paymentRefRaw
      ? `/membership/success?reference=${encodeURIComponent(paymentRefRaw)}`
      : returnTo &&
          typeof returnTo === "string" &&
          returnTo.startsWith("/") &&
          !returnTo.includes("//")
        ? returnTo
        : callbackUrlParam &&
            typeof callbackUrlParam === "string" &&
            callbackUrlParam.startsWith("/") &&
            !callbackUrlParam.includes("//")
          ? callbackUrlParam
          : "/dashboard";

  const errorCode = searchParams.get("error");
  const initialError = errorCode ? ERROR_MESSAGE : null;

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-6 py-12 animate-fade-up">
      <LoginView
        initialError={initialError}
        onLogin={(user) => {
          setUser(user);
          if (user.role === "ADMIN") {
            router.push("/admin");
            return;
          }
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
          router.push(defaultPath);
        }}
        onRegister={() =>
          router.push(
            paymentRefRaw ? `/register?paymentRef=${encodeURIComponent(paymentRefRaw)}` : "/register"
          )
        }
        onForgotPassword={() => router.push("/forgot-password")}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-140px)] flex items-center justify-center"><div className="w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
