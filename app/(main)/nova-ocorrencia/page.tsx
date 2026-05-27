'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Send, ImagePlus, X } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useOccurrences } from '@/contexts/occurrences-context';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import type { CreateOccurrenceRequest } from '@/types';

export default function NewOccurrencePage() {
  const router = useRouter();
  const { categories, createOccurrence, reportRecurrence, isLoading } = useOccurrences();
  const { isAuthenticated } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [duplicateDialog, setDuplicateDialog] = useState<{
    open: boolean;
    occurrenceId: number | null;
    title: string;
    recurrenceCount: number;
  }>({ open: false, occurrenceId: null, title: '', recurrenceCount: 0 });

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
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: 'Imagem deve ter no máximo 5MB' }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, image: 'Arquivo deve ser uma imagem' }));
      return;
    }

    setErrors((prev) => ({ ...prev, image: '' }));
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

    const result = await createOccurrence(request, imageFile ?? undefined);

    if (result.success) {
      toast.success('Ocorrência criada com sucesso!');
      router.push('/');
    } else if (result.code === 'OCCURRENCE_ALREADY_EXISTS' && result.data) {
      const existing = result.data as { id: number; title: string; recurrenceCount: number };
      setDuplicateDialog({
        open: true,
        occurrenceId: existing.id,
        title: existing.title,
        recurrenceCount: existing.recurrenceCount,
      });
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

  const handleConfirmRecurrence = async () => {
    if (!duplicateDialog.occurrenceId) return;
    const result = await reportRecurrence(duplicateDialog.occurrenceId);
    if (result.success) {
      toast.success('Sua denúncia foi registrada na ocorrência existente!');
      router.push(`/ocorrencia/${duplicateDialog.occurrenceId}`);
    } else {
      toast.error(result.message || 'Erro ao registrar recorrência');
    }
    setDuplicateDialog({ open: false, occurrenceId: null, title: '', recurrenceCount: 0 });
  };

  return (
    <>
    <AlertDialog open={duplicateDialog.open} onOpenChange={(open) => setDuplicateDialog((d) => ({ ...d, open }))}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ocorrência já registrada</AlertDialogTitle>
          <AlertDialogDescription>
            Já existe uma ocorrência similar neste local:{' '}
            <strong>"{duplicateDialog.title}"</strong> com{' '}
            <strong>{duplicateDialog.recurrenceCount} denúncia(s)</strong>.
            <br /><br />
            Deseja confirmar que o problema ainda persiste? Isso irá adicionar +1 à contagem de denúncias da ocorrência existente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmRecurrence}>
            Confirmar que ainda existe
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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

              <Field>
                <FieldLabel>Foto (opcional)</FieldLabel>
                {imagePreview ? (
                  <div className="relative w-full overflow-hidden rounded-md border">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={600}
                      height={300}
                      className="h-48 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/30 px-4 py-8 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed"
                  >
                    <ImagePlus className="h-8 w-8" />
                    <span className="text-sm">Clique para adicionar uma foto</span>
                    <span className="text-xs">JPEG, PNG, WEBP — máx. 5MB</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleImageChange}
                />
                {errors.image && <FieldError>{errors.image}</FieldError>}
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
    </>
  );
}
