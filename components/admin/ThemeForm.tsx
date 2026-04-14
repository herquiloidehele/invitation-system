"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ModelFormData } from "@/lib/theme-form-data";
import { EMPTY_FORM_DATA } from "@/lib/theme-form-data";

// Re-export for convenience (used by edit pages)
export type { ModelFormData } from "@/lib/theme-form-data";
export { EMPTY_FORM_DATA } from "@/lib/theme-form-data";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ThemeFormProps {
  /** Existing model id — when editing. Omit when creating. */
  modelId?: string;
  initialData?: ModelFormData;
  mode: "create" | "edit";
}

export default function ThemeForm({
  modelId,
  initialData,
  mode,
}: ThemeFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ModelFormData>(
    initialData ?? EMPTY_FORM_DATA,
  );

  function set<K extends keyof ModelFormData>(key: K, value: ModelFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("O identificador (slug) é obrigatório");
      return;
    }
    if (!form.label.trim()) {
      toast.error("O nome do modelo é obrigatório");
      return;
    }

    const payload = {
      name: form.name.trim(),
      label: form.label.trim(),
      description: form.description.trim(),
      component: form.component.trim(),
      previewImage: form.previewImage.trim() || null,
    };

    setSaving(true);
    try {
      const url =
        mode === "create"
          ? "/api/admin/models"
          : `/api/admin/models/${modelId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Falha ao guardar modelo");
      }

      const saved = await res.json();

      toast.success(
        mode === "create" ? "Modelo criado!" : "Modelo atualizado!",
      );

      if (mode === "create") {
        router.push(`/admin/templates/${saved.name}`);
      } else {
        router.push(`/admin/templates/${form.name}`);
      }
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao guardar modelo",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "create" ? "Novo Modelo" : `Editar: ${form.label}`}
        </h1>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving
            ? "A guardar..."
            : mode === "create"
              ? "Criar Modelo"
              : "Guardar Alterações"}
        </Button>
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">
              Slug (identificador único)
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) =>
                set(
                  "name",
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                )
              }
              placeholder="classic-floral"
              disabled={mode === "edit"}
              className="font-mono text-xs"
            />
            {mode === "edit" && (
              <p className="text-[11px] text-muted-foreground">
                O slug não pode ser alterado após criação.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="label" className="text-xs">
              Nome do Modelo
            </Label>
            <Input
              id="label"
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
              placeholder="Classic Floral"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-xs">
            Descrição
          </Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            placeholder="Elegante e romântico com tons rosados..."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="component" className="text-xs">
            Componente React
          </Label>
          <Input
            id="component"
            value={form.component}
            onChange={(e) => set("component", e.target.value)}
            placeholder="ModernMinimal"
            className="font-mono text-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            Nome do componente React (ex: &quot;ModernMinimal&quot;).
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="previewImage" className="text-xs">
            Imagem de Pré-visualização (URL)
          </Label>
          <Input
            id="previewImage"
            value={form.previewImage}
            onChange={(e) => set("previewImage", e.target.value)}
            placeholder="https://..."
            className="text-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            Opcional. URL da imagem de pré-visualização exibida no seletor de
            modelos.
          </p>
        </div>
      </div>
    </div>
  );
}
