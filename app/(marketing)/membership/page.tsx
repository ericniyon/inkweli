"use client";

import { useRouter } from "next/navigation";
import MembershipView from "@/components/MembershipView";

export default function MembershipPage() {
  const router = useRouter();
  return (
    <div className="min-h-[calc(100vh-140px)] animate-fade-up">
      <MembershipView onGetStarted={() => router.push("/register")} />
    </div>
  );
}
