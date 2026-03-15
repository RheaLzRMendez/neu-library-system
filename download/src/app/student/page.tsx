"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useAuth as useAppAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { PURPOSES_OF_VISIT, COLLEGES } from "@/lib/placeholder-data";
import { Logo } from "@/components/logo";
import { CheckCircle2, Loader2, LogOut } from "lucide-react";
import { collection, doc } from "firebase/firestore";
import { addDocumentNonBlocking, useFirestore, setDocumentNonBlocking, useDoc, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import type { User as AppUser } from "@/lib/types";

export default function StudentPage() {
  const { user, logout, loading: authLoading } = useAppAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [purpose, setPurpose] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const colleges = COLLEGES;

  const { data: userProfile, isLoading: profileLoading } = useDoc<AppUser>(
    useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user])
  );

  const loading = authLoading || profileLoading;

  useEffect(() => {
    if (loading) return; // Wait until all data is loaded

    if (!user) {
        router.push('/library-login'); // Not logged in, go to login
        return;
    }

    // Logged in, check role
    if (userProfile?.role === 'admin') {
        router.push('/dashboard'); // Is an admin, go to admin dashboard
    }
    
  }, [user, userProfile, loading, router]);


  const collegeName = useMemo(() => {
    if (!collegeId || !colleges) return '';
    return colleges.find(c => c.id === collegeId)?.name || '';
  }, [collegeId, colleges]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose || !collegeId || !user || !firestore) {
      setError("Please fill out all fields.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    
    const userDocRef = doc(firestore, 'users', user.uid);
    const userToCreate = {
        id: user.uid,
        email: user.email!,
        displayName: user.displayName || 'New User',
        role: 'user',
        isBlocked: false,
        collegeId: collegeId, 
        avatarUrl: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'N')}&background=random`,
    };
    setDocumentNonBlocking(userDocRef, userToCreate, { merge: true });
    
    const visitsCollection = collection(firestore, 'visitLogs');
    const visitData = {
      userId: user.uid,
      timestamp: new Date().toISOString(),
      purposeOfVisit: purpose,
      collegeId: collegeId,
    };
    
    addDocumentNonBlocking(visitsCollection, visitData)
      .then((docRef) => {
        if (docRef) {
          setSubmitted(true);
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };
  
  const handleNewCheckin = () => {
    setSubmitted(false);
    setPurpose('');
    setCollegeId('');
    setError('');
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  const firstName = user.displayName?.split(" ")[0];

  return (
     <div className="relative min-h-screen w-full">
      <div className="absolute top-4 right-4 z-20 flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                <AvatarFallback>{getInitials(user.displayName || 'U')}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Image
        src="https://scontent.fmnl17-2.fna.fbcdn.net/v/t39.30808-6/491879299_1256153956518818_5794647859414315147_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeESJNNQubZ6vgtX8-tEo27_lMyhAylPeySUzKEDKU97JHIOtIg68uQMArXTLLHM7ImLh9NRfi1ZrAxJmhDvon_S&_nc_ohc=As6GoWgVKMsQ7kNvwFTXLnd&_nc_oc=AdlE5RYuDeoaXcXeyiRyw-U2vljkepmXS7PzWacaZbddn-I3GeJ1TEraNJTs0B7_3ck&_nc_zt=23&_nc_ht=scontent.fmnl17-2.fna&_nc_gid=DO1pcHoTsppfZhEEnDnXfw&_nc_ss=8&oh=00_Afz36ErFoovlr0lE0HFPlPQD4ttli6kmNa1N1DTe42D_pw&oe=69BADD3C"
        alt="NEU Library Interior"
        fill
        className="object-cover"
        data-ai-hint="library interior"
        priority
      />
      <div className="absolute inset-0 bg-primary/80" />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 md:flex-row md:justify-around md:items-center">
        <div className="hidden md:block text-center md:text-left">
            <h1 className="text-5xl font-bold text-white md:text-6xl">Hello!</h1>
            <p 
                className="font-serif text-7xl font-bold md:text-8xl"
                style={{ color: 'hsl(var(--chart-3))', textShadow: '1px 1px 4px rgba(0, 0, 0, 0.6)' }}
            >
                {firstName}
            </p>
        </div>
        <div className="w-full max-w-md animate-in slide-in-from-bottom-24 md:slide-in-from-right-24 duration-1000">
          {submitted ? (
            <Card className="bg-slate-900/60 text-white shadow-2xl backdrop-blur-md border border-white/20 w-full max-w-md">
              <CardHeader className="text-center items-center pb-4">
                <CheckCircle2 className="h-16 w-16 text-green-400 mb-4" />
                <CardTitle className="text-3xl font-bold tracking-tight text-white">
                  Welcome to NEU Library!
                </CardTitle>
                <CardDescription className="text-white/80">
                  Your check-in is complete. Enjoy your visit.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="border-t border-b border-white/20 py-6 my-4">
                    <p className="text-2xl font-semibold text-white">{user.displayName}</p>
                    <p className="text-lg text-chart-3">{collegeName}</p>
                </div>
                <div className="text-sm text-white/80">
                  <p className="font-semibold">Purpose of Visit:</p>
                  <p>{purpose}</p>
                </div>
              </CardContent>
              <CardFooter>
                   <Button onClick={handleNewCheckin} className="w-full text-white border-white/50 bg-transparent hover:bg-white/10 hover:text-white" variant="outline">
                      New Check-in
                   </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="bg-slate-900/60 text-white shadow-2xl backdrop-blur-md border border-white/20">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 scale-75">
                  <Logo />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-white">
                  Library Check-in
                </CardTitle>
                <CardDescription className="text-white/80 pt-2">
                  Please provide your visit details.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2 animate-in slide-in-from-bottom-5 duration-500 delay-300 fill-mode-backwards">
                    <Label htmlFor="purpose" className="text-white/90">Purpose of Visit</Label>
                    <Select value={purpose} onValueChange={setPurpose} required>
                      <SelectTrigger id="purpose" className="bg-transparent border-white/50 focus:bg-white/10 focus:border-white focus:ring-0 focus:ring-offset-0">
                        <SelectValue placeholder="Select a purpose" />
                      </SelectTrigger>
                      <SelectContent className="bg-card text-card-foreground">
                        {PURPOSES_OF_VISIT.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 animate-in slide-in-from-bottom-5 duration-500 delay-400 fill-mode-backwards">
                    <Label htmlFor="college" className="text-white/90">Your Department/College</Label>
                    <Select value={collegeId} onValueChange={setCollegeId} required>
                      <SelectTrigger id="college" className="bg-transparent border-white/50 focus:bg-white/10 focus:border-white focus:ring-0 focus:ring-offset-0">
                        <SelectValue placeholder="Select your college" />
                      </SelectTrigger>
                      <SelectContent className="bg-card text-card-foreground">
                        {colleges?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {error && <p className="text-sm text-destructive animate-in fade-in duration-500 delay-500 fill-mode-backwards">{error}</p>}
                </CardContent>
                <CardFooter className="animate-in slide-in-from-bottom-5 duration-500 delay-500 fill-mode-backwards">
                  <Button type="submit" disabled={isSubmitting} className="w-full bg-card text-primary hover:bg-accent active:bg-accent/90">
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Check In
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
