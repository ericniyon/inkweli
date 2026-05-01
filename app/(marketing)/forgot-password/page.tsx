"use client";

import { useRouter } from "next/navigation";
import ForgotPasswordView from "@/components/ForgotPasswordView";

export default function ForgotPasswordPage() {
  const router = useRouter();
  return (
    <div className="w-full flex-1 flex flex-col items-stretch justify-center px-4 sm:px-6 lg:px-10 py-8 lg:py-12 animate-fade-up min-h-[calc(100vh-140px)]">
      <ForgotPasswordView onBackToLogin={() => router.push("/login")} />
    </div>
  );
}
