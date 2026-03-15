"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Logo } from "@/components/logo";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { User } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => 
    firestore && firebaseUser ? doc(firestore, 'users', firebaseUser.uid) : null
  , [firestore, firebaseUser]);
  
  const { data: userProfile, isLoading: profileLoading } = useDoc<User>(userDocRef);

  const loading = authLoading || profileLoading;

  useEffect(() => {
    if (loading) return; // Wait for auth and profile to load

    if (!firebaseUser) {
      router.push("/library-login"); // Not authenticated, go to login
      return;
    }
    
    // Authenticated, check role
    if (userProfile && userProfile.role !== "admin") {
      router.push("/student"); // Authenticated but not an admin, go to student page
    }

    // If user is an admin, do nothing and render children.
  }, [firebaseUser, userProfile, loading, router]);
  
  if (loading || !firebaseUser || !userProfile || userProfile.role !== "admin") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verifying administrator access...</span>
          </div>
        </div>
      </div>
    );
  }

  // If we've passed the checks, the user is an admin, so render the layout.
  return (
    <div>
      <SidebarProvider>
        <AppSidebar userProfile={userProfile} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </div>
  );
}
