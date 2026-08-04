"use client";

import { Button } from "@/components/ui/button";

interface ImageLayerEditModeControlProps {
  active: boolean;
  hasImages: boolean;
  onActiveChange: (active: boolean) => void;
}

export default function ImageLayerEditModeControl({
  active,
  hasImages,
  onActiveChange,
}: ImageLayerEditModeControlProps) {
  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        variant={active ? "default" : "outline"}
        className="w-full"
        disabled={!hasImages}
        aria-pressed={active}
        onClick={() => onActiveChange(!active)}
      >
        {active
          ? "Concluir edição de imagens"
          : "Editar imagens na pré-visualização"}
      </Button>
      <p className="text-xs text-muted-foreground">
        {active
          ? "As imagens podem ser selecionadas, movidas e redimensionadas na pré-visualização."
          : "Ative este modo para manipular imagens; fora dele, pode editar normalmente os elementos do convite."}
      </p>
    </div>
  );
}
