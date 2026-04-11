import type { ReactNode } from 'react';
import { Providers } from '@/components/providers';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}
