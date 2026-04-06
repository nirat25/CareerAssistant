'use client';

import { Sidebar } from './Sidebar';
import { useCareerData } from '@/hooks/useCareerData';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data, loading } = useCareerData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar phaseProgress={data.phaseProgress} />
      <main className="md:ml-64 min-h-screen">
        <div className="p-6 md:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
