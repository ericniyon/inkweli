"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import RegisterView from "@/components/RegisterView";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuth();

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-6 py-12 animate-fade-up">
      <RegisterView
        onRegister={(user) => {
          setUser(user);
          router.push("/dashboard");
        }}
        onLogin={() => router.push("/login")}
      />
    </div>
  );
}
