"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-light/35 border-t-primary" />
    </div>
  );
}
