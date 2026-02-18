"use client";

import { useRouter } from "next/navigation";
import ForgotPasswordView from "@/components/ForgotPasswordView";

export default function ForgotPasswordPage() {
  const router = useRouter();
  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-6 py-12 animate-fade-up">
      <ForgotPasswordView onBackToLogin={() => router.push("/login")} />
    </div>
  );
}
