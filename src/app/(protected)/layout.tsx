import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { ClerkAuthProvider } from '@/contexts/clerk-auth-context';
import { CoworkSelectionProvider } from '@/contexts/cowork-selection-context';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication on server side
  const user = await currentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  return (
    <ClerkAuthProvider>
      <CoworkSelectionProvider>
        {children}
      </CoworkSelectionProvider>
    </ClerkAuthProvider>
  );
}