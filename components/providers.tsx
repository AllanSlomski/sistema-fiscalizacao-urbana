'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { OccurrencesProvider } from '@/contexts/occurrences-context';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <OccurrencesProvider>{children}</OccurrencesProvider>
    </AuthProvider>
  );
}
