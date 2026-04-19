"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

export default function DeleteSTDThemeButton({
  themeId,
  themeName,
}: {
  themeId: string;
  themeName: string;
}) {
  const router = useRouter();

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/save-the-date-themes/${themeId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Modelo eliminado com sucesso");
      router.refresh();
    } catch {
      toast.error("Erro ao eliminar modelo");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:text-destructive gap-1.5"
          />
        }
      >
        <Trash2 className="size-3.5" />
        Eliminar
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar modelo?</AlertDialogTitle>
          <AlertDialogDescription>
            O modelo <strong>{themeName}</strong> será eliminado permanentemente.
            Save the dates que usam este modelo ficarão sem tema.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
