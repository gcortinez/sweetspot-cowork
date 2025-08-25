"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import dynamic from "next/dynamic";

// Lazy load the heavy home content component
const HomeContent = dynamic(
  () => import("@/components/home/home-content").then(mod => ({ default: mod.HomeContent })),
  { 
    loading: () => (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando página de inicio...</p>
        </div>
      </div>
    ),
    ssr: false // Only load on client to reduce initial bundle
  }
);

export default function HomePage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  console.log('🏠 HomePage: Auth state', { isSignedIn, isLoaded });

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      console.log('🔄 Redirecting authenticated user to dashboard');
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading while checking auth
  if (!isLoaded) {
    console.log('🏠 HomePage: Showing loading (auth not loaded)');
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando autenticación...</p>
        </div>
      </div>
    );
  }

  // Show redirecting for authenticated users
  if (isSignedIn) {
    console.log('🏠 HomePage: Showing redirect (user signed in)');
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo al dashboard...</p>
        </div>
      </div>
    );
  }

  console.log('🏠 HomePage: Showing landing page');
  return <HomeContent />;
}
