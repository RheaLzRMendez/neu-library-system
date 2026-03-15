"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { Loader2, Mail, MapPin, Phone } from "lucide-react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { User as AppUser } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Google Icon SVG
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title>Google</title>
    <path
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.854 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 0 5.56 0 12.48s5.867 12.48 12.48 12.48c7.04 0 12.093-4.72 12.093-12.093 0-.8-.08-1.52-.24-2.24H12.48z"
      fill="currentColor"
    />
  </svg>
);


export default function LibraryLoginPage() {
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const firestore = useFirestore();

  const { data: userProfile, isLoading: profileLoading } = useDoc<AppUser>(
    useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user])
  );

  const loading = authLoading || profileLoading;

  useEffect(() => {
    if (loading) return; // Wait until loading is false and we have user/profile info.

    if (user && userProfile) {
      if (userProfile.role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/student');
      }
    }
    // If no user, do nothing and stay on the login page.
  }, [user, userProfile, loading, router]);


  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle(role);
      // Redirection is now handled by the useEffect hook above.
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
        setIsSigningIn(false);
    }
  };
  
  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <Loader2 className="animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const buttonText = role === 'user' ? 'Sign in with Institutional ID' : 'Sign in as Administrator';

  return (
    <div className={`relative min-h-screen w-full`}>
      <Image
        src="https://scontent.fmnl17-6.fna.fbcdn.net/v/t39.30808-6/477579626_122108352272743934_80451274266931311_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=2a1932&_nc_eui2=AeFNet14I4oL9wkmyJZadaFBmfYDj1U4U5CZ9gOPVThTkPiQ5C3Fu13L1J3U2F8RtIRxAkQ3uGH8gKnvN0C1iGgN&_nc_ohc=d46thpZOUxAQ7kNvwFonD4w&_nc_oc=Adk7dv22XhNCpmVsEm7uonDFWbc6h9Uz5jBY11z_v6OPkwqmIeDvBLwtoqSIl_YmlK8&_nc_zt=23&_nc_ht=scontent.fmnl17-6.fna&_nc_gid=JtZK3RMGPBJkO_bmd-_mUw&_nc_ss=8&oh=00_Afzifd6UTzngU8QVl8KwtOeI-BO_Okm8eE0XCkP_P9Oijw&oe=69BAF5BC"
        alt="NEU Library"
        fill
        className="object-cover"
        data-ai-hint="library building"
        priority
      />
      <div className={cn(
        "absolute inset-0 transition-colors duration-500",
        role === 'user' ? "bg-primary/80" : "bg-[hsl(var(--chart-green))]/80"
      )} />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center text-white bg-slate-900/60 p-10 rounded-xl shadow-2xl backdrop-blur-md border border-white/20">
          <Logo />
          <div className="space-y-2">
              <h1 className="text-3xl font-serif font-bold tracking-tight" style={{color: 'hsl(var(--accent))'}}>
                  NEU Library
              </h1>
              <p className="text-white/80">
                  Track your library visits easily.
              </p>
          </div>
          
          <div className="space-y-3 text-center w-full">
            <Label className="text-white/90">Sign in as</Label>
            <RadioGroup
              value={role}
              onValueChange={(value) => setRole(value as 'user' | 'admin')}
              className="flex justify-center gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="user" id="role-user" className="text-white border-white/50" />
                <Label htmlFor="role-user" className="text-white font-normal cursor-pointer">Student</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="role-admin" className="text-white border-white/50" />
                <Label htmlFor="role-admin" className="text-white font-normal cursor-pointer">Admin</Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            onClick={handleGoogleLogin}
            disabled={isSigningIn}
            className="w-full bg-card text-primary hover:bg-accent hover:text-accent-foreground"
            size="lg"
          >
            {isSigningIn ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <>
                <GoogleIcon className="mr-2 h-5 w-5" />
                {buttonText}
              </>
            )}
          </Button>
          
          <div className="h-10 flex items-center justify-center">
            {role === 'user' ? (
              <p className="text-xs text-white/80 text-center">
                Please use your institutional account
                <br />
                (@neu.edu.ph)
              </p>
            ) : (
               <p className="text-xs text-white/80 text-center">
                Use a personal account for admin access.
              </p>
            )}
          </div>

        </div>
        
        <footer className="absolute bottom-0 w-full bg-gray-900/80 py-4 text-white">
            <div className="container mx-auto flex justify-center px-6 text-xs">
                <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 md:gap-x-8">
                    <a href="tel:+63289814221" className="contact-link flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>(632) 8981-4221</span>
                    </a>
                    <span className="hidden md:inline text-muted-foreground">|</span>
                    <a href="mailto:library@neu.edu.ph" className="contact-link flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>library@neu.edu.ph</span>
                    </a>
                    <span className="hidden md:inline text-muted-foreground">|</span>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>#9 Central Ave, New Era, Quezon City</span>
                    </div>
                </div>
            </div>
        </footer>

      </main>
    </div>
  );
}
