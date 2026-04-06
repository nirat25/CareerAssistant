'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PHASES } from '@/lib/types';
import {
  ClipboardCheck, Search, Target, FileText, Hammer, Mail, Briefcase, Home, Menu, X, Moon, Sun, User
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const ICON_MAP: Record<string, React.ElementType> = {
  ClipboardCheck, Search, Target, FileText, Hammer, Mail, Briefcase,
};

interface SidebarProps {
  phaseProgress: Record<string, number>;
}

export function Sidebar({ phaseProgress }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDark(!dark);
  };

  const navContent = (
    <nav className="flex flex-col gap-1 p-4">
      <Link
        href="/"
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          pathname === '/' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
        )}
        onClick={() => setMobileOpen(false)}
      >
        <Home className="h-4 w-4" />
        Dashboard
      </Link>

      <Link
        href="/profile"
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          pathname === '/profile' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
        )}
        onClick={() => setMobileOpen(false)}
      >
        <User className="h-4 w-4" />
        My Profile
      </Link>

      <div className="mt-4 mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Phases
      </div>

      {PHASES.map((phase, index) => {
        const Icon = ICON_MAP[phase.icon] || Target;
        const isActive = pathname === phase.path;
        const progress = phaseProgress[phase.id] || 0;

        return (
          <Link
            key={phase.id}
            href={phase.path}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group',
              isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            )}
            onClick={() => setMobileOpen(false)}
          >
            <span className={cn(
              'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
              isActive ? 'bg-primary-foreground text-primary' : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/20'
            )}>
              {index + 1}
            </span>
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{phase.label}</span>
            {progress > 0 && (
              <span className={cn(
                'text-xs',
                isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}>
                {progress}%
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 bg-card border-r z-40 transition-transform md:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Career Assistant</h1>
            <p className="text-xs text-muted-foreground">Your job search copilot</p>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleDark}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
        {navContent}
      </aside>
    </>
  );
}
