"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Package,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MediaUpload from "@/components/admin/MediaUpload";
import type { GiftCategoryData, GiftItemData } from "@/lib/types";

// ---------------------------------------------------------------------------
// Lucide icon options for categories
// ---------------------------------------------------------------------------

const CATEGORY_ICON_OPTIONS = [
  { value: "Home", label: "Casa" },
  { value: "UtensilsCrossed", label: "Cozinha" },
  { value: "Plane", label: "Viagem" },
  { value: "Sofa", label: "Sala" },
  { value: "BedDouble", label: "Quarto" },
  { value: "Bath", label: "Banho" },
  { value: "Wine", label: "Bebidas" },
  { value: "ShoppingBag", label: "Decoração" },
  { value: "Dumbbell", label: "Desporto" },
  { value: "BookOpen", label: "Livros" },
  { value: "Gift", label: "Geral" },
  { value: "Heart", label: "Especial" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GiftCatalogFormSectionProps {
  invitationId?: string;
  categories: GiftCategoryData[];
  onCategoriesChange: (categories: GiftCategoryData[]) => void;
}

// ---------------------------------------------------------------------------
// Item Row
// ---------------------------------------------------------------------------

function GiftItemRow({
  item,
  invitationId,
  onUpdate,
  onDelete,
}: {
  item: GiftItemData;
  invitationId: string;
  onUpdate: (updated: GiftItemData) => void;
  onDelete: (id: string) => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleFieldChange = useCallback(
    async (field: keyof GiftItemData, value: string | number | undefined) => {
      const updated = { ...item, [field]: value };
      onUpdate(updated);

      // Auto-save to API
      setSaving(true);
      try {
        await fetch(
          `/api/admin/invitations/${invitationId}/gift-items/${item.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [field]: value ?? null }),
          },
        );
      } catch {
        toast.error("Falha ao guardar item");
      } finally {
        setSaving(false);
      }
    },
    [item, invitationId, onUpdate],
  );

  const handleDelete = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/invitations/${invitationId}/gift-items/${item.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      onDelete(item.id);
    } catch {
      toast.error("Falha ao eliminar item");
    }
  }, [invitationId, item.id, onDelete]);

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      {/* Image upload — top, centered */}
      <div className="flex justify-center">
        <div className="w-32">
          <MediaUpload
            kind="image"
            maxSizeMB={5}
            value={item.imageUrl || undefined}
            onUpload={(url) => handleFieldChange("imageUrl", url)}
            onClear={() => handleFieldChange("imageUrl", undefined)}
            label="Imagem"
          />
        </div>
      </div>

      {/* Name */}
      <div className="space-y-1">
        <Label className="text-xs">Nome</Label>
        <Input
          value={item.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          placeholder="Nome do presente"
          className="h-8 text-sm"
        />
      </div>

      {/* Price + Link side by side */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Preço (R$)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={item.price ?? ""}
            onChange={(e) =>
              handleFieldChange(
                "price",
                e.target.value ? parseFloat(e.target.value) : undefined,
              )
            }
            placeholder="0.00"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Link (opcional)</Label>
          <Input
            value={item.link ?? ""}
            onChange={(e) =>
              handleFieldChange("link", e.target.value || undefined)
            }
            placeholder="https://..."
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Delete button */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="text-destructive hover:text-destructive h-7 text-xs"
        >
          <Trash2 className="mr-1 h-3 w-3" />
          Eliminar
        </Button>
      </div>

      {saving && (
        <p className="text-[10px] text-muted-foreground text-right">
          A guardar...
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category Section
// ---------------------------------------------------------------------------

function CategorySection({
  category,
  invitationId,
  onUpdateCategory,
  onDeleteCategory,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
}: {
  category: GiftCategoryData;
  invitationId: string;
  onUpdateCategory: (id: string, data: Partial<GiftCategoryData>) => void;
  onDeleteCategory: (id: string) => void;
  onUpdateItem: (catId: string, item: GiftItemData) => void;
  onDeleteItem: (catId: string, itemId: string) => void;
  onAddItem: (catId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleNameChange = useCallback(
    async (name: string) => {
      onUpdateCategory(category.id, { name });
      setSaving(true);
      try {
        await fetch(
          `/api/admin/invitations/${invitationId}/gift-categories/${category.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          },
        );
      } catch {
        toast.error("Falha ao guardar categoria");
      } finally {
        setSaving(false);
      }
    },
    [category.id, invitationId, onUpdateCategory],
  );

  const handleIconChange = useCallback(
    async (icon: string) => {
      onUpdateCategory(category.id, { icon });
      setSaving(true);
      try {
        await fetch(
          `/api/admin/invitations/${invitationId}/gift-categories/${category.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ icon }),
          },
        );
      } catch {
        toast.error("Falha ao guardar categoria");
      } finally {
        setSaving(false);
      }
    },
    [category.id, invitationId, onUpdateCategory],
  );

  const handleDeleteCategory = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/invitations/${invitationId}/gift-categories/${category.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      onDeleteCategory(category.id);
      toast.success("Categoria eliminada");
    } catch {
      toast.error("Falha ao eliminar categoria");
    }
  }, [invitationId, category.id, onDeleteCategory]);

  return (
    <div className="rounded-lg border bg-muted/30 overflow-hidden">
      {/* Category header */}
      <div className="flex items-center gap-2 p-3 bg-muted/50">
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 cursor-pointer"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        <div className="flex-1 grid grid-cols-2 gap-2">
          <Input
            value={category.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Nome da categoria"
            className="h-8 text-sm"
          />
          <select
            value={category.icon ?? "Gift"}
            onChange={(e) => handleIconChange(e.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          >
            {CATEGORY_ICON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-muted-foreground shrink-0">
          {category.items.length}{" "}
          {category.items.length === 1 ? "item" : "itens"}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
          onClick={handleDeleteCategory}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>

        {saving && (
          <span className="text-[10px] text-muted-foreground">...</span>
        )}
      </div>

      {/* Items list */}
      {expanded && (
        <div className="p-3 space-y-3">
          {category.items.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum item nesta categoria. Adicione o primeiro!
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {category.items.map((item) => (
              <GiftItemRow
                key={item.id}
                item={item}
                invitationId={invitationId}
                onUpdate={(updated) => onUpdateItem(category.id, updated)}
                onDelete={(itemId) => onDeleteItem(category.id, itemId)}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddItem(category.id)}
            className="w-full h-8 text-xs"
          >
            <Plus className="mr-1.5 h-3 w-3" />
            Adicionar Item
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function GiftCatalogFormSection({
  invitationId,
  categories,
  onCategoriesChange,
}: GiftCatalogFormSectionProps) {
  const [loading, setLoading] = useState(false);

  // Require an invitation ID (only available in edit mode)
  if (!invitationId) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center">
        <Package className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Guarde o convite primeiro para poder adicionar categorias e itens de
          presentes.
        </p>
      </div>
    );
  }

  // ---- Category CRUD ----

  const handleAddCategory = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/invitations/${invitationId}/gift-categories`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Nova Categoria", icon: "Gift" }),
        },
      );
      if (!res.ok) throw new Error();
      const created = await res.json();
      const newCat: GiftCategoryData = {
        id: created.id,
        name: created.name,
        icon: created.icon ?? undefined,
        order: created.order,
        items: [],
      };
      onCategoriesChange([...categories, newCat]);
      toast.success("Categoria criada");
    } catch {
      toast.error("Falha ao criar categoria");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = (
    id: string,
    data: Partial<GiftCategoryData>,
  ) => {
    onCategoriesChange(
      categories.map((cat) => (cat.id === id ? { ...cat, ...data } : cat)),
    );
  };

  const handleDeleteCategory = (id: string) => {
    onCategoriesChange(categories.filter((cat) => cat.id !== id));
  };

  // ---- Item CRUD ----

  const handleAddItem = async (categoryId: string) => {
    try {
      const res = await fetch(
        `/api/admin/invitations/${invitationId}/gift-items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId, name: "Novo Item" }),
        },
      );
      if (!res.ok) throw new Error();
      const created = await res.json();
      const newItem: GiftItemData = {
        id: created.id,
        categoryId: created.categoryId,
        name: created.name,
        imageUrl: created.imageUrl ?? undefined,
        price: created.price ?? undefined,
        link: created.link ?? undefined,
        order: created.order,
      };
      onCategoriesChange(
        categories.map((cat) =>
          cat.id === categoryId
            ? { ...cat, items: [...cat.items, newItem] }
            : cat,
        ),
      );
    } catch {
      toast.error("Falha ao criar item");
    }
  };

  const handleUpdateItem = (catId: string, item: GiftItemData) => {
    onCategoriesChange(
      categories.map((cat) =>
        cat.id === catId
          ? {
              ...cat,
              items: cat.items.map((i) => (i.id === item.id ? item : i)),
            }
          : cat,
      ),
    );
  };

  const handleDeleteItem = (catId: string, itemId: string) => {
    onCategoriesChange(
      categories.map((cat) =>
        cat.id === catId
          ? { ...cat, items: cat.items.filter((i) => i.id !== itemId) }
          : cat,
      ),
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">
          Catálogo de Presentes
        </Label>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddCategory}
          disabled={loading}
          className="h-7 text-xs"
        >
          <Plus className="mr-1 h-3 w-3" />
          Nova Categoria
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Package className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            Ainda não tem categorias. Crie uma para começar a adicionar
            presentes.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCategory}
            disabled={loading}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Criar Primeira Categoria
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <CategorySection
              key={cat.id}
              category={cat}
              invitationId={invitationId}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onAddItem={handleAddItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
