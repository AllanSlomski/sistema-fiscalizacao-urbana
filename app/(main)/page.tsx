import { OccurrencesList } from '@/components/occurrences-list';

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground md:p-8">
        <h1 className="text-balance text-2xl font-bold md:text-3xl">
          Fiscaliza Itajaí
        </h1>
        <p className="mt-2 max-w-2xl text-pretty text-primary-foreground/90">
          Ajude a melhorar nossa cidade! Registre problemas urbanos como buracos,
          falta de iluminação, acúmulo de lixo e muito mais. Juntos podemos fazer
          a diferença.
        </p>
      </div>

      {/* Occurrences Feed */}
      <OccurrencesList />
    </div>
  );
}
