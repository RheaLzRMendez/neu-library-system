"use client";

import { useUser, useAuth as useFirebaseAuth, useFirestore } from '@/firebase';
import { signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';

export function useAuth() {
  const { user: firebaseUser, isUserLoading: loading, userError } = useUser();
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const signInWithGoogle = async (role: 'user' | 'admin' = 'user') => {
    const provider = new GoogleAuthProvider();
    
    // If signing in as a student, restrict to the institutional domain.
    if (role === 'user') {
      provider.setCustomParameters({ hd: 'neu.edu.ph' });
    }

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const email = user.email;

      // Determine the final role. A specific email can be forced to be an admin.
      const finalRole = email === 'mendeziza@gmail.com' ? 'admin' : role;

      // If the intended role is admin, but a school email is used, reject.
      if (finalRole === 'admin' && email?.endsWith('@neu.edu.ph')) {
          await firebaseSignOut(auth);
          toast({
            variant: 'destructive',
            title: 'Invalid Admin Account',
            description: 'Please use a personal email account for admin sign-in.',
          });
          return;
      }

      // If the intended role is user, but a non-school email is used, reject.
      if (finalRole === 'user' && !email?.endsWith('@neu.edu.ph')) {
        await firebaseSignOut(auth);
        toast({
          variant: 'destructive',
          title: 'Invalid Student Account',
          description: 'Please use your institutional account (@neu.edu.ph).',
        });
        return;
      }
      
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      // Check if blocked
      if (userDocSnap.exists() && userDocSnap.data().isBlocked) {
        await firebaseSignOut(auth);
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'Your account has been blocked by an administrator.',
        });
        return;
      }

      // Check for role mismatch on existing user.
      if (userDocSnap.exists() && userDocSnap.data().role !== finalRole) {
        // If the user is the designated admin, automatically promote them to admin.
        if (email === 'mendeziza@gmail.com') {
          await setDoc(userDocRef, { role: 'admin' }, { merge: true });
        } else {
            await firebaseSignOut(auth);
            toast({
                variant: "destructive",
                title: "Role Mismatch",
                description: `You are trying to sign in as a ${role}, but your account is registered as a ${userDocSnap.data().role}. Please select the correct role.`,
            });
            return;
        }
      }
      
      // Create profile if it's a new user
      if (!userDocSnap.exists()) {
        const newUserProfile: Omit<User, 'id'> = {
          email: user.email!,
          displayName: user.displayName || 'New User',
          role: finalRole, // Assign the determined role
          isBlocked: false,
          collegeId: '',
          avatarUrl: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'N')}&background=random`,
        };
        await setDoc(userDocRef, newUserProfile);
      }

    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        toast({
            variant: "destructive",
            title: "Configuration Error",
            description: "Google Sign-In is not enabled for this project. Please contact the administrator.",
        });
      } else if (error.code !== 'auth/popup-closed-by-user') {
         console.error("Error signing in:", error.code, error.message);
         toast({
            variant: "destructive",
            title: "Login Failed",
            description: error.message || "An unexpected error occurred. Please try again.",
        });
      }
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };
  
  return { user: firebaseUser, loading, authError: userError, signInWithGoogle, logout };
}
