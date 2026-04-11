import { OccurrencesList } from '@/components/occurrences-list';

export const metadata = {
  title: 'Ocorrências | Fiscaliza Itajaí',
  description: 'Veja todas as ocorrências registradas em Itajaí',
};

export default function OccurrencesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ocorrências</h1>
        <p className="text-muted-foreground">
          Acompanhe todas as ocorrências registradas pela comunidade
        </p>
      </div>

      <OccurrencesList />
    </div>
  );
}
