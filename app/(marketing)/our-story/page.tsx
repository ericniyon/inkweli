"use client";

import { useRouter } from "next/navigation";
import OurStoryView from "@/components/OurStoryView";

export default function OurStoryPage() {
  const router = useRouter();
  return (
    <div className="min-h-[calc(100vh-140px)] animate-fade-up">
      <OurStoryView onGetStarted={() => router.push("/register")} />
    </div>
  );
}
