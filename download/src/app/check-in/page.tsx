"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from "@/components/logo";
import { Loader2 } from "lucide-react";

/**
 * This page handles client-side redirection from the old "/check-in" route 
 * to the current "/student" route, ensuring smooth navigation for any
 * lingering links while removing code duplication.
 */
export default function CheckInRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/student');
  }, [router]);

  // Render a loading state while the redirection is in progress.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Logo />
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Redirecting...</span>
        </div>
      </div>
    </div>
  );
}
