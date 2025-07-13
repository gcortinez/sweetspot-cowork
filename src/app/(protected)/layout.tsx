import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';

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
    <>
      {children}
    </>
  );
}