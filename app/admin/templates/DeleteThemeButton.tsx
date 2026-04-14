"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteThemeButtonProps {
  modelId: string;
  themeName: string;
}

export default function DeleteThemeButton({
  modelId,
  themeName,
}: DeleteThemeButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Tem a certeza que quer eliminar o modelo "${themeName}"? Esta acção não pode ser desfeita.`,
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/models/${modelId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Falha ao eliminar modelo");
      }

      toast.success(`Modelo "${themeName}" eliminado.`);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao eliminar modelo",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={deleting}
      className="w-full gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      <Trash2 className="size-3.5" />
      {deleting ? "A eliminar..." : "Eliminar"}
    </Button>
  );
}
