"use client";

import { Button } from "@/components/ui/button";
import { ScanQrCode } from "lucide-react";
import { app } from "@/lib/firebase";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { FirebaseError } from "firebase/app";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useUser } from "@/context/UserContext";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";

export default function Login() {
  const router = useRouter();
  const { user, profile, loading } = useUser();
  const { handleSignOut } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user && profile?.approved) {
      router.push('/dashboard');
    }
  }, [user, profile, loading, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // If user is authenticated and approved, don't show login page
  if (user && profile?.approved) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // If user is authenticated but not approved, show pending approval message
  if (user && profile && !profile.approved) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Account Pending Approval</h2>
          <p className="text-gray-600 mb-6">
            Your account is awaiting admin approval. Please contact an administrator.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Signed in as: {user.email}
          </p>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: "user",
          approved: false,
          createdAt: serverTimestamp(),
        });
        toast("Your account is pending approval by the admin.");
        return;
      }

      const userData = userDocSnap.data();
      if (!userData.approved) {
        toast.error("Your account is pending admin approval.");
        return;
      }

      toast.success("Signed in successfully");
      router.push('/dashboard');
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/popup-closed-by-user":
            errorMessage = "Sign-in popup closed before completing sign in.";
            break;
          case "auth/cancelled-popup-request":
            errorMessage = "Sign-in request was cancelled.";
            break;
          case "auth/popup-blocked":
            errorMessage = "Sign-in popup was blocked by the browser.";
            break;
          case "auth/network-request-failed":
            errorMessage = "Network error, please check your connection and try again.";
            break;
          case "auth/account-exists-with-different-credential":
            errorMessage = "An account already exists with the same email but different sign-in credentials.";
            break;
          case "auth/unauthorized-domain":
            errorMessage = "The application is not authorized to run on this domain.";
            break;
          case "auth/operation-not-allowed":
            errorMessage = "Google sign-in is not enabled for this project.";
            break;
          default:
            errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
    }
  };

  return (
    <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm grid gap-4 justify-items-center">
        <Button variant="outline" type="button" onClick={handleGoogleSignIn}>
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 48 48"
            style={{ display: "block" }}
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            ></path>
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            ></path>
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            ></path>
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            ></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
          </svg>
          Continue with Google
        </Button>
        <Button>
          <ScanQrCode />
          Scan QR
        </Button>
      </div>
    </main>
  );
}
