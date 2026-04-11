'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useOccurrences } from '@/contexts/occurrences-context';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import type { CreateOccurrenceRequest } from '@/types';

export default function NewOccurrencePage() {
  const router = useRouter();
  const { categories, createOccurrence, isLoading } = useOccurrences();
  const { isAuthenticated } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    street: '',
    number: '',
    neighborhood: '',
    city: 'Itajaí',
    state: 'SC',
    zipcode: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field changes
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }
    if (!formData.categoryId) {
      newErrors.categoryId = 'Categoria é obrigatória';
    }
    if (!formData.street.trim()) {
      newErrors.street = 'Rua é obrigatória';
    }
    if (!formData.number.trim()) {
      newErrors.number = 'Número é obrigatório';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'Cidade é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Você precisa estar logado para criar uma ocorrência');
      router.push('/login');
      return;
    }

    if (!validateForm()) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const request: CreateOccurrenceRequest = {
      title: formData.title,
      description: formData.description || undefined,
      categoryId: parseInt(formData.categoryId),
      address: {
        street: formData.street,
        number: formData.number,
        neighborhood: formData.neighborhood || undefined,
        city: formData.city,
        state: formData.state,
        zipcode: formData.zipcode || '',
      },
    };

    const result = await createOccurrence(request);

    if (result.success) {
      toast.success('Ocorrência criada com sucesso!');
      router.push('/');
    } else {
      toast.error(result.message || 'Erro ao criar ocorrência');
      if (result.errors) {
        const errorMap: Record<string, string> = {};
        result.errors.forEach((err) => {
          errorMap[err.field] = err.message;
        });
        setErrors(errorMap);
      }
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nova Ocorrência</h1>
          <p className="text-muted-foreground">
            Registre um problema urbano para que a prefeitura possa resolver
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Informações da Ocorrência
          </CardTitle>
          <CardDescription>
            Preencha os dados abaixo para registrar uma nova ocorrência
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="title">Título *</FieldLabel>
                <Input
                  id="title"
                  placeholder="Ex: Buraco na Avenida Brasil"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  disabled={isLoading}
                />
                <FieldDescription>
                  Um título claro e objetivo para o problema
                </FieldDescription>
                {errors.title && <FieldError>{errors.title}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="categoryId">Categoria *</FieldLabel>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleChange('categoryId', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && <FieldError>{errors.categoryId}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="description">Descrição</FieldLabel>
                <Textarea
                  id="description"
                  placeholder="Descreva o problema em detalhes..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  disabled={isLoading}
                />
                <FieldDescription>
                  Quanto mais detalhes, mais fácil será para resolver o problema
                </FieldDescription>
              </Field>
            </FieldGroup>

            <div className="border-t pt-6">
              <h3 className="mb-4 font-semibold">Localização</h3>
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field className="sm:col-span-2">
                    <FieldLabel htmlFor="street">Rua *</FieldLabel>
                    <Input
                      id="street"
                      placeholder="Nome da rua"
                      value={formData.street}
                      onChange={(e) => handleChange('street', e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.street && <FieldError>{errors.street}</FieldError>}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="number">Número *</FieldLabel>
                    <Input
                      id="number"
                      placeholder="123"
                      value={formData.number}
                      onChange={(e) => handleChange('number', e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.number && <FieldError>{errors.number}</FieldError>}
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="neighborhood">Bairro</FieldLabel>
                  <Input
                    id="neighborhood"
                    placeholder="Nome do bairro"
                    value={formData.neighborhood}
                    onChange={(e) => handleChange('neighborhood', e.target.value)}
                    disabled={isLoading}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="city">Cidade *</FieldLabel>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.city && <FieldError>{errors.city}</FieldError>}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="state">Estado</FieldLabel>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      disabled={isLoading}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="zipcode">CEP</FieldLabel>
                    <Input
                      id="zipcode"
                      placeholder="00000-000"
                      value={formData.zipcode}
                      onChange={(e) => handleChange('zipcode', e.target.value)}
                      disabled={isLoading}
                    />
                  </Field>
                </div>
              </FieldGroup>
            </div>

            <div className="flex gap-3 border-t pt-6">
              <Button type="button" variant="outline" asChild className="flex-1">
                <Link href="/">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? <Spinner className="mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                Enviar Ocorrência
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
