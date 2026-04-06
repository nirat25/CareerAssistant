'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCareerData } from '@/hooks/useCareerData';
import { AppShell } from '@/components/layout/AppShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data, loading } = useCareerData();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !data.profile?.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [loading, data.profile?.onboardingCompleted, router]);

  if (loading || !data.profile?.onboardingCompleted) return null;

  return <AppShell>{children}</AppShell>;
}
