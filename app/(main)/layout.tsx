import type { ReactNode } from 'react';
import { Providers } from '@/components/providers';
import { Header } from '@/components/header';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </div>
    </Providers>
  );
}
