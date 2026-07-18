import { CopyPlus } from "lucide-react";

export function InvitationDuplicateNotice({
  sourceCustomerName,
}: {
  sourceCustomerName: string;
}) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
      <div className="flex items-start gap-3">
        <CopyPlus className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-medium">
            Está a criar um novo convite a partir de {sourceCustomerName}.
          </p>
          <p>
            As alterações não afetam o convite original. Ao guardar, será criada
            uma cópia independente do tema selecionado.
          </p>
        </div>
      </div>
    </div>
  );
}
